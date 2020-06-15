import Telegraf, { Markup, Context as TelegrafContext, ContextMessageUpdate } from 'telegraf'

const fs = require('fs-extra')
const LocalSession = require('telegraf-session-local')
import { stripHtml } from './utils'
const chalk = require('chalk')

import noteSpecs from './noteSpecs.config'
import { invoke } from './anki'
import { Note, getNotesNeedingSound, addTagToNote,addTextToFieldInNote, testAnkiConnection } from './ankihelpers'
import { urlToB64 } from './utils'
import { v4 as uuid } from 'uuid'

const bot = new Telegraf(process.env.ANKIBOT_API_TOKEN as string)

interface Session {
	done: number
	notes: Note[]
	note: Note
	textToRecord: string | null
	voicemsg: TelegrafContext['message']
}

declare module 'telegraf' {
	interface ContextMessageUpdate {
		session: Session
	}
}

let allowedIds: string[] = []
if (process.env.ANKIBOT_ALLOWED_IDS) {
	allowedIds = process.env.ANKIBOT_ALLOWED_IDS.split(',')
} else {
	console.log("⚠️: Bot is public and anyone will be able to use it.")
}

bot.use(async (ctx, next) => {
	if (!ctx.chat) {
		await ctx.reply('🟥 Error: could not read your ctx.chat...')
		return
	}
	if (allowedIds.length && !allowedIds.includes(ctx.chat.id + '')) {
		await ctx.reply('🟥 Error :(')
		await ctx.reply(
			'Your chat-id: ' +
			ctx.chat.id +
			' is not in allowedIds. Add your id to the ANKIBOT_ALLOWED_IDS environment variable to use the bot.'
		)
	} else {
		next!()
	}
})

bot.use(new LocalSession({ database: 'db.json', storage: LocalSession.storageFileSync }).middleware())

bot.command('start', async ctx => {
	ctx.session.done = 0 // restart done counter
	await ctx.reply('Welcome to the Anki Bot! ⭐️')
	await ctx.reply('Syncing db & starting recording sesssion...')
	await invoke('sync')
	await refreshState(ctx)
	await ctx.reply('Ready! Please record your voice for the words we send.')
	next(ctx)
})

const refreshState = async (ctx: ContextMessageUpdate) => {
	try {
		ctx.session.notes = await getNotesNeedingSound(noteSpecs)
		await ctx.reply('There are ' + ctx.session.notes.length + ' words to be recorded 🦕')
		return
	} catch (error) {
		console.error(error)
		return ctx.reply('Error when fetching notes from anki :(')
	}
}

const next = async (ctx: ContextMessageUpdate) => {
	const notes = ctx.session.notes

	if (notes.length == 0) {
		ctx.session.textToRecord = null
		ctx.reply('No more words to record! Thanks for the help ♥️')
		return
	}

	if (ctx.session.done % 10 == 0 && ctx.session.done > 0) {
		await ctx.reply('You have done ' + ctx.session.done + ' words. Good job <3')
	}

	const note = notes[0]
	ctx.session.note = note
	ctx.session.textToRecord = stripHtml(note.fields[note.noteSpec.textField].value)
	ctx.session.done++
	await ctx.reply('🎤 ' + ctx.session.textToRecord)
}

bot.on(['voice'], async ctx => {
	console.log(ctx.session)
	if (!ctx.session.textToRecord) {
		ctx.reply('Sorry, please run /start again')
		return
	}
	ctx.session.voicemsg = ctx.message

	ctx.reply(
		'Is the recording good? (if not, record a new one)',
		Markup.inlineKeyboard([Markup.callbackButton('Voice is good', 'savevoice')]).extra()
	)
})

bot.action('savevoice', async ctx => {
	ctx.editMessageReplyMarkup(Markup.inlineKeyboard([]));

	if (!ctx.session.voicemsg || !ctx.session.textToRecord) {
		ctx.reply('Sorry, please run /start again')
		return
	}

	if (!ctx.session.voicemsg.voice) {
		ctx.reply('No voice on the voicemsg object!')
		return
	}

	const url = await ctx.telegram.getFileLink(ctx.session.voicemsg.voice.file_id)
	console.log('url: ', url)

	if (ctx.session.done == 1 || ctx.session.done % 10 == 1) {
		ctx.reply('Checking that the recordings are being saved...')
		await saveVoice(url, ctx.session.textToRecord, ctx.session.note, ctx.chat?.username)
		const oldlength = ctx.session.notes.length
		await refreshState(ctx)
		if (ctx.session.notes.length == oldlength - 1) {
			ctx.reply('✅ Anki DB operational')
		} else {
			ctx.reply('‼️ Something wrong with Anki db. Write /start to try again')
			return
		}
	} else {
		saveVoice(url, ctx.session.textToRecord, ctx.session.note, ctx.chat?.username)
	}

	ctx.session.notes = ctx.session.notes.filter(n => {
		return n.fields[n.noteSpec.textField].value != ctx.session.note.fields[ctx.session.note.noteSpec.textField].value
	})
	next(ctx)
})

export const saveVoice = async (url: string, word: string, note: Note, username?: string) => {
	console.log('Saving voice for word: ', word, note.noteId)
	const filename = 'ankibot-' + uuid() + '.mp3'

	const b64 = await urlToB64(url)

	await invoke('storeMediaFile', {
		filename: filename,
		data: b64,
	})

	for (const targetNote of note.targetNotes) {
		await addTextToFieldInNote(targetNote, '[sound:' + filename + ']', note.noteSpec.soundField)
		await addTagToNote(targetNote, `ankibot:${username}`)
	}
}

bot.command('notifyall', async () => {
	const notes = await getNotesNeedingSound(noteSpecs)
	let msg = '🌈 Bot is online ready for some recording! ' + notes.length + ' sounds needed :)'

	const db = await fs.readJSON('./db.json')
	console.log('db: ', db)
	db.sessions.forEach((s: any) => {
		bot.telegram.sendMessage(s.id.split(':')[0], msg)
	})
})

bot.command('sync', async ctx => {
	const res = await invoke('sync')
	console.log('res: ', res)
	ctx.reply('good')
})

testAnkiConnection()
	.then(() => {
		bot.launch()
	})
	.catch((e: any) => {
		console.error(chalk.red('ERROR: Could not connect to AnkiConnect'))
		console.error(e)
	})

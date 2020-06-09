const Telegraf = require('telegraf')
const { Markup } = Telegraf
const fs = require('fs-extra')
const LocalSession = require('telegraf-session-local')
const stripHtml = require('string-strip-html')
const chalk = require('chalk')

const noteSpecs = require('../noteSpecs.config')
const { invoke } = require('./anki')
const { getNotesNeedingSound, addTextToFieldInNote, testAnkiConnection } = require('./ankihelpers')
const { urlToB64 } = require('./utils')

const bot = new Telegraf(process.env.ANKIBOT_API_TOKEN)

bot.use(new LocalSession({ database: 'db.json' }).middleware())

let allowedIds
if (process.env.ANKIBOT_ALLOWED_IDS) {
  allowedIds = process.env.ANKIBOT_ALLOWED_IDS.split(',')
} else {
  allowedIds = []
}

bot.use(async (ctx, next) => {
  console.log('allowedIds: ', allowedIds, ctx.chat.id)
  if (allowedIds.length && !allowedIds.includes(ctx.chat.id + '')) {
    await ctx.reply('🟥 Error :(')
    await ctx.reply(
      'Your chat-id: ' +
        ctx.chat.id +
        ' is not in allowedIds. Add your id to the ANKIBOT_ALLOWED_IDS environment variable to use the bot.',
    )
  } else {
    next()
  }
})

bot.command('start', async (ctx) => {
  ctx.session.done = 0 // restart done counter
  await ctx.reply('Welcome to the Anki Bot! ⭐️')
  await ctx.reply('Starting recording sesssion...')
  const notes = await getNotesNeedingSound(noteSpecs)
  await refreshState(ctx)
  await ctx.reply('Ready! Please record your voice for the words we send.')
  next(ctx)
})

const refreshState = async (ctx) => {
  try {
    ctx.session.notes = await getNotesNeedingSound(noteSpecs)
    await ctx.reply('There are ' + ctx.session.notes.length + ' words to be recorded 🦕')
    return
  } catch (error) {
    console.error(error)
    return ctx.reply('Error when fetching notes from anki :(')
  }
}

const next = async (ctx) => {
  const notes = ctx.session.notes

  if (notes.length == 0) {
    ctx.session.textToRecord = false
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

bot.on(['voice'], async (ctx) => {
  console.log(ctx.session)
  if (!ctx.session.textToRecord) {
    ctx.reply('Sorry, please run /start again')
    return
  }
  ctx.session.voicemsg = ctx.message

  ctx.reply(
    'Is the recording good? (if not, record a new one)',
    Markup.inlineKeyboard([Markup.callbackButton('Voice is good', 'savevoice')]).extra(),
  )
})

bot.action('savevoice', async (ctx) => {
  if (!ctx.session.voicemsg) {
    ctx.reply('Sorry, please run /start again')
    return
  }

  if (ctx.session.done == 1 || ctx.session.done % 10 == 1) {
    ctx.reply('Checking that the recordings are being saved...')
    await saveVoice(ctx, ctx.session.textToRecord, ctx.session.voicemsg.voice.file_id, ctx.session.note)
    const oldlength = ctx.session.notes.length
    await refreshState(ctx)
    if (ctx.session.notes.length == oldlength - 1) {
      ctx.reply('✅ Anki DB operational')
    } else {
      ctx.reply('‼️ Something wrong with Anki db. Write /start to try again')
      return
    }
  } else {
    saveVoice(ctx, ctx.session.textToRecord, ctx.session.voicemsg.voice.file_id, ctx.session.note)
  }

  ctx.session.notes = ctx.session.notes.filter((n) => {
    return n.fields[n.noteSpec.textField].value != ctx.session.note.fields[ctx.session.note.noteSpec.textField].value
  })
  next(ctx)
})

const saveVoice = async (ctx, word, file_id, note) => {
  console.log('Saving voice for word: ', word, file_id, note.noteId)
  console.log('getting file link')
  const url = await ctx.telegram.getFileLink(file_id)
  console.log('getting file link done')
  const filename = 'ankibot-' + word.replace(/\s/g, '-') + '.mp3'

  b64 = await urlToB64(url)

  await invoke('storeMediaFile', {
    filename: filename,
    data: b64,
  })

  for (const i in note.targetNotes) {
    await addTextToFieldInNote(note.targetNotes[i], '[sound:' + filename + ']', note.noteSpec.soundField)
  }
}

bot.command('notifyall', async (ctx) => {
  const notes = await getNotesNeedingSound(noteSpecs)
  let msg = '🌈 Bot is online ready for some recording! ' + notes.length + ' sounds needed :)'

  const db = await fs.readJSON('./db.json')
  console.log('db: ', db)
  db.sessions.forEach((s) => {
    bot.telegram.sendMessage(s.id.split(':')[0], msg)
  })
})

bot.command('sync', async (ctx) => {
  const res = await invoke('sync')
  console.log('res: ', res)
  ctx.reply('good')
})

testAnkiConnection()
  .then((a) => {
    bot.launch()
  })
  .catch((e) => {
    console.error(chalk.red('ERROR: Could not connect to AnkiConnect'))
    console.error(e)
  })

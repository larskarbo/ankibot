
import noteSpecs from '../src/noteSpecs.config'
import { getNotesNeedingSound } from "../src/ankihelpers"
const fs = require('fs-extra');
import Telegraf from 'telegraf'


const bot = new Telegraf(process.env.ANKIBOT_API_TOKEN as string)
const notify = async () => {

	const notes = await getNotesNeedingSound(noteSpecs)
	if (notes.length == 0) {
		return
	}

	let msg = '🌈 Bot is online ready for some recording! ' + notes.length + ' sounds needed :)'
	console.log('msg: ', msg);

	const db = await fs.readJSON('./db.json')
	// console.log('db: ', db)
	db.sessions
		.filter(s => s.data.registered)
		.forEach((s: any) => {
			bot.telegram.sendMessage(s.id.split(':')[0], msg)
		})
	return
}


notify()

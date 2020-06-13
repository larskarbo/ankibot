// const { FRENCH_DECK, MISSING_VOICE_DECK, getNotesNeedingSound } = require('./lib')
// const config = require('../config')
import Telegraf from 'telegraf'
console.log('Telegraf: ', Telegraf)
const bot = new Telegraf(process.env.ANKIBOT_API_TOKEN as string)
bot.launch()
// const run = async () => {
//   const notes = await getNotesNeedingSound(config)
//   notes.forEach(n => {
//     // console.log(n)
//   })
//   console.log('notes: ', notes.length)
// }

// run()

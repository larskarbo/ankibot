const { FRENCH_DECK, MISSING_VOICE_DECK, getNotesNeedingSound } = require('./lib')
const config = require('../config')

const run = async () => {
  const notes = await getNotesNeedingSound(config)
  notes.forEach((n) => {
    // console.log(n)
  })
  console.log('notes: ', notes.length)
}

run()

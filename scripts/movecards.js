// very buggy script, not made for people to use (yet)

const forvoApi = require('forvo').default

const { invoke } = require('../src/anki')
const noteSpecs = require('../noteSpecs.config')
const chalk = require('chalk')

const { getNotesNeedingSoundFromNoteSpec } = require('../src/ankihelpers')

const moveCards = async () => {
  await invoke('sync')

  for (const i in noteSpecs) {
    const spec = noteSpecs[i]
    console.log(chalk.blue(spec.cardType, 'moving missingcards'))
    const pre = (await invoke('findNotes', { query: 'deck:' + spec.prefferedDeck })).length
    console.log('deck:' + spec.prefferedDeck)
    const notes = await getNotesNeedingSoundFromNoteSpec(spec)
    const cards = notes.map((n) => n.cards).flat()
    const res = await invoke('changeDeck', { cards, deck: spec.missingVoiceDeck })
    const post = (await invoke('findNotes', { query: 'deck:' + spec.prefferedDeck })).length
    console.log(chalk.green('moved ' + (pre - post) + ' notes to ' + spec.prefferedDeck))

    console.log(chalk.blue(spec.cardType, 'moving voicecards'))
    const notesNeedingSound = await getNotesNeedingSoundFromNoteSpec(spec)
    const result2 = await invoke('findNotes', {
      query: 'deck:' + spec.missingVoiceDeck,
    })
    const notesIdsNotNeedingSound = result2.filter((n) => {
      return !notesNeedingSound.find((nns) => nns.noteId == n)
    })
    const notesNotNeedingSound = await invoke('notesInfo', { notes: notesIdsNotNeedingSound })

    const cards2move = notesNotNeedingSound.map((n) => n.cards).flat()
    const res4 = await invoke('changeDeck', { cards: cards2move, deck: spec.prefferedDeck })
    console.log(chalk.green('moved ' + notesNotNeedingSound.length + ' notes'))
  }

  await invoke('sync')
}

moveCards()

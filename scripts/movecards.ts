// very buggy script, not made for people to use (yet)

const { invoke } = require('../src/anki')
import noteSpecs from '../src/noteSpecs.config'
const chalk = require('chalk')

import { getNotesNeedingSoundFromNoteSpec, countNotes, NoteSpec, Note, getNotes } from '../src/ankihelpers'

const moveCards = async () => {
  await invoke('sync')

  for (const spec of noteSpecs) {
    console.log(chalk.blue(spec.cardType, 'moving missingcards'))

    await moveMissingNotes(spec)
    await moveGoodNotes(spec)
  }

  await invoke('sync')
}

const moveMissingNotes = async (spec: NoteSpec) => {
  const pre = await countNotes('deck:' + spec.prefferedDeck)
  // console.log('deck:' + spec.prefferedDeck)
  const notes = await getNotesNeedingSoundFromNoteSpec(spec)
  console.log('notes: ', notes.length)
  const cards = notes.map(n => n.cards).flat()
  await invoke('changeDeck', { cards, deck: spec.missingVoiceDeck })
  const post = await countNotes('deck:' + spec.prefferedDeck)
  console.log(chalk.green('moved ' + (pre - post) + ' notes to ' + spec.prefferedDeck))
}

const moveGoodNotes = async (spec: NoteSpec) => {
  console.log(chalk.blue(spec.cardType, 'moving voicecards'))

  const notesNeedingSound = await getNotesNeedingSoundFromNoteSpec(spec)
  const notesInMissinVoiceDeck: Note[] = await getNotes('deck:' + spec.missingVoiceDeck)

  const malplacedNotes = notesInMissinVoiceDeck.filter(n => {
    return !notesNeedingSound.find(nns => nns.noteId == n.noteId)
  })

  const cards2move = malplacedNotes.map(n => n.cards).flat()
  await invoke('changeDeck', { cards: cards2move, deck: spec.prefferedDeck })
  console.log(chalk.green('moved ' + malplacedNotes.length + ' notes'))
}

moveCards()

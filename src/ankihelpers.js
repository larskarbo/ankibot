const FRENCH_DECK = 'all::French'
const MISSING_VOICE_DECK = 'missingvoice'
const { uniqBy, groupBy } = require('lodash')
const { invoke } = require('./anki')

const testAnkiConnection = () => invoke('version')

const getNotesNeedingSoundFromNoteSpec = async (noteSpec) => {
  const res = await invoke('findNotes', { query: 'deck:' + noteSpec.deck + ' "note:' + noteSpec.cardType + '"' })
  const noteIds = [...new Set(res)] //removes duplicates
  const notes = await invoke('notesInfo', { notes: noteIds })

  const notesWithoutSound = notes.filter((m) => {
    const f = m.fields[noteSpec.soundField].value
    if (!f.includes('[sound:')) {
      return true
    }
    return false
  })

  // remove duplicates
  const notesWithoutDuplicates = []
  const grouped = groupBy(notesWithoutSound, (n) => n.fields[noteSpec.textField].value)
  for (const prop in grouped) {
    const thisNote = {
      ...grouped[prop][0],
      targetNotes: grouped[prop].map((n) => n.noteId),
    }
    notesWithoutDuplicates.push(thisNote)
  }
  return notesWithoutDuplicates
}

const getNotesNeedingSound = async (noteSpecs) => {
  const notes = []
  for (const noteSpec of noteSpecs) {
    const notesFromThisNoteSpec = await getNotesNeedingSoundFromNoteSpec(noteSpec)

    notesFromThisNoteSpec.forEach((n) =>
      notes.push({
        ...n,
        noteSpec,
      }),
    )
  }

  return [...new Set(notes)]
}

const addTextToFieldInNote = async (noteId, text, field) => {
  const note = (await invoke('notesInfo', { notes: [noteId] }))[0]
  const currentContents = note.fields[field].value
  await invoke('updateNoteFields', {
    note: {
      id: noteId,
      fields: {
        [field]: currentContents + text,
      },
    },
  })
}

module.exports = {
  getNotesNeedingSound,
  testAnkiConnection,
  addTextToFieldInNote,
}

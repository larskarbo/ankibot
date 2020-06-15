const { groupBy, values } = require('lodash')
const { invoke } = require('./anki')
import {stripHtml} from './utils'

export const testAnkiConnection = () => invoke('version')

export interface Note {
  noteId: number
  fields: {
    [property: string]: {
      value: string
    }
  }
  modelName: string
  cards: {
    [index: number]: number
  }
  tags: {
    [index: number]: string
  }
  noteSpec: NoteSpec
  targetNotes: number[]
}

export interface NoteSpec {
  deck: string
  cardType: string
  textField: string
  soundField: string
  missingVoiceDeck?: string
  prefferedDeck?: string
}

export const getNotes = async (query: string): Promise<Note[]> => {
  const res = await invoke('findNotes', { query })
  const noteIds = [...new Set(res)] //removes duplicates
  const notes: Note[] = await invoke('notesInfo', { notes: noteIds })
  return notes
}

export const countNotes = async (query: string) => {
  const noteIdsPre = await invoke('findNotes', { query })
  const noteIds = [...new Set(noteIdsPre)] //removes duplicates
  return noteIds.length
}

export const getNotesNeedingSoundFromNoteSpec = async (noteSpec: NoteSpec): Promise<Note[]> => {
  const notes = await getNotes('deck:' + noteSpec.deck + ' "note:' + noteSpec.cardType + '"')

  const notesWithoutSound: Note[] = notes.filter(m => {
    const f = m.fields[noteSpec.soundField].value
    if (!f.includes('[sound:')) {
      return true
    }
    return false
  })

  return notesWithoutSound
}

const removeDuplicatesAndAddTargetNotes = (notes: Note[], spec: NoteSpec) => {
  // remove duplicates
  const notesWithoutDuplicates: Note[] = []
  const grouped: Array<Note[]> = values(groupBy(notes, (n: Note) => stripHtml(n.fields[spec.textField].value)))
  grouped.forEach(group => {
    const thisNote: Note = {
      ...group[0],
      targetNotes: group.map((n: Note) => n.noteId),
    }
    notesWithoutDuplicates.push(thisNote)
  })
  return notesWithoutDuplicates
}

export const getNotesNeedingSound = async (noteSpecs: NoteSpec[]): Promise<Note[]> => {
  const notes: Note[] = []
  for (const noteSpec of noteSpecs) {
    const notesFromThisNoteSpec = removeDuplicatesAndAddTargetNotes(
      await getNotesNeedingSoundFromNoteSpec(noteSpec),
      noteSpec,
    )

    notesFromThisNoteSpec.forEach(n =>
      notes.push({
        ...n,
        noteSpec,
      }),
    )
  }

  return [...new Set(notes)]
}

export const addTextToFieldInNote = async (noteId: number, text: string, field: string) => {
  const note: Note = (await invoke('notesInfo', { notes: [noteId] }))[0]
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

export const addTagToNote = async (noteId: number, tag: string) => {
	await invoke("addTags", {
		notes: [noteId],
		tags: tag
	})
}

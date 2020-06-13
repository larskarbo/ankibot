import { NoteSpec, getNotesNeedingSound } from '../src/ankihelpers'
import { invoke } from '../src/anki'
import { saveVoice } from '../src/index'

const ANKI_TEST_DECK = 'z__tests'
const spec: NoteSpec = {
  deck: ANKI_TEST_DECK + '::' + Math.floor(Math.random() * 100),
  cardType: '3. All-Purpose Card',
  textField: '- The full sentence (no words blanked out)',
  soundField: '- Extra Info (Pronunciation, personal connections, conjugations, etc)',
  missingVoiceDeck: 'missingvoice-all-purp',
  prefferedDeck: 'all::french-grammar',
}

jest.setTimeout(30000)

test('Should add 3 notes to test deck', async () => {
  await invoke('createDeck', {
    deck: spec.deck,
  })

  for (const text of ['test1', 'test1', 'test2']) {
    await invoke('addNote', {
      note: {
        deckName: spec.deck,
        modelName: spec.cardType,
        options: {
          allowDuplicate: true,
        },
        fields: {
          'Front (Example with word blanked out or missing)': 'test',
          [spec.textField]: text,
          [spec.soundField]: 'back content',
        },
      },
    })
  }

  const notes = await invoke('findNotes', { query: 'deck:' + spec.deck + ' "note:' + spec.cardType + '"' })
  console.log('notes: ', notes)

  expect(notes.length).toBe(3)
})

test('Should give 2 notes', async () => {
  const notes = await getNotesNeedingSound([spec])
  expect(notes.length).toBe(2)
})

test('Should add sounds to all 3 cards', async () => {
  const OGA_EXAMPLE = 'https://www.mariowiki.com/images/a/a2/Example.oga'

  const notes = await getNotesNeedingSound([spec])
  for (const note of notes) {
    await saveVoice(OGA_EXAMPLE, note.noteId + '-sound', note)
  }

  return getNotesNeedingSound([spec]).then(notes => {
    return expect(notes.length).toBe(0)
  })
})

test('Should delete testdeck', async () => {
  const res = await invoke('deleteDecks', {
    decks: [ANKI_TEST_DECK],
  })
  expect(res).toBe(null)
})

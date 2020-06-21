import { NoteSpec } from './ankihelpers'

const specs: NoteSpec[] = [
  {
    deck: '*',
    cardType: '3. All-Purpose Card',
    textField: '- The full sentence (no words blanked out)',
    soundField: '- Extra Info (Pronunciation, personal connections, conjugations, etc)',
    missingVoiceDeck: 'missingvoice-all-purp',
    prefferedDeck: 'all::French',
  },
  {
    deck: '*',
    cardType: '2. Picture Words',
    textField: 'Word',
    soundField: 'Pronunciation (Recording and/or IPA)',
    missingVoiceDeck: 'missingvoice',
    prefferedDeck: 'all::French',
  },
]

export default specs

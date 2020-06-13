import { testAnkiConnection } from '../src/ankihelpers'

test('Should connect to Anki', async () => {
  const res = await testAnkiConnection()
  expect(res).toBeTruthy()
})

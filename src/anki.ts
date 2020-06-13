const fetch = require('node-fetch')
const VERSION = 6
const ANKI_SERVER = process.env.ANKI_SERVER || 'http://127.0.0.1:8765'

export function invoke(action: string, params = {}) {
  return fetch(ANKI_SERVER, {
    method: 'POST',
    body: JSON.stringify({ action, version: VERSION, params }),
    headers: {
      'Content-Type': 'application/json', // IMPORTANT
    },
  })
    .then((a: any) => a.json())
    .then((a: any) => {
      if (a.error) {
        throw new Error(a.error)
      }
      return a.result
    })
}

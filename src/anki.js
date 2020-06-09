const fetch = require('node-fetch')
const VERSION = 6
const ANKI_SERVER = process.env.ANKI_SERVER || 'http://127.0.0.1:8765'
console.log('ANKI_SERVER: ', ANKI_SERVER)

function invoke(action, params = {}) {
  return fetch(ANKI_SERVER, {
    method: 'POST',
    body: JSON.stringify({ action, version: VERSION, params }),
    headers: {
      'Content-Type': 'application/json', // IMPORTANT
    },
  })
    .then((a) => a.json())
    .then((a) => {
      return a.result
    })
}

module.exports = { invoke }

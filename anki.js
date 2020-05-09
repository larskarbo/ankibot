const fetch = require('node-fetch');
const VERSION = 6
const ANKI_SERVER = 'http://127.0.0.1:8765'
// const ANKI_SERVER = 'http://cyrielles-mac-mini.local:8765'
function invoke(action, params = {}) {
  console.log("running", action)
  return fetch(ANKI_SERVER, {
    method: "POST",
    body: JSON.stringify({ action, version:VERSION, params }),
    headers: {
      'Content-Type': 'application/json' // IMPORTANT
    },
  })
    .then(a => a.json())
    .then(a => {
      return a.result
    })
    .catch(a => {
      console.log('failed to issue request', a)
    })
}



module.exports = { invoke }
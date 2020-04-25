const fetch = require('node-fetch');
const VERSION = 6
function invoke(action, params = {}) {
  console.log("running", action)
  return fetch('http://127.0.0.1:8765', {
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
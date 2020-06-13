var ffmpeg = require('fluent-ffmpeg')
const fs = require('fs-extra')

export const urlToB64 = (url: string): Promise<string> => {
  return new Promise(resolve => {
    ffmpeg(url)
      .output('temp.mp3')
      .on('end', function() {
        console.log('Finished processing')
        const b64 = fs.readFileSync('temp.mp3').toString('base64')
        resolve(b64)
      })
      .run()
  })
}

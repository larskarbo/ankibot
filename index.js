const Telegraf = require('telegraf')
const { Router, Markup } = Telegraf
const { invoke } = require("./anki")
const fs = require("fs-extra")
const path = require("path")
const shuffle = require("shuffle-array")
const { exec } = require("child_process");
const Composer = require('telegraf/composer')
var ffmpeg = require('fluent-ffmpeg');

const db = {
  "lars": 912275377,
  "cyri": 501141030
}

const state = {
  done: 0
}


const bot = new Telegraf("1196576929:AAFCVPBTMcSUlrHAIFBO_Ni7e9em0Nje10U")

const refreshState = async (ctx) => {
  try {
    state.notes = await getNotes()
    ctx.reply('ANKI DB:: ' + state.notes.length + " words to be recorded")
    return
  } catch (error) {
    console.error(error);
    // expected output: ReferenceError: nonExistentFunction is not defined
    // Note - error messages will vary depending on browser
    return ctx.reply("Error when fetching notes from anki :(")
  }
}

bot.start((ctx) => ctx.reply('Welcome try /frenchrecord'))
bot.help((ctx) => ctx.reply('Try /frenchrecord'))


bot.command('frenchrecord', async (ctx) => {
  console.log("is this cyri?", ctx.from.id, ctx.chat.id)
  ctx.reply('Starting french sesssion...')
  await refreshState(ctx)
  ctx.reply('Ready! Please record your voice for the words we send.')
  next(ctx)
})
// bot.command('horse', (ctx) => {
//   ctx.reply('Starting french sesssion')

// })


const getNotes = async () => {

  const result1 = await invoke('findNotes', { query: "deck:French" });
  console.log('result1: ', result1);
  const result2 = await invoke('findNotes', { query: "deck:missingvoice" });
  console.log('result2: ', result2);
  const notes = await invoke('notesInfo', { notes: [...result1, ...result2] })
  // console.log('notes: ', notes);


  return notes.filter(m => m.modelName == '2. Picture Words')
    .filter(m => {
      const f = m.fields['Pronunciation (Recording and/or IPA)']
      if (typeof f == 'undefined') {
        return true
      }
      if (!f.value.includes("[sound:")) {
        return true
      }
      return false
    })
}


bot.command('good', (ctx) => {
  // console.log(ctx.from.id, ctx.chat.id)
  ctx.reply('good')
  // return ctx.wizard.next()
})

bot.command('sync', async (ctx) => {
  const res = await invoke('sync', { query: "deck:French" });
  console.log('res: ', res);
  ctx.reply('good')
})

const next = async ctx => {

  const notes = state.notes

  console.log('notes: ', notes.length);
  if (notes.length == 0) {
    state.word = false
    ctx.reply("No more words to record! Thanks for the help ♥️")
    return
  }
  if (state.done % 10 == 0 && state.done > 0) {
    ctx.reply("You have done " + state.done + " words. Good job <3")

  }

  const note = notes[Math.floor(Math.random() * notes.length)]
  state.note = note
  state.word = note.fields.Word.value
  state.done++
  ctx.reply("🎤 (article) + " + state.word)
  console.log("🎤 (article) +  " + state.word)
}

bot.on(['voice'], async (ctx) => {
  if (!state.word) {
    ctx.reply('Sorry, please run /frenchrecord again')
    return
  }
  state.voicemsg = ctx.message

  ctx.reply('Good?', Markup.inlineKeyboard([
    Markup.callbackButton('Voice is good', 'savevoice'),
  ]).extra())
})

bot.action('savevoice', async (ctx) => {
  if (!state.voicemsg) {
    ctx.reply('Sorry, please run /frenchrecord again')
    return
  }

  if (state.done == 1 || state.done % 10 == 1) {
    ctx.reply('Checking that the recordings are being saved...')
    await saveVoice(ctx, state.word, state.voicemsg.voice.file_id, state.note.noteId)
    const oldlength = state.notes.length
    await refreshState(ctx)
    if (state.notes.length == oldlength - 1) {
      ctx.reply('✅ Anki DB operational')
    } else {
      ctx.reply('‼️ Something wrong with Anki db. Write /frenchrecord to try again')
      return
    }
  } else {
    saveVoice(ctx, state.word, state.voicemsg.voice.file_id, state.note.noteId)
  }

  state.notes = state.notes.filter(n => n.fields.Word.value != state.word)
  next(ctx)
})

const urlToB64 = (url) => {
  return new Promise(resolve => {
    ffmpeg(url)
      .output("temp.mp3")
      .on('end', function () {
        console.log('Finished processing');
        const b64 = fs.readFileSync("temp.mp3").toString('base64');
        resolve(b64)
      })
      .run();
  })
}

const saveVoice = async (ctx, word, file_id, noteId) => {
  console.log('Saving voice for word: ', word, file_id, noteId)
  console.log('getting file link')
  const url = await ctx.telegram.getFileLink(file_id)
  console.log('getting file link done')
  const filename = "larsthebot-" + word.replace(/\s/g, '-') + ".mp3"

  b64 = await urlToB64(url)



  await invoke('storeMediaFile', {
    filename: filename,
    data: b64
  })

  const info = (await invoke('notesInfo', {
    notes: [noteId]
  }))[0]
  console.log('info: ', info);
  const currentPron = info.fields['Pronunciation (Recording and/or IPA)'].value
  await invoke('updateNoteFields', {
    note: {
      id: noteId,
      fields: {
        'Pronunciation (Recording and/or IPA)': currentPron + "[sound:" + filename + "]"
      }
    }
  })

  await invoke('addTags', {
    notes: [noteId],
    tags: "horses"
  })
}

bot.hears('hi', (ctx) => ctx.reply('Hey there'))
bot.launch()


bot.command('movecards', async (ctx) => {
  ctx.reply('Moving cards from french to missingvoice...')
  const notes = await getNotes()
  const cards = notes.map(n => n.cards).flat()
  const res = await invoke('changeDeck', { cards, deck: "missingvoice" });
  ctx.reply("moved " + notes.length + " notes")
  ctx.reply('Moving cards from missingvoice to french...')
  const result2 = await invoke('findNotes', { query: "deck:missingvoice" });
  const notes2 = await invoke('notesInfo', { notes: [...result2] })
  const notes3 = notes2.filter(m => m.modelName == '2. Picture Words')
    .filter(m => {
      const f = m.fields['Pronunciation (Recording and/or IPA)']
      if (typeof f == 'undefined') {
        return false
      }
      if (!f.value.includes("[sound:")) {
        return false
      }
      return true
    })
  const cards2 = notes3.map(n => n.cards).flat()
  const res2 = await invoke('changeDeck', { cards: cards2, deck: "French" });
  ctx.reply("moved " + notes3.length + " notes")
  ctx.reply('All good.')
})

// bot.telegram.sendMessage(db["cyri"], "Thank you cyrielle, this bot is very happy now")

bot.command('prune', async (ctx) => {
  ctx.reply('Removing entries where sound file is missing...')
  const result1 = await invoke('findNotes', { query: "deck:missingvoice" });
  const result2 = await invoke('findNotes', { query: "deck:French" });
  const notes2 = await invoke('notesInfo', { notes: [...result1, ...result2] })

  for (const n of notes2) {
    const pr = n.fields['Pronunciation (Recording and/or IPA)']
    if (pr && pr.value.includes("[sound:")) {
      // console.log(pr.value)
      var regExp = /\[sound:[^\]]+\]/;
      var matches = regExp.exec(pr.value)
      console.log('matches: ', matches);
      // console.log('matches: ', matches[1]);
      const file = matches[0].split(":")[1].replace("]", "")
      console.log('file: ', file);
      const exists = await fs.pathExists(path.join(process.env.ANKI_MEDIA, file))
      // console.log(file, exists)
      // continue
      if (!exists) {
        ctx.reply("removing for sound ", n.fields['Word'])
        // await invoke('updateNoteFields', {
        //   note: {
        //     id: n.noteId,
        //     fields: {
        //       'Pronunciation (Recording and/or IPA)': n.fields['Pronunciation (Recording and/or IPA)'].value.replace(matches[0], "")
        //     }
        //   }
        // })
      }
    }
    // console.log(process.env.ANKI_MEDIA)
    // await fs.pathExists(path.join(process.env.ANKI_MEDIA))
  }
  ctx.reply("done")
})


// const convertMp3 = async (ctx) => {
//   // ctx.reply('Getting notes...')
//   const notes = await invoke('findNotes', { query: "deck:French" });
//   const notes2 = await invoke('findNotes', { query: "deck:missingvoice" });
//   const notesWithInfo = await invoke('notesInfo', { notes: [...notes, ...notes2] })
//   // console.log('notesWithInfo: ', notesWithInfo);
//   const na = notesWithInfo
//     .map(n => [n, n.fields['Pronunciation (Recording and/or IPA)']])
//     .filter(a => typeof a[1] != 'undefined')
//     .map(a => a[0])

//   for(const n of na){
//     console.log(n.fields.Word)
//     console.log(n.fields['Pronunciation (Recording and/or IPA)'])
//     console.log(n.fields['Pronunciation (Recording and/or IPA)'].value.replace(".oga", ".mp3"))
    // await invoke('updateNoteFields', {
    //   note: {
    //     id: n.noteId,
    //     fields: {
    //       'Pronunciation (Recording and/or IPA)': n.fields['Pronunciation (Recording and/or IPA)'].value.replace(".oga", ".mp3")
    //     }
    //   }
    // })
//   }
//   exec("./anki_media_convert.sh")
//   // ctx.reply('All good.'4)
// }

const forvoApi = require("forvo").default;

const { invoke } = require("./anki")
const {
	getNotes,
	ensure
} = require("./lib")
var h2p = require('html2plaintext')

ensure()

const forvoMan = async () => {
  const forvo = forvoApi({ key: "16472533d60aa4868fa3a4c1af6c6f4c" });
  const notes = await getNotes();
  console.log(notes.map((n) => n.fields.Word.value));

  const next = async () => {
    // const note = notes.find(n => n.fields.Word.value == "saison")
		// const note = notes[Math.floor(Math.random() * notes.length)]
		if(notes.length == 0){
			return
		}
    const note = notes.pop();

    const word = h2p(note.fields.Word.value);
    const extraRaw =
      note.fields["Gender, Personal Connection, Extra Info (Back side)"].value;
    console.log("extraRaw: ", extraRaw);
    const extra = h2p(
      extraRaw.replace(/<div>/g, "\n").replace(/<\/div>/g, "\n") + " "
    );
    console.log("extra: ", extra);
    console.log("word: ", word);
    let soundAdded = false;

    const tryAddSound = async (phrase) => {
      console.log("trying: ", phrase);
      if (soundAdded) {
        return;
      }
      const prons = await forvo.standardPronunciation({ word, language: "fr" });
      if (!prons.items || prons.items.length == 0) {
        return false;
      }
      const item = prons.items[0];

      const filename = "forvo-" + word.replace(/\s/g, "-") + ".mp3";
      await invoke("storeMediaFile", {
        filename: filename,
        url: item.pathmp3,
      });

      const info = (
        await invoke("notesInfo", {
          notes: [note.noteId],
        })
      )[0];
      console.log("info: ", info);
      const currentPron =
        info.fields["Pronunciation (Recording and/or IPA)"].value;
      await invoke("updateNoteFields", {
        note: {
          id: note.noteId,
          fields: {
            "Pronunciation (Recording and/or IPA)":
              currentPron + "[sound:" + filename + "]",
          },
        },
      });
      soundAdded = true;
    };

    if (/(F|M)\W/.test(extra)) {
      console.log("extra: ", extra);
      const gender = /(F|M)\W/.exec(extra)[1];
      console.log("gender: ", gender);
      if (gender == "M") {
        await tryAddSound("un " + word);
        await tryAddSound("le " + word);
      } else if (gender == "F") {
        await tryAddSound("une " + word);
        await tryAddSound("la " + word);
      }
    }
    await tryAddSound(word);
		await new Promise(r => setTimeout(r,1000));
		await next()
  };
	await next();
	invoke("sync")
};

forvoMan();

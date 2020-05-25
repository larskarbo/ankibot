const FRENCH_DECK = "deck:all::French";
const MISSING_VOICE_DECK = "deck:missingvoice";

const { invoke } = require("./anki");

const ensure = () => {
  invoke("version").then((a) => {
    console.log("Success", a);
    if (!a) {
			throw new Error("open anki!");
    }
  });
};
const getNotes = async () => {
  const result1 = await invoke("findNotes", { query: FRENCH_DECK });
  const result2 = await invoke("findNotes", { query: MISSING_VOICE_DECK });
  const notesIds = [...new Set([...result1, ...result2])]; // <- set removes duplicates
  const notes = await invoke("notesInfo", { notes: notesIds });

  return notes
    .filter((m) => m.modelName == "2. Picture Words")
    .filter((m) => {
      const f = m.fields["Pronunciation (Recording and/or IPA)"];
      if (typeof f == "undefined") {
        return true;
      }
      if (!f.value.includes("[sound:")) {
        return true;
      }
      return false;
    });
};

module.exports = {
  getNotes,
	FRENCH_DECK,
	ensure,
  MISSING_VOICE_DECK,
};

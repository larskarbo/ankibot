const forvoApi = require("forvo").default;

const { invoke } = require("./anki");
const { FRENCH_DECK, MISSING_VOICE_DECK, getNotes } = require("./lib");

const moveCards = async () => {
  await invoke("sync");
  console.log("Moving cards from french to missingvoice...");
  const pre = (await invoke("findNotes", { query: "deck:" + FRENCH_DECK }))
    .length;
  const notes = await getNotes();
  const cards = notes.map((n) => n.cards).flat();
  const res = await invoke("changeDeck", { cards, deck: MISSING_VOICE_DECK });
  const post = (await invoke("findNotes", { query: "deck:" + FRENCH_DECK }))
    .length;
  console.log("moved " + (post - pre) + " notes");
  console.log("Moving cards from missingvoice to french...");
  const result2 = await invoke("findNotes", {
    query: "deck:" + MISSING_VOICE_DECK,
  });
  const notes2 = await invoke("notesInfo", { notes: [...result2] });
  const notes3 = notes2
    .filter((m) => m.modelName == "2. Picture Words")
    .filter((m) => {
      const f = m.fields["Pronunciation (Recording and/or IPA)"];
      if (typeof f == "undefined") {
        return false;
      }
      if (!f.value.includes("[sound:")) {
        return false;
      }
      return true;
    });
  const cards2 = notes3.map((n) => n.cards).flat();
  const res2 = await invoke("changeDeck", { cards: cards2, deck: FRENCH_DECK });
  console.log("moved " + notes3.length + " notes");
  console.log("All good.");

  await invoke("sync");
};

moveCards();

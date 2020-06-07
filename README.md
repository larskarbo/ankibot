<div align="center">
	<img src="stuff/logo.png" width="200" height="200">
	<h1>AnkiBot</h1>
	<p>
		<b>Telegram Bot for Anki Sound Recording</b>
	</p>
	<br>
</div>

![Github open issues](https://img.shields.io/github/issues-raw/larskarbo/ankibot)
![Bitbucket open issues](https://img.shields.io/github/issues-pr/larskarbo/ankibot)
![GitHub contributors](https://img.shields.io/github/contributors/larskarbo/ankibot)
![David](https://img.shields.io/david/larskarbo/ankibot)
[![Generic badge](https://img.shields.io/badge/🥁-larskarbo-Blue.svg)](https://larskarbo.no/)

<div align="center">
	<img src="stuff/demo.gif" width="300">
</div>

## Features

- **Ease-of-use.** The Telegram makes it is easy to record sounds on any platform.
- **Perfect for outsourcing.** No need to split mp3s and work with audio manually. Just point your coach to the bot!
- **Flexible api.** Define which notes you want to have recorded in `noteSpec.js`. Specify field, deck and card type.
- **MP3s.** Converts all sound files to mp3 so cards run on any platform.
- **Multi-note smartness.** If you have the same word/sentence to be recorder on multiple notes, it will automatically add the sound to all notes.
- **Performance.** Asynchronous network actions means you will never be waiting for the database.
- **Secure.** Periodically checks if sounds are being recorded properly and saved to the Anki DB.
- **Retry possibility.** Listen to your recording and do another recording right away if you are not satisfied.
- **Any language or learning material.** Ankibot is not tied up to a specific language or subject! Use it for whatever you need sounds for.
- **Access control.** To prevent abuse, you can specify which chat-ids you want to have access.
- **Emojis.** 🎤🌈

⚠️ **NB:** You will need to create your own new bot user on Telegram and host it on your. This is because Anki does not yet have an official public API.

## Installation

You will need:

- Telegram bot api token. ([create a bot](https://core.telegram.org/bots))
- A computer running [Anki](https://apps.ankiweb.net/) and the [AnkiConnect](https://ankiweb.net/shared/info/2055492159) plugin
- [Node.js](https://nodejs.org/en/) and [yarn](https://yarnpkg.com/)
- Have [ffmpeg](http://www.ffmpeg.org/) installed on your system.

When you have these ↑, _clone_ the repo and run this command:

Install dependencies:

```
yarn install
```

Remember to also set the `ANKIBOT_API_TOKEN` environment variable to your bot token API.

## Configure noteSpecs - `noteSpecs.config.js`

In the `noteSpecs.config.js` file you can specify which notes you want sounds for and how `ankibot` should work with them.

You can add multiple _noteSpecs_.

This is the format:

```javascript
const noteSpec = {
  deck: 'french', // Which decks do you want to search?
  cardType: '2. Picture Words', // Which card types do you want to add sounds to?
  textField: 'Word', // Which field in the note contains the _text to record_?
  soundField: 'Pronunciation', // Which field in the note will contain the pronounciation file?
}
```

Add the noteSpecs to the `noteSpecs.config.js` file like this:

```javascript
module.exports = [noteSpec1, noteSpec2]
```

## Running the bot

From your computer, run:

```
yarn start
```

In **Telegram**, message the bot:

```
/start
```

## Bot API

### `/start`

Starts a recording session and gives you the first word.

### `/notifyall`

Notifies all registered users of the app that the app is online and ready for recording.

### `/sync`

Syncs Anki with AnkiWeb

## Access control

### `ANKIBOT_ALLOWED_IDS`

By default, all chat-ids are accepted. If you add chat-ids to the env variable `ANKIBOT_ALLOWED_IDS` access control is on.

Format (delimited by comma): `ANKIBOT_ALLOWED_IDS=12341234,23452345,34563456`

module.exports = {
  apps: [
    {
      name: 'ankibot',
			script: './node_modules/.bin/ts-node',
			args: 'src/index.ts'
    },
  ],
}

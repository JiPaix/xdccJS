const fs = require('fs')
const axios = require('axios')
const { Client, Intents, MessageEmbed } = require('discord.js');

const version = require('../package.json').version

let changelog = fs.readFileSync('./CHANGELOG.md').toString().split('---')[0].split(/(?=###)/gm)
changelog.shift()

const discordFields = []

axios.default.post('https://api.github.com/repos/jipaix/xdccjs/releases', {
    tag_name: 'v'+version,
    name: version,
    body: changelog
  },
  {
    headers: {
      'Accept': 'application/vnd.github.v3+json',
      'Authorization': 'token process.env.PA_TOKEN'
    }
  })
  .then(r => {
    discord.destroy()
}).catch(e => {
  console.log(e.response.data)
})


const discord = new Client({ 
  intents: Intents.NON_PRIVILEGED 
});

const embed = new MessageEmbed()
for (const field of changelog) {
  embed.addField(field.split(/\n|\r\n/g)[0].replace('### ', ''), field.replace(/###(.*)(\n|\r\n)/g, '').replace(/\[(.*)]\((.*)\)/g, ''), false)
  console.log(embed.fields)
}
embed
  .setTitle('v'+version+' has been released')
  .setDescription('CHANGELOG')
  .setURL('https://github.com/JiPaix/xdccJS/releases/tag/v'+version)
  .setTimestamp(Date.now())
  .setColor('DARK_GREEN')
  .setThumbnail('https://github.com/JiPaix/xdccJS/raw/main/logo.png')
  .setAuthor('JiPaix', 'https://avatars.githubusercontent.com/u/26584973?v=4', 'https://github.com/JiPaix')
discord.once('ready', () => {
  discord.channels.fetch(process.env.DISCORD_CHANNEL_ID).then(channel => {
    channel.send({embed}).then(console.log).catch(e => console.log(e))
  })
});

discord.login(process.env.DISCORD_SECRET);
const fs = require('fs')
const axios = require('axios')
const manip= require('dotenv-manipulator').default
const fd = require('form-data')
new manip()

const { Client, Intents, MessageEmbed } = require('discord.js');

const version = require('../package.json').version;
const { default: Manipulator } = require('dotenv-manipulator');

let changelog = fs.readFileSync('./CHANGELOG.md').toString().split('---')[0].split(/(?=###)/gm)
changelog.shift()

function createGitHubRelease() {
  return axios.default.post('https://api.github.com/repos/jipaix/xdccjs/releases', {
    tag_name: 'v'+version,
    name: version,
    body: changelog.join('')
  },
  {
    headers: {
      'Accept': 'application/vnd.github.v3+json',
      'Authorization': `token ${process.env.PA_TOKEN}`
    }
})
}

async function uploadAssets(id) {
  const files = fs.readdirSync('./executables')
  const remoteFiles = []
  for (const file of files) {
    const form = new fd()
    const remoteFileName = file.replace('index', 'xdccJS').replace('-win', '')
    remoteFiles.push('https://github.com/JiPaix/xdccJS/releases/download/v'+version+'/'+remoteFileName)
    await axios.default.post(
      'https://uploads.github.com/repos/jipaix/xdccjs/releases/'+id+'/assets?name='+remoteFileName,
      fs.readFileSync('./executables/'+file),
      {
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'Authorization': `token ${process.env.PA_TOKEN}`,
          ...form.getHeaders()
        }
      }
    ).catch((e) => {throw new Error(e)})
  }
  return remoteFiles
}

createGitHubRelease().then(async (res) => {
    const remoteFiles = await uploadAssets(res.data.id).catch(e => {throw e})
    postToDiscord(remoteFiles)
}).catch(e => {
  throw e
})

function postToDiscord() {
  const discord = new Client({ 
    intents: Intents.NON_PRIVILEGED 
  });
  
  const embed = new MessageEmbed()
  
  for (const field of changelog) {
    embed.addField(field.split(/\n|\r\n/g)[0].replace('### ', ''), field.replace(/###(.*)(\n|\r\n)/g, '').replace(/\[(.*)]\((.*)\)/g, ''), false)
  }
  
  embed
    .setTitle('v'+version+' has been released')
    .setDescription('CHANGELOG')
    .setURL('https://github.com/JiPaix/xdccJS/releases/tag/v'+version)
    .setTimestamp(Date.now())
    .setColor('DARK_GREEN')
    .setThumbnail('https://github.com/JiPaix/xdccJS/raw/main/logo.png')
    .setAuthor('JiPaix', 'https://avatars.githubusercontent.com/u/26584973?v=4', 'https://github.com/JiPaix')

  discord.once('ready', async() => {
      const chan = await discord.channels.fetch(process.env.DISCORD_CHANNEL_ID)
      await chan.send({embed}).catch((e) => {throw e})
      discord.destroy()
  });
  discord.login(process.env.DISCORD_SECRET);
}
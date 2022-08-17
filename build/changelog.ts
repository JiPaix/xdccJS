/* eslint-disable comma-dangle */
/* eslint-disable import/no-extraneous-dependencies */
import axios, { AxiosResponse } from 'axios';
import {
  APIEmbedField, Client, EmbedBuilder, GatewayIntentBits
} from 'discord.js';
import * as fs from 'fs';
import { version } from '../package.json';

declare let process : {
  env: {
    PA_TOKEN: string
    DISCORD_CHANNEL_ID: string
    DISCORD_SECRET: string
  }
};

require('dotenv').config();

const changelog = fs.readFileSync('./CHANGELOG.md').toString().split('---')[0].split(/(?=###)/gm);
changelog.shift();

function createGitHubRelease() {
  return axios.post(
    'https://api.github.com/repos/jipaix/xdccjs/releases',
    {
      tag_name: `v${version}`,
      name: version,
      body: changelog.join(''),
    },
    {
      headers: {
        Accept: 'application/vnd.github.v3+json',
        Authorization: `token ${process.env.PA_TOKEN}`,
      },
    },
  ) as Promise<AxiosResponse<{id:string}>>;
}

async function uploadAssets(id:string) {
  const files = fs.readdirSync('./executables');
  const promises = files.map(async (file) => {
    const remoteFileName = file.replace('index', 'xdccJS').replace('-win', '');
    await axios.post(
      `https://uploads.github.com/repos/jipaix/xdccjs/releases/${id}/assets?name=${remoteFileName}`,
      fs.readFileSync(`./executables/${file}`),
      {
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        headers: {
          Accept: 'application/vnd.github.v3+json',
          Authorization: `token ${process.env.PA_TOKEN}`,
          'Content-Type': 'multipart/form-data',
        },
      },
    );
  });
  return Promise.all(promises);
}

function postToDiscord() {
  const discord = new Client({
    intents: [GatewayIntentBits.Guilds],
  });

  discord.once('ready', async () => {
    // preparing our fields
    const fields:APIEmbedField[] = [];
    changelog.forEach((line) => {
      fields.push({ name: line.split(/\n|\r\n/g)[0].replace('### ', ''), value: line.replace(/###(.*)(\n|\r\n)/g, ''), inline: false });
    });
    const embed = new EmbedBuilder();
    embed
      .setTitle(`v${version} has been released`)
      .setDescription('CHANGELOG')
      .setURL(`https://github.com/JiPaix/xdccJS/releases/tag/v${version}`)
      .setTimestamp(Date.now())
      .setColor('DarkGreen')
      .setThumbnail('https://github.com/JiPaix/xdccJS/raw/main/logo.png')
      .setAuthor({
        name: 'JiPaix',
        iconURL: 'https://avatars.githubusercontent.com/u/26584973?v=4',
        url: 'https://github.com/JiPaix',
      });

    const chan = await discord.channels.fetch(process.env.DISCORD_CHANNEL_ID);
    if (chan?.isTextBased()) {
      await chan.send('@everyone').catch((e:Error) => { throw e; });
      await chan.send({ embeds: [embed] }).catch((e:Error) => { throw e; });
    }
    discord.destroy();
  });
  discord.login(process.env.DISCORD_SECRET);
}

createGitHubRelease().then(async (res) => {
  uploadAssets(res.data.id).then(() => {
    postToDiscord();
  }).catch((e) => { throw e; });
}).catch((e) => {
  throw e;
});

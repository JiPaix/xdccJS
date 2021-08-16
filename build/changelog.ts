import * as fs from 'fs';
import axios from 'axios';
import fd from 'form-data';
import { Client, Intents, MessageEmbed } from 'discord.js';

const { version } = require('../package.json');

const changelog = fs.readFileSync('./CHANGELOG.md').toString().split('---')[0].split(/(?=###)/gm);
changelog.shift();

function createGitHubRelease() {
  return axios.post('https://api.github.com/repos/jipaix/xdccjs/releases', {
    tag_name: `v${version}`,
    name: version,
    body: changelog.join(''),
  },
  {
    headers: {
      Accept: 'application/vnd.github.v3+json',
      Authorization: `token ${process.env.PA_TOKEN}`,
    },
  });
}

<h1 align="center">xdccJS<br><a href="https://www.codefactor.io/repository/github/jipaix/xdccjs"><img src="https://www.codefactor.io/repository/github/jipaix/xdccjs/badge" alt="CodeFactor" /></a> <a href="https://travis-ci.org/JiPaix/xdccJS"><img src="https://travis-ci.com/JiPaix/xdccJS.svg?branch=master"/></a> <a href="https://www.npmjs.com/package/xdccjs"><img src='https://img.shields.io/npm/dt/xdccjs'/></a> <a href="https://discord.gg/MzhR9NU"><img src='https://img.shields.io/discord/221622868688109569'/></a></h1>
<h5 align="center">Connect to IRC and download files from XDCC bots</h5>

<h4 align="center"><a href="#quick-start">Quick Start</a> | <a href="https://jipaix.github.io/xdccJS/classes/xdcc.html">API</a> | <a href="https://github.com/JiPaix/xdccJS/tree/master/examples/">Advanced Examples</a></h4>

## Installation

[![NPM](https://nodei.co/npm/xdccjs.png?mini=true)](https://nodei.co/npm/xdccjs/)

## Quick start

#### Initialize xdccJS :
With `require`
```js
const XDCC = require('xdccjs').default
```
Or using `import`
```js
import XDCC from 'xdccjs'
```
#### Connect :
```js
let opts = {
  host: 'irc.server.net',
  nick: 'ItsMeJiPaix',
  chan: '#friendly',
  path: 'downloads',
  port: 6660,
  verbose: true,
  randomizeNick: true,
}

const xdccJS = new  XDCC(opts)
```
#### Download :

```js
xdccJS.on('xdcc-ready', () => {
  xdccJS.download("xdcc-bot-nickname", 23)
  //=> /MSG xdcc-bot-nickname xdcc send #23
})

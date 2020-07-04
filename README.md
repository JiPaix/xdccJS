<h1 align="center">xdccJS<br><a href="https://travis-ci.org/JiPaix/xdccJS"><img src="https://travis-ci.com/JiPaix/xdccJS.svg?branch=master"/></a> <a href="https://www.codefactor.io/repository/github/jipaix/xdccjs"><img src="https://www.codefactor.io/repository/github/jipaix/xdccjs/badge" /></a>  <a href="https://deepscan.io/dashboard#view=project&tid=8945&pid=11179&bid=163106"><img src="https://deepscan.io/api/teams/8945/projects/11179/branches/163106/badge/grade.svg"/> <a href="https://www.npmjs.com/package/xdccjs"><img src='https://img.shields.io/npm/dt/xdccjs'/></a> <a href="https://snyk.io/test/github/JiPaix/xdccJS?targetFile=package.json"><img src="https://snyk.io/test/github/JiPaix/xdccJS/badge.svg?targetFile=package.json" data-canonical-src="https://snyk.io/test/github/JiPaix/xdccJS?targetFile=package.json" style="max-width:100%;"></a> <a href="https://discord.gg/HhhqdUd"><img src='https://img.shields.io/discord/706018150520717403'/></a></h1>
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
  port: 6660,
  nick: 'ItsMeJiPaix',
  chan: ['#candy', '#fruits'],
  path: 'downloads',
  verbose: true, // optional
  randomizeNick: true, // optional
  passivePort: [5000, 5001, 5002] // optional
}

const xdccJS = new  XDCC(opts)
```
#### Download :

```js
xdccJS.on('xdcc-ready', () => {
  xdccJS.download("xdcc-bot-nickname", 23)
  //=> /MSG xdcc-bot-nickname xdcc send #23
})

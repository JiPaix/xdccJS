<h1 align="center">xdccJS</h1>
<h5 align="center">Easy to use IRC library to download from XDCC bots</h5>
<h4 align="center"><a href="#quick-start">Quick Start</a> | <a href="https://jipaix.github.io/xdccJS/XDCC.html">API</a> | <a href="https://github.com/JiPaix/xdccJS/tree/master/examples/">Advanced Examples</a></h4>

## Features
<p>🍹<b>Nice and easy : </b>It will save you tons of time, i started this project after wasting so much time through the years using desktop clients. Now i can do any type of automation, once your set (and it could take less than 5 minutes) you won't even need to monitor releases and channels
</p>
<p>🤸<b>Flexible : </b>You might want to use xdccJS for different type of projects, instead of saving files on your hard drive you could send them elsewhere. Take look at this <a href="#advanced-exemple">advanced exemple</a> where i setup an http server that send files "from" XDCC directly to clients.
 </p>
<p>🚀<b>Doesn't brew coffe (yet) :</b> xdccJS isn't just a downloader, it's also a complete IRC client. Thanks to <a href="https://github.com/kiwiirc/irc-framework">irc-framework</a> you can use their awesome <a href="ttps://github.com/kiwiirc/irc-framework/tree/master/docs">API</a> from within xdccJS without any additional installation 
</p>

## Installation

[![NPM](https://nodei.co/npm/xdccjs.png?mini=true)](https://nodei.co/npm/xdccjs/)

## Quick start

#### Initialize xdccJS :
With `require`
```js
const XDCC = require('xdccjs')
```
Or using `import`
```js
import XDCC from 'xdccjs'
```
#### Start a connection :
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
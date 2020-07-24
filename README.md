<h1 align="center">xdccJS<br><a href="https://travis-ci.com/github/JiPaix/xdccJS"><img src="https://travis-ci.com/JiPaix/xdccJS.svg?branch=master"/></a> <a href="https://www.codefactor.io/repository/github/jipaix/xdccjs"><img src="https://www.codefactor.io/repository/github/jipaix/xdccjs/badge" /></a>  <a href="https://deepscan.io/dashboard#view=project&tid=8945&pid=11179&bid=163106"><img src="https://deepscan.io/api/teams/8945/projects/11179/branches/163106/badge/grade.svg"/> <a href="https://www.npmjs.com/package/xdccjs"><img src='https://img.shields.io/npm/dt/xdccjs'/></a> <a href="https://snyk.io/test/github/JiPaix/xdccJS?targetFile=package.json"><img src="https://snyk.io/test/github/JiPaix/xdccJS/badge.svg?targetFile=package.json" data-canonical-src="https://snyk.io/test/github/JiPaix/xdccJS?targetFile=package.json" style="max-width:100%;"></a> <a href="https://discord.gg/HhhqdUd"><img src='https://img.shields.io/discord/706018150520717403'/></a></h1>
<h5 align="center">a Node.js module to download files from XDCC bots on IRC</h5>

<h4 align="center"><a href="#quick-start-">Quick Start</a> | <a href="#api-">API</a> | <a href="#command-line-interface-">CLI</a> | <a href="https://github.com/JiPaix/xdccJS/tree/master/examples/">Advanced Examples</a></h4>


## Introduction
***xdccJS is a complete implementation of the <a href="https://en.wikipedia.org/wiki/XDCC">XDCC protocol</a> for nodejs***.  
It can either be used as a library or a command-line downloader.
### Features :
- <a href="https://en.wikipedia.org/wiki/Direct_Client-to-Client#Passive_DCC">Passive DCC</a>
- Batch downloads : `1-3, 5, 32-35, 101`
- Resume partially downloaded files
- Auto-retry on fail
- Pipes!

### Quick Start :
#### xdccJS CLI :
To use xdccJS from command-line :
- install: `npm install xdccjs -g`
- use: `xdccJS --server irc.server.net --bot "XDCC-BOT|NICKNAME" --download 110 --path "/home/user/downloads"`
#### xdccJS Library:
To use xdccJS as a library
- install: `npm install xdccjs`
- start coding:

```js
// main.js
const XDCC = require('xdccjs').default

let opts = {
  host: 'irc.server.net', // will use default port 6667
  path: 'my/download/folder'
}

const xdccJS = new XDCC(opts)

xdccJS.on('xdcc-ready', () => {
  xdccJS.download('XDCC|BOT', 243)
})
```

## API :
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
The simpliest way to connect is :
```js
let opts = {
  host: 'irc.server.net', // will use default port 6667
  path: 'my/download/folder'
}

const xdccJS = new XDCC(opts)
```
But you can also define a set of options to your preference
```js
let opts = {
  host: 'irc.server.net',
  port: 6690,
  nick: 'ItsMeJiPaix',
  chan: ['#candy', '#fruits'],
  path: 'my/download/folder',
  retry: 2,
  verbose: true,
  randomizeNick: true,
  passivePort: [5000, 5001, 5002]
}

const xdccJS = new XDCC(opts)
```
List and description of all options avaliable <a href="https://jipaix.github.io/xdccJS/interfaces/params.html">here</a>
#### Download :

```js
xdccJS.on('xdcc-ready', () => {
  xdccJS.download('xdcc-bot-nickname', 23)
  //=> /MSG xdcc-bot-nickname xdcc send #23
})

xdccJS.on('downloaded', (fileInfo) => {
  console.log(fileInfo.filePath) //=> /home/user/xdccJS/downloads/myfile.pdf
})
```
#### Download Batch of files :

```js
xdccJS.on('xdcc-ready', () => {
  // downloadBatch() accepts 'range strings' and array of numbers
  xdccJS.downloadBatch('xdcc-bot-nickname', '1-3, 8, 55')
  xdccJS.downloadBatch('another-bot', [1, 3, 10, 20])
})

xdccJS.on('downloaded', (fileInfo) => {
  console.log(fileInfo.filePath) //=> /home/user/xdccJS/downloads/myfile.pdf
})

xdccJS.on('batch-complete', (info) => {
  console.log(info) // => { target: "xdcc-bot-nickname", packet: [1, 2, 3, 8, 55] }
})
```
#### Disconnect from IRC :

Simply use `xdccJS.quit()` whenever you need it.

After a file is downloaded:
```js
xdccJS.on('downloaded', (fileInfo) =>{
  xdccJS.quit()
})
```
or after a batch is completed:
```js
xdccJS.on('batch-complete', (fileInfo) =>{
  xdccJS.quit()
})
```

## Command-line Interface :
#### Install xdccJS CLI :  
```bash
npm install xdccjs -g
```  
#### Start downloading :  
```bash
xdccJS --server irc.server.net --bot "XDCC-BOT|NICKNAME" --download 110 --path "/home/user/downloads"
```  
Alternatively, if you want to pipe the file just ommit the `--path` option  :  
```bash
xdccJS --server irc.server.net --bot "XDCC-BOT|NICKNAME" --download 110 | ffmpeg -i pipe:0 -c:v copy -c:a copy -f flv rtmp://live/mystream
```
### Command line options :
```
Options:
  -V, --version                output the version number
  -s, --server <server>        irc server address (required)
  -P, --port <number>          irc server port (default: 6667)
  -p, --path <path>            download path (optional)
  -r, --reverse-port <number>  port used for passive dccs (default: 5001)
  -u, --username <username>    irc username (default: "xdccJS")
  --no-randomize               add random numbers to nickname (optional)
  -c, --channel <chan>         channel to join (without #) (optional)
  -b, --bot <botname>          xdcc bot nickname (required)
  -d, --download <pack>        pack number to download (required)
  -h, --help                   display help for command (required)
```
#### Additional useful information :
- `--path` and `--bot` option's values ***MUST*** be either escaped or quoted :  
- xdccJS uses `stderr` to print download status informations, `stdout` is ***strictly*** used for download data 
## Documentation :
Full documentation is available <a href="https://jipaix.github.io/xdccJS/classes/xdcc.html">here</a>
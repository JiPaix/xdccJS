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
  // download() also accepts 'range strings' and array of numbers
  xdccJS.download('xdcc-bot-nickname', '1-3, 8, 55')
  xdccJS.download('another-bot', [1, 3, 10, 20])
})

// event triggered everytime a file is downloaded
xdccJS.on('downloaded', (fileInfo) => {
  console.log(fileInfo.filePath) //=> /home/user/xdccJS/downloads/myfile.pdf
})

// event triggered when a .download() is finished
xdccJS.on('done', (job) => {
  console.log(job.nick) //=> xdcc-bot-nickname
  console.log(job.failures) //=> [1, 8, 55]
  console.log(job.success) //=> ['document.pdf', 'audio.wav']
})
```
#### Handling connection from IRC :

By default xdccJS stays connected to IRC and is waiting for instruction (downloads)

To safely disconnect use the `can quit` event :
```js
// event triggered once all your downloads are done
xdccJS.on('can-quit', (fileInfo) =>{
  xdccJS.quit()
})
```
If you need to disconnect at a specific moment, use `xdccJS.quit()` directly :
```js
if(condition1 && condition2) {
  xdccJS.quit()
}
```

You can also reconnect later :
```js
if(condition1 && condition2) {
  xdccJS.quit()
}

something.on('custom-event', () => {
  xdccJS.reconnect()
})
```
And if at some point you need to connect to another IRC server :
```js
if(myconditions) {
  xdccJS.reconnect({
    host: 'irc.newserver.net', 
    port: 6200, // optional (default: 6667) 
    chan: ['#wee', '#happy'] //optional
    })
}
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
  -s, --server <server>        irc server address
  -P, --port <number>          irc server port (default: 6667)
  -b, --bot <botname>          xdcc bot nickname
  -d, --download <packs...>    pack number(s) to download
  -p, --path [path]            download path
  -u, --username <username>    irc username (default: "xdccJS")
  -c, --channel [chan...]      channel to join (without #)
  -r, --retry [number]         number of attempts before skipping pack (default: 0)
  -R, --reverse-port [number]  port used for passive dccs (default: 5001)
  --no-randomize               removes random numbers to nickname
  -w, --wait [number]          wait time (in seconds) before sending download request
  -h, --help                   display help for command
```
#### Additional useful information :
- `--path` and `--bot` option's values ***MUST*** be either escaped or quoted :  
- xdccJS uses `stderr` to print download status informations, `stdout` is ***strictly*** used for download data 
## Documentation :
Full documentation is available <a href="https://jipaix.github.io/xdccJS/classes/xdcc.html">here</a>
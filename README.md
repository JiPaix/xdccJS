<h1 align="center">xdccJS<br><a href="https://travis-ci.com/github/JiPaix/xdccJS"><img src="https://travis-ci.com/JiPaix/xdccJS.svg?branch=master"/></a> <a href="https://www.codefactor.io/repository/github/jipaix/xdccjs"><img src="https://www.codefactor.io/repository/github/jipaix/xdccjs/badge" /></a>  <a href="https://deepscan.io/dashboard#view=project&tid=8945&pid=11179&bid=163106"><img src="https://deepscan.io/api/teams/8945/projects/11179/branches/163106/badge/grade.svg"/> <a href="https://www.npmjs.com/package/xdccjs"><img src='https://img.shields.io/npm/dt/xdccjs'/></a> <a href="https://snyk.io/test/github/JiPaix/xdccJS?targetFile=package.json"><img src="https://snyk.io/test/github/JiPaix/xdccJS/badge.svg?targetFile=package.json" data-canonical-src="https://snyk.io/test/github/JiPaix/xdccJS?targetFile=package.json" style="max-width:100%;"></a> <a href="https://discord.gg/HhhqdUd"><img src='https://img.shields.io/discord/706018150520717403'/></a></h1>
<h5 align="center">a Node.js module to download files from XDCC bots on IRC</h5>

<h4 align="center"><a href="#api-">API</a> | <a href="#command-line-interface-">CLI</a> | <a href="https://github.com/JiPaix/xdccJS/tree/master/examples/">Advanced Examples</a></h4>


## Introduction
***xdccJS is a complete implementation of the <a href="https://en.wikipedia.org/wiki/XDCC">XDCC protocol</a> for nodejs***.  
It can also be used as a <a href="#command-line-interface-">command-line</a> downloader !
### Features :
- <a href="https://en.wikipedia.org/wiki/Direct_Client-to-Client#Passive_DCC">Passive DCC</a>
- Batch downloads : `1-3, 5, 32-35, 101`
- Resume partially downloaded files
- Auto-retry on fail
- Pipes!

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
const opts = {
  host: 'irc.server.net', // IRC hostname                           - required
  port: 6660, // IRC port                                           - optional (default: 6667)
  nick: 'ItsMeJiPaix', // Nickname                                  - optional (default: xdccJS + random)
  chan: ['#candy', '#fruits'], // Channel(s)                        - optional
  path: 'downloads', // Download path                               - optional (default: false, which enables piping)
  retry: 2, // Nb of retries on failed download                     - optional (default: 1)
  verbose: false, // Display download progress and jobs status      - optioanl (default: false)
  randomizeNick: false, // Add random numbers at end of nickname    - optional (default: true)
  passivePort: [5000, 5001, 5002], // Ports to use with Passive DCC - optional (default: [5001])
}

const xdccJS = new XDCC(opts)
```
Description of all options avaliable <a href="https://jipaix.github.io/xdccJS/interfaces/params.html">here</a>

#### Usage :
PSA: Using console.log is not recommended, this example is for the sake of showing xdccJS capabilities  
FYI: Setting `verbose` to `true` gives the same results as this example (with colors and better formatting).
```js
xdccJS.on('ready', () => {
  // every .download() starts a job
  xdccJS.download('XDCC|BLUE', '1-3, 8, 55') // Job#1 is started
  xdccJS.download('XDCC|RED', [1, 3, 10, 20]) // Job#2 is started
  xdccJS.download('XDCC|BLUE', 23) // Job#1 is updated
})

// event triggered everytime a file is downloaded regardless of its job
xdccJS.on('downloaded', (fileInfo) => {
  console.log(fileInfo.filePath) //=> /home/user/xdccJS/downloads/myfile.pdf
})

// event triggered when a job is done.
xdccJS.on('done', (job) => {
  console.log(job.nick) //=> XDCC|BLUE
  console.log(job.failures) //=> [1, 8, 55]
  console.log(job.success) //=> ['document.pdf', 'audio.wav']
  // Job#1 deleted
})
```
Running jobs can be shown anytime using `.jobs()` 
```js
console.log(xdccJS.jobs())
//=> CONSOLE OUTPUT
[
  {
    nick: 'bot',
    queue: [ 5, 9, 21 ], // packs in queue
    now: 4, // pack currently downloading
    failures: [ 1, 2 ], // failed packs
    success: [ 'document.pdf', 'audio.wav', 'video.mp4' ] // successfully downloaded files
  },
  {
    nick: 'another-bot',
    queue: [ 3 ],
    now: 2,
    failures: [ ],
    success: [ ]
  }
]
```
#### Disconnect / Reconnect :

```js
// event triggered when all jobs are done.
xdccJS.on('can-quit', () => {
  xdccJS.quit() // this is how you disconnect from IRC
})

// reconnect to the same server :
xdccJS.reconnect()

// change server :
xdccJS.reconnect(
  {
    host: 'irc.newserver.net',
    port: 6669, // optional, default: 6667 
    chan: ['#one', '#two'] // optional
  }
)
```
#### Use pipes :
```js
// This example will start vlc.exe then play the video while it's downloading.
const opts = {
  host: 'irc.server.net',
  path: false, 
}

const xdccJS = new XDCC(opts)

// Start VLC
const { spawn } = require('child_process')
const vlcPath = path.normalize('C:\\Program Files\\VideoLAN\\VLC\\vlc.exe')
const vlc = spawn(vlcPath, ['-'])

xdccJS.on('ready', () => {
  xdccJS.download('bot', 155)
})

// send data to VLC that directly play the file
xdccJS.on('data', data => {
  vlc.stdin.write(data)
})
```
## Command-line Interface :
#### Install xdccJS CLI :  
```bash
npm install xdccjs -g
```  
#### Start downloading :  
```bash
xdccJS --server irc.server.net --bot "XDCC-BOT|BLUE" --download 1-5,100-105 --path "/home/user/downloads"
```  
Alternatively, if you want to pipe the file just ommit the `--path` option  :  
```bash
xdccJS --server irc.server.net --bot "XDCC-BOT|RED" --download 110 | ffmpeg -i pipe:0 -c:v copy -c:a copy -f flv rtmp://live/mystream
```
### Command line options :
```
Options:
  -V, --version              output the version number
  -s, --server <server>      irc server address
  --port <number>            irc server port (default: 6667)
  -b, --bot <botname>        xdcc bot nickname
  -d, --download <packs...>  pack number(s) to download
  -p, --path [path]          download path
  -u, --username <username>  irc username (default: "xdccJS")
  -c, --channel [chan...]    channel to join (without #)
  -r, --retry [number]       number of attempts before skipping pack (default: 0)
  --reverse-port [number]    port used for passive dccs (default: 5001)
  --no-randomize             removes random numbers to nickname
  -w, --wait [number]        wait time (in seconds) before sending download request (default: 0)
  -h, --help                 display help for command
```
#### Additional useful information :
- `--path` and `--bot` option's values ***MUST*** be either escaped or quoted.
- xdccJS uses `stderr` to print download status informations, `stdout` is ***strictly*** used for download data.
## Documentation :
Full documentation is available <a href="https://jipaix.github.io/xdccJS/classes/xdcc.html">here</a>
<h1 align="center"><img src="logo.png"/><br><a href="https://travis-ci.com/github/JiPaix/xdccJS"><img src="https://travis-ci.com/JiPaix/xdccJS.svg?branch=master"/></a> <a href="https://www.codefactor.io/repository/github/jipaix/xdccjs"><img src="https://www.codefactor.io/repository/github/jipaix/xdccjs/badge" /></a>  <a href="https://deepscan.io/dashboard#view=project&tid=8945&pid=11179&bid=163106"><img src="https://deepscan.io/api/teams/8945/projects/11179/branches/163106/badge/grade.svg"/> <a href="https://www.npmjs.com/package/xdccjs"><img src='https://img.shields.io/npm/dt/xdccjs'/></a> <a href="https://snyk.io/test/github/JiPaix/xdccJS?targetFile=package.json"><img src="https://snyk.io/test/github/JiPaix/xdccJS/badge.svg?targetFile=package.json" data-canonical-src="https://snyk.io/test/github/JiPaix/xdccJS?targetFile=package.json" style="max-width:100%;"></a> <a href="https://discord.gg/HhhqdUd"><img src='https://img.shields.io/discord/706018150520717403'/></a></h1>

## Introduction
***xdccJS is a complete implementation of the <a href="https://en.wikipedia.org/wiki/XDCC">XDCC protocol</a> for nodejs***.  
It can also be used as a <a href="#command-line-interface">command-line</a> downloader !  

### Features :
- <a href="https://en.wikipedia.org/wiki/Direct_Client-to-Client#Passive_DCC">Passive DCC</a>
- Batch downloads : `1-3, 5, 32-35, 101`
- Resume partially downloaded files
- Auto-retry on fail
- Pipes!  
- Check [advanced examples](https://github.com/JiPaix/xdccJS/tree/master/examples) and see what else you can do

## Table of contents
- [API](#api)
  - [Installation](#installation)
  - [Import and Require](#importrequire)
  - [Configuration](#configuration)
  - [Download](#download)
    - [jobs](#Jobs)
    - [events](#Events)
    - [use pipes](#Pipes)
  - [Disconnect and Reconnect (IRC)](#disconnectreconnect)
- [CLI](#command-line-interface)
  - [Installation](#installation-1)
  - [Options](#options)
  - [Download](#download-1)
  - [Profiles](#profiles)
  - [Important notes](#fyi)

# API
## Installation
`npm i xdccjs`
## Import/require
```js
const XDCC = require('xdccjs').default
// or
import XDCC from 'xdccJS'
```
## Configuration
The simpliest way to start xdccJS is :
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

## Download

```js
xdccJS.on('ready', () => {
  // every .download() starts a job
  const Job1 = xdccJS.download('XDCC|BLUE', '1-3, 8, 55') // Job#1 is started
  const Job2 = xdccJS.download('XDCC|RED', [1, 3, 10, 20]) // Job#2 is started
  xdccJS.download('XDCC|BLUE', 23) // Job1 is updated
  const Job3 = xdccJS.download('XDCC|RED', '55') // Job2 is updated, Job3 === Job2
})
```
### Jobs
a `Job` is a way to keep track of what's xdccJS is doing :  
When a download is started it's stored as a `Job`, it contains informations about what's is downloaded/downloading/in queue and also provides events for themselves.
```js
const job = xdccJS.download('a-bot', 33)
console.log(job.show())
//=> { name: 'a-bot', queue: 33, now: 0, sucess: [], failed: [] }
```
Running jobs can be shown/used anytime using `.jobs()` 
```js
// find job by botname
const job = xdccJS.jobs('bot-name')

// show job information
console.log(job.show())

// cancel job
job.cancel()

// get all jobs at once
const jobArray = xdccJS.jobs()
```
### Events
Some events are accessible globally from `xdccJS` and from `Jobs`  

PSA: Using console.log is not recommended, this example is for the sake of showing xdccJS capabilities  
FYI: Setting `verbose` to `true` gives the same results as this example (with colors and better formatting).  

- `on('read')` *[global]* : when xdccJS is ready to download
```js
xdccJS.on('ready', ()=> {
  // download() here
})
```

- `on('downloaded')` *[global+job]* : When a file is downloaded
```js
xdccJS.on('downloaded', (fileInfo) => {
  console.log(fileInfo.filePath) //=> /home/user/xdccJS/downloads/myfile.pdf
})

job.on('downloaded', (fileInfo) => {
  console.log('Job1 has downloaded:' + fileInfo.filePath)
  //=> Job1 has downloaded: /home/user/xdccJS/downloads/myfile.pdf
  console.log(fileInfo)
  //=> { file: 'filename.pdf', filePath: '/home/user/xdccJS/downloads/myfile.pdf', length: 5844849 }
})
```
- `on('done')` *[global+job]* : When a job is done
```js
xdccJS.on('done', (job) => {
  console.log(job.show())
})

job.on('done', (job) => {
  console.log('Job2 is done!')
  console.log(job.show())
})
```
- `on('pipe')` *[global+job]* : When a file is getting piped (see pipe documentation)
```js
xdccJS.on('pipe', (stream, fileInfo) => {
  stream.pipe(somewhere)
  console.log(fileInfo)
  //=> { file: 'filename.pdf', filePath: 'pipe', length: 5844849 }
})

job.on('pipe', (stream, fileInfo) => {
  stream.pipe(somewhere)
})
```
- `on('error')` *[global+job]* : When something goes wrong
```js
xdccJS.on('error', (message) => {
  // message`includes IRC errors and downloads errors 
})

job.on('error', (message) => {
  // message onlmy includes download errors
})
```
### Pipes
To enable piping you must initialize xdccJS with `path` set to false
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
  const Job = xdccJS.download('bot', 155)
})

// send data to VLC that plays the file
Job.on('pipe', stream => {
  stream.pipe(vlc.stdin)
})
```
## Disconnect/Reconnect

```js
// event triggered when all jobs are done.
xdccJS.on('can-quit', () => {
  xdccJS.quit() // this is how you disconnect from IRC
})

// reconnect to the same server :
xdccJS.reconnect() //=> sends xdccJS 'ready' event AGAIN

// change server :
xdccJS.reconnect(
  {
    host: 'irc.newserver.net',
    port: 6669, // optional, default: 6667 
    chan: ['#one', '#two'] // optional
  }
)
```
# Command-line Interface
## Installation
```bash
npm install xdccjs -g
```  
## Options
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
  -w, --wait [number]        wait time (in seconds) in channel(s) before sending download request (default: 0)
  --save-profile [string]    save current options as profile
  --del-profile [string]     delete profile
  --set-profile [string]     define profile as default
  --list-profile             list all available profiles
  -h, --help                 display help for command
```
## Download 
**I recommend using double quotes between the `bot name` and `download path`** as they often both include unescaped characeters or whitespaces
```bash
xdccJS --server irc.server.net --bot "XDCC-BOT|BLUE" --download 1-5,100-105 --path "/home/user/downloads"
```  
Alternatively, if you want to pipe the file just ommit the `--path` option  :  
```bash
xdccJS --server irc.server.net --bot "XDCC-BOT|RED" --download 110 | vlc -
```
## Profiles
Profiles are presets of options.
### Save
You can save options as a profile with `--save-profile` :
```bash
# Any option can be included
xdccJS --save-profile "my_profile" --server "irc.server.net" --port "6669" --path "C:/Users/JiPaix/Desktop"
```
### Use
```bash
#1 - standard
xdccJS --bot "XDCC|BOT" --download "1132-1137"

#2 - if your profile includes a bot name
xdccJS --download "1132-1137"

#3 - use a different path than the one provided by current profile
xdccJS --bot "XDCC|BOT" --download "1132-1137" --path "E:/external_disk"

#4 - standard + copy/paste
xdccJS "/msg XDCC|BOT xdcc send 1132-1337" # quotes are important here
```
### Set default
set default profile :
```bash
xdccJS --set-profile another_profile
```
### List
List all profiles :
```bash
xdccJS --list-profile
```
### Delete
Delete a profile :
```bash
xdccJS --del-profile my_profile
```
## FYI
- hashtags for channels and packs are optional :
  - ```bash
      --channel "#my-channel" --download "#132"
      # is the same as
      --channel "my-channel" --download "132" 
    ```
- given options prevails over the one provided by profiles :
  - except for `--server`, which results in xdccJS ignoring the current profile
  - example: 
    ```bash
        # current profile has --wait 5, but this time you need --wait 50
        xdccJS --bot "mybot" --download "125-130" --wait 50
      ```
    ```bash
        # ignores ALL profile options
        xdccJS --server "irc.mywnewserver.org"
- options `--bot` and `--path` often contains special characters and/or whitespaces :
  - ```bash
      # this wont work
      --path /home/user/my folder --bot XDCC|BOT --download 123-125
      # fixed
      --path "/home/user/my folder" --bot "XDCC|BOT" --download 123-125 
    ```

## Documentation
Full documentation is available <a href="https://jipaix.github.io/xdccJS/classes/xdcc.html">here</a>

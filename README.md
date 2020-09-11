<h1 align="center"><img src="logo.png"/><br><a href="https://travis-ci.com/github/JiPaix/xdccJS"><img src="https://travis-ci.com/JiPaix/xdccJS.svg?branch=master"/></a> <a href="https://www.codefactor.io/repository/github/jipaix/xdccjs"><img src="https://www.codefactor.io/repository/github/jipaix/xdccjs/badge" /></a> <a href="https://codeclimate.com/github/JiPaix/xdccJS/maintainability"><img src="https://img.shields.io/codeclimate/maintainability-percentage/JiPaix/xdccJS" /></a> <a href='https://codeclimate.com/github/JiPaix/xdccJS/code?sort=test_coverage'><img src='https://img.shields.io/codeclimate/coverage/JiPaix/xdccJS'></a> <a href="https://deepscan.io/dashboard#view=project&tid=8945&pid=11179&bid=163106"><img src="https://deepscan.io/api/teams/8945/projects/11179/branches/163106/badge/grade.svg"/> <a href="https://www.npmjs.com/package/xdccjs"><img src='https://img.shields.io/npm/dt/xdccjs'/></a> <a href="https://snyk.io/test/github/JiPaix/xdccJS?targetFile=package.json"><img src="https://snyk.io/test/github/JiPaix/xdccJS/badge.svg?targetFile=package.json" data-canonical-src="https://snyk.io/test/github/JiPaix/xdccJS?targetFile=package.json" style="max-width:100%;"></a> <a href="https://discord.gg/HhhqdUd"><img src='https://img.shields.io/discord/706018150520717403'/></a></h1>

## Introduction
***xdccJS is a complete implementation of the <a href="https://en.wikipedia.org/wiki/XDCC">XDCC protocol</a> for nodejs***.  
It can also be used as a <a href="#command-line-interface">command-line</a> downloader !  

### Features :
- Batch downloads : `1-3, 5, 32-35, 101`
- Resume file and auto-retry
- Pipes!
- <a href="https://en.wikipedia.org/wiki/Direct_Client-to-Client#Passive_DCC">Passive DCC</a>

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
  - [(Auto) disconnect from IRC](#disconnect)
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
Except for `host` every parameter is optional, but you can also define a set of options to your preference :  
a full description of these parameters [here](docs/interfaces/params.html)
```js
const opts = {
  host: 'irc.server.net', // IRC hostname                                                   - required
  port: 6660, // IRC port                                                                   - default: 6667
  nick: 'ItsMeJiPaix', // Nickname                                                          - default: xdccJS + random
  chan: ['#candy', '#fruits'], // Array of channels                                         - default : [ ]
  path: 'downloads', // Download path or 'false'                                            - default: false (which enables piping)
  retry: 2, // Nb of retries before skip                                                    - default: 1
  timeout: 50, // Nb of seconds before a download is considered timed out                   - default: 30
  verbose: true, // Display download progress and jobs status                               - default: false
  randomizeNick: false, // Add random numbers at end of nickname                            - default: true
  passivePort: [5000, 5001, 5002], // Array of port(s) to use with Passive DCC              - default: [5001]
  secure: false, // Allow/Deny files sent by bot with different name than the one requested - default: true
}

```
**xdccJS includes (and extends) [@kiwiirc/irc-framework](https://github.com/kiwiirc/irc-framework)**, if you need more advanced (IRC) features check their [documentation](https://github.com/kiwiirc/irc-framework/blob/master/docs/clientapi.md) and some [examples](/examples) on how its used with xdccJS


## Download
>xdccJS.<span style="color:#9865a3">download</span><span style="color:black">(bot: <span style="color:#37bd80">string</span>, packets: <span style="color:#37bd80">string</span> | <span style="color:#37bd80">number</span> | <span style="color:#37bd80">number[]</span>)
```js
xdccJS.on('ready', () => {
  xdccJS.download('XDCC|BLUE', '1-3, 8, 55')
  xdccJS.download('XDCC|RED', [1, 3, 10, 20])
  xdccJS.download('XDCC|YELLOW', 4)
})
```
### Jobs
When a download is requested it's stored as a `Job` :
```js
const job = xdccJS.download('a-bot', [33, 50, 62, 98])
```
Jobs are stored by bot name, this means that if you call `.download()` multiple times with the same bot name instead of starting a new job the existing one is updated :
```js
xdccJS.on('ready', () => {
  const job1 = xdccJS.download('XDCC|BLUE', '1-3, 8, 55')
  const job2 = xdccJS.download('XDCC|RED', [1, 3, 10, 20])
  xdccJS.download('XDCC|BLUE', 23) // job1 is updated
  xdccJS.download('XDCC|RED', '150-155') // job2 is updated
})
```
You can retrieve a `Job` whenever you need with : `xdccJS.jobs()`
  >xdccJS.<span style="color:#9865a3">jobs</span><span style="color:black">(bot: <span style="color:#37bd80">string</span> | <span style="color:#37bd80">undefined</span>)
```js
// find job by botname
const job = xdccJS.jobs('bot-name')

// retrieve all jobs at once
const arrayOfJobs = xdccJS.jobs()
```
Each `Job` can :  
- Display its progress status  
  >Job.<span style="color:#9865a3">show</span><span style="color:black">(bot: <span style="color:#37bd80">string</span> | <span style="color:#37bd80">undefined</span>)
  ```js
  const status = job.show()
  console.log(status)
  //=> { name: 'a-bot', queue: [98], now: 62, sucess: ['file.txt'], failed: [50] }
  ```
- cancel the file currently downloading :  
  >Job.<span style="color:#9865a3">show</span><span style="color:black">()</span>
  ```js
  job.cancel()
  ```
- Emit events (see event documentation below)

### Events
Some events are accessible globally from `xdccJS` and from `Jobs`  

<p style="font-size:smaller;">FYI: this example is for the sake of showing xdccJS capabilities, if you need download status to be displayed in a nice way just start xdccJS with parameter `verbose = true`</p>
 

- >[<span style="color:#37bd80">xdccJS</span>].<span style="color:#9865a3">on</span>(<span style="color:#1a3ea1">'ready'</span>) : <span style="color:black">when xdccJS is ready to download</span>
  ```js
  xdccJS.on('ready', ()=> {
    // download() here
  })
  ```

- >[<span style="color:#37bd80">xdccJS</span> | <span style="color:#37bd80">Job</span>].<span style="color:#9865a3">on</span>(<span style="color:#1a3ea1">'downloaded'</span>) : <span style="color:black">When a file successfully is downloaded</span>
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
- >[<span style="color:#37bd80">xdccJS</span> | <span style="color:#37bd80">Job</span>].<span style="color:#9865a3">on</span>(<span style="color:#1a3ea1">'done'</span>) : <span style="color:black">When a job has no remaining package in queue</span>
  ```js
  xdccJS.on('done', (job) => {
    console.log(job.show())
      //=> { name: 'a-bot', queue: [98], now: 62, sucess: ['file.txt'], failed: [50] }
  })

  job.on('done', (job) => {
    console.log('Job2 is done!')
    console.log(job.show())
      //=> { name: 'a-bot', queue: [98], now: 62, sucess: ['file.txt'], failed: [50] }
  })
  ```
- >[<span style="color:#37bd80">xdccJS</span> | <span style="color:#37bd80">Job</span>].<span style="color:#9865a3">on</span>(<span style="color:#1a3ea1">'pipe'</span>) : <span style="color:black">When a file is getting piped (see <a href="#pipes">Pipe documentation</a>)</span>
  ```js
  xdccJS.on('pipe', (stream, fileInfo) => {
    stream.pipe(somewhere)
    console.log(fileInfo)
    //=> { file: 'filename.pdf', filePath: 'pipe', length: 5844849 }
  })

  job.on('pipe', (stream, fileInfo) => {
    stream.pipe(somewhere)
    console.log(fileInfo)
    //=> { file: 'filename.pdf', filePath: 'pipe', length: 5844849 }
  })
  ```
- >[<span style="color:#37bd80">xdccJS</span> | <span style="color:#37bd80">Job</span>].<span style="color:#9865a3">on</span>(<span style="color:#1a3ea1">'error'</span>) : <span style="color:black">When something goes wrong</span>
  ```js
  xdccJS.on('error', (message) => {
    console.log(message)
    //=> timeout: no response from XDCC|BLUE
  })

  job.on('error', (message) => {
    //=> timeout: no response from XDCC|BLUE
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
## Disconnect
```js
// event triggered when all jobs are done.
xdccJS.on('can-quit', () => {
  xdccJS.quit() // this is how you disconnect from IRC
})
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

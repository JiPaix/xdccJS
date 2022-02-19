
<h1 align="center"><img src="logo.png" /> <br><img src="https://github.com/JiPaix/xdccJS/actions/workflows/node.js.yml/badge.svg"/> <a href="https://snyk.io/test/github/JiPaix/xdccJS?targetFile=package.json"><img src="https://snyk.io/test/github/JiPaix/xdccJS/badge.svg?targetFile=package.json" data-canonical-src="https://snyk.io/test/github/JiPaix/xdccJS?targetFile=package.json" style="max-width:100%;"></a> <a href="https://www.npmjs.com/package/xdccjs"><img src='https://img.shields.io/npm/dt/xdccjs'/></a> <br><a href="https://www.codefactor.io/repository/github/jipaix/xdccjs"><img src="https://www.codefactor.io/repository/github/jipaix/xdccjs/badge" /></a> <a href="https://codeclimate.com/github/JiPaix/xdccJS/maintainability"><img src="https://img.shields.io/codeclimate/maintainability-percentage/JiPaix/xdccJS" /></a> <a href="https://deepscan.io/dashboard#view=project&tid=8945&pid=11179&bid=163106"><img src="https://deepscan.io/api/teams/8945/projects/11179/branches/163106/badge/grade.svg"/> <a href="https://discord.gg/mczgeUfeWS"><img src='https://img.shields.io/discord/706018150520717403'/></a></h1>

### Features :
***xdccJS is a complete implementation of the <a href="https://en.wikipedia.org/wiki/XDCC">XDCC protocol</a> for nodejs***.  
It can also be used as a <a href="#command-line-interface">command-line</a> downloader !  
- Batch downloads : `1-3, 5, 32-35, 101`
- Resume file and auto-retry
- Pipes!
- [Passive DCC](https://en.wikipedia.org/wiki/Direct_Client-to-Client#Passive_DCC)
- Check [advanced examples](https://github.com/JiPaix/xdccJS/tree/master/examples) and see what else you can do

## Table of contents
- [API](#api)
  - [Getting Started](#getting-started)
  - [List of options](#options)
  - [Download](#download)
    - [Jobs](#jobs)
    - [Events](#events)
    - [Piping](#pipes)
  - [(Auto) disconnect from IRC](#disconnect)
  - [Advanced IRC commands and middlewares](#advanced-irc-commands)
- [CLI](#command-line-interface)
  - [Installation](#installation-1)
  - [Options](#options)
  - [Usage](#usage)
  - [Profiles](#profiles)
  - [Important notes](#fyi)

# Installation
[![NPM](https://nodei.co/npm/xdccjs.png?compact=true)](https://nodei.co/npm/xdccjs/)
# API
## Getting started
There's three different way to import/require xdccJS depending on which environment it is running:
### CommonJS
```js
const XDCC = require('xdccjs')
const xdccJS = new XDCC.default({/*..options..*/})
```
### Modules
```js
import XDCC from 'xdccjs'
const xdccJS = new XDCC.default({/*..options..*/})
```
### TypeScript
```ts
import XDCC from 'xdccjs'
const xdccJS = new XDCC({/*..options..*/})
```
### Example
```js
const XDCC = require('xdccjs')

const xdccJS = new XDCC.default({
  host: 'irc.server.net',
  port: 6667,
  chan: ['#welcome', '#fansub'],
  nickname: 'Leon',
  path: '/home/leon/downloads'
})

xdccJS.on('ready', () => {
  xdccJS.download('XDCC|BOT_RED', 5)
  xdccJS.download('XDCC|BOT_GREEN', '1-3, 55, 100-200')
  xdccJS.download('XDCC|BOT_BLUE', [12, 7, 10, 20])
  xdccJS.download('XDCC|BOT_ALPHA', ['5', '6'])
})
```
### Options
Every parameter is optional, except for `host`.

```js
const opts = {
  host: 'irc.server.net', // IRC hostname                                                   - required
  port: 6660, // IRC port                                                                   - default: 6667
  tls: false, // Enable SSL/TLS Support                                                     - default false
  nickname: 'ItsMeJiPaix', // Nickname                                                      - default: xdccJS + random
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
### Download
>xdccJS.**download( bot** : string, **packets** : string | number | number[] | string[] **)**  
`download()` is asynchronous and returns a `Job`
```js
xdccJS.on('ready', async () => {
  const blue = await xdccJS.download('XDCC|BLUE', '1-3, 8, 55')
  const yellow = await xdccJS.download('XDCC|YELLOW', 4)
  const red = await xdccJS.download('XDCC|RED', [12, 7, 10, 20])
  const purple = await xdccJS.download('XDCC|PURPLE', ['1', '3', '10', '20'])
})
```
### Jobs
`Job`s are `download()` instances which are tied to the target nickname.  
calling `download()` multiple times for the same target will update current job.

```js
xdccJS.on('ready', async () => {
  // jobs are automatically updated
  const job1 = await xdccJS.download('BOT-A', 1)
  const job2 = await xdccJS.download('BOT-A', 2)
  const job3 = await xdccJS.download('BOT-A', 3)
  job1 === job2 //=> true
  job2 === job3 //=> true

  // but each "target" has its own job
  const job4 = await xdccJS.download('DIFFERENT_TARGET', 4)
  job1 === job4 //=> false

  // once a job's done, its lifetime ends
  job1.on('done', async () => {
    const job5 = await xdccJS.download('BOT-A', 5)
    job1 === job4 //=> false
  })
})
```
#### You can also retrieve on going jobs

> xdccJS.**jobs( bot** : string | undefined **)**

```js
// find job by botname
const job = await xdccJS.jobs('bot-name')

// retrieve all jobs at once
const arrayOfJobs = await xdccJS.jobs()
```
#### Jobs offer three options :
1. Get job progress status :
    ```js
    let status = job1.show()
    let isdone = job1.isDone()
    console.log(status)
    //=> { name: 'a-bot', queue: [98], now: 62, sucess: ['file.txt'], failed: [50] }
    console.log(isdone)
    //=> false
    ```
2. Cancel a Job
    ```js
    job2.cancel()
    ```
3. Events to track progress (see [events documentation](#Events))
    ```js
    job.on('downloaded', (fileInfo) => {
      //=> a file has been downloaded
    })

    job.on('done', () => {
      //=> job has finished downloading all requested packages
    })

    // more below..
    ```
### Events
**Most events are accessible both from xdccJS or a Job scope**

*FYI: those examples are for the sake of showing xdccJS capabilities, if you need download status to be displayed in a nice way just start xdccJS with parameter `verbose = true`*
 

> [**xdccJS**].on( **'ready'** ) : *xdccJS is ready to download*
  - ```js
    xdccJS.on('ready', async () => {
      // download() here
    })
    ```
> [**xdccJS** | **Job**].on( **'downloading'** ) : *Data is being received (a file is downloading)*
  - ```js
    xdccJS.on('downloading', (fileInfo, received, percentage) => {
      console.log(fileInfo) //=> { file: 'filename.pdf', filePath: '/path/to/filename.pdf', length: 5844849 }
      console.log(`downloading: '${fileInfo.file}'`) //=> downloading: 'your file.pdf'
    })

    job.on('downloading', (fileInfo, received, percentage) => {
      console.log(percentage) //=> 10.55
    })
    ```
> [**xdccJS** | **Job**].on( **'downloaded'** ) : *A file successfully downloaded*
  - ```js
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
> [**xdccJS** | **Job**].on( **'done'** ) : *A job has no remaining package in queue*
  - ```js
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
> [**xdccJS** | **Job**].on( **'pipe'** ) : *A pipe is available (see [pipe documentation](#pipes)*)
  - ```js
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
> [**xdccJS**].on( **'error'** ) : *Connection Errors*  
  - ```js
    xdccJS.on('error', (err) => {
      err instanceof Error //=> true
      console.error(err.message) //=> UNREACHABLE HOST 1.1.1.1:6667
    })
    ```
> [**Job**].on( **'error'** ) : *Job interrupted/canceled or connexion with bot unreachable*  
  - ```js
    job.on('error', (message, fileInfo) => {
      console.error(message) //=> timeout: no response from XDCC|BLUE
      console.log(fileInfo) //=> { file: 'filename.pdf', filePath: 'pipe', length: 5844849 }
    })
    ```
### Pipes
In order to use pipes xdccJS need to be initialized with path option set to false
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

xdccJS.on('ready', async () => {
  const Job = await xdccJS.download('bot', 155)
  // send data to VLC that plays the file
  Job.on('pipe', stream => {
    stream.pipe(vlc.stdin)
  })
})
```
## Disconnect
```js
// event triggered when all jobs are done.
xdccJS.on('can-quit', () => {
  xdccJS.quit() // this is how you disconnect from IRC
})
```
## Advanced IRC commands
**xdccJS uses [@kiwiirc/irc-framework](https://github.com/kiwiirc/irc-framework)** client which is **entirely** accessible via the `irc` property.  
Check their client API [documentation](https://github.com/kiwiirc/irc-framework/blob/master/docs/clientapi.md)
```js
// middlewares
xdccJS.irc.use(middleware)

xdccJS.on('ready', () => {
  // change nickname
  xdccJS.irc.changeNick('new-nickname')
  // listen to kick events
  xdccJS.irc.on('kick', (info) => {
    //=> do something..
  })
})
```
An extended version of this example is available [here](/examples/irc-framework.js)
# Command-line Interface
## Installation
```bash
npm install xdccjs -g
```  
## Options
```
Options:
  -V, --version              output the version number
  -h, --host <server>        IRC server hostname
  --port <number>            IRC server port
  --tls                      Enable SSL/TLS Support
  -b, --bot <botname>        xdcc bot nickname
  -d, --download <packs...>  pack number(s) to download
  -p, --path <path>          download path
  -n, --nickname <nickname>  Your IRC nickname
  -c, --channel [chan...]    channel(s) to join (without #)
  -r, --retry <number>       number of attempts before skipping pack
  -q, --quiet                disable console output
  --passive-port <number>    port used for passive dccs
  --no-randomize             Disable nickname randomization
  -w, --wait [number]        wait time (in seconds) in channel(s) before sending download request (default: 0)
  --no-secure                Allow files sent by bot with different name than the one requested
  --save-profile [string]    save current options as a profile
  --delete-profile [string]  delete profile
  --set-profile [string]     set profile as default
  --list-profile             list all available profiles
  --help                     display help for command
```
## Usage
```bash
xdccJS --host irc.server.net --bot "XDCC-BOT|BLUE" --download 1-5,100-105 --path "/home/user/downloads"
```  
Alternatively, if you want to pipe the file just ommit the `--path` option  :  
```bash
xdccJS --host irc.server.net --bot "XDCC-BOT|RED" --download 110 | vlc -
```
**I recommend using double quotes between the `bot name` and `download path`** as they often both include unescaped characeters or whitespaces
## Profiles
You can use profiles to automatically load predefined options on startup
### How to use profiles
Save a predefined set of options:
```bash
# save a profile with name "my_profile"
xdccJS --save-profile "my_profile" --host "irc.server.net" --port "6669" --path "C:/Users/JiPaix/Desktop"
```
```bash
# use "my_profile" settings
xdccJS --bot "XDCC|BOT" --download "1132-1137"
```
You can override profile settings:
```bash
# use "my_profile" profile, change download path
xdccJS --bot "XDCC|BOT" --download "1132-1137" --path "/home/user/new/path"
```
If a profile provide at least a `--host` you can use the *lazy* mode:
```bash
xdccJS "/msg XDCC|BOT xdcc send 1132-1337" # quotes are important here
```
  
#### Save Profile
```bash
xdccJS --save-profile "my_profile" --host "irc.server.net" --port 6669 --path "C:/Users/username/Desktop"
```
Saved profile are automatically set as default.
#### Change default profile
```bash
xdccJS --set-profile "my_profile"
```
#### Delete profile
```bash
xdccJS --delete-profile "my_profile"
```
#### List available profiles
```bash
 xdcJS --list-profile 
 ```
## FYI
- hashtags for channels and packs are optional :
  - ```bash
      --channel "#my-channel" --download "#132"
      # is the same as
      --channel "my-channel" --download "132" 
    ```
- given options prevails over the one provided by profiles :
  - except for `--host`, which results in xdccJS ignoring the current profile
  - example: 
    ```bash
        # current profile has --wait 5, but this time you need --wait 50
        xdccJS --bot "mybot" --download "125-130" --wait 50
      ```
    ```bash
        # ignores ALL profile options
        xdccJS --host "irc.mywnewserver.org"
- options `--bot` and `--path` often contains special characters and/or whitespaces :
  - ```bash
      # this wont work
      --path /home/user/my folder --bot XDCC|BOT --download 123-125
      # fixed
      --path "/home/user/my folder" --bot "XDCC|BOT" --download 123-125 
    ```

## Documentation
Full documentation is available <a href="https://jipaix.github.io/xdccJS/classes/index.default.html">here</a>

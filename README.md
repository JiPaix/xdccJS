<h1 align="center">xdccJS</h1>
<h5 align="center">Easy to use IRC library to download from XDCC bots</h5>
<h4 align="center"><a href="#installation">Installation</a> | <a href="#quick-start">Quick Start</a> | <a href="#piping-downloads">Piping</a> | <a href="#api">API</a> | <a href="#events">Events API</a> | <a href="#advanced-exemple">Advanced Exemple</a></h4>

## Features
<p>
<img src="https://lh3.googleusercontent.com/proxy/4qrW3Kwqq042yq-udwN1xcmNPhUss5nzIfKLdB6XXUqckovqRXmASJ6QlrdLmWfDqrB_gZ1x4mfbEvhpX1R4hLfPQ65aCj00N2YGLf3aDvqQ0SW33baxfLSq" width=20px style="float:left;vertical-align:middle;margin-right:3px">
 <b>Easy and fast : </b>It will save you tons of time, i started this project after wasting so much time through the years using desktop clients. Now i can do any type of automation, once your set (and it could take less than 5 minutes) you won't even need to monitor releases and channels
</p>

<p>
<img src="https://www.tapioschool.com/wp-content/uploads/2015/06/ICON-DANCE-300x3001.png" width=20px style="float:left;vertical-align:middle;margin-right:3px">
 <b>Flexible : </b>You might want to use xdccJS for different type of projects, instead of saving files on your hard drive you could send them elsewhere. Take look at this <a href="#advanced-exemple">advanced exemple</a> where i setup an http server that send files "from" XDCC directly to clients.
 </p>
<p>
<img src="https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Antu_irc.svg/1024px-Antu_irc.svg.png" width=20px style="float:left;vertical-align:middle;margin-right:3px"> <b>Doesn't brew coffe (yet) :</b> xdccJS isn't just a downloader, it's also a complete IRC client. Thanks to <a href="https://github.com/kiwiirc/irc-framework">irc-framework</a> you can use their awesome <a href="ttps://github.com/kiwiirc/irc-framework/tree/master/docs">API</a> from within xdccJS without any additional installation 
</p>

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
#### Start a conection :
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
```
___
## Piping downloads

In order to enable pipes you must use the option `path: false`.  
When piping is enable files aren't saved on disk.
```js
/**
 * !IMPORTANT!
 * opts.path must be set to false in order to use pipes
 */
let opts = {
  host: 'irc.server.net',
  nick: 'ItsMeJiPaix',
  chan: '#friendly',
  path: false,
  port: 6660,
  verbose: false,
  randomizeNick: true
}
const xdccJS = new  XDCC(opts)

xdccJS.on('xdcc-read', () => {
  xdccJS.download("xdcc-bot-nickname", 32) 
})

xdccJS.on('pipe', (stream) => {
    stream.on('data', (data) => {
        // do something with data
    })
})
```
___
## API
>constructor(host, port, nick, chan, path [, disconnect] [, verbose])

Connects to IRC and join channel.
```ts
// EXEMPLE
new XDCC({
    host: "irc.server.net",
    port: 6660,
    nick: "JiPaix",
    chan: "#friendly",
    path: "dl",
    randomizeNick: false,
    verbose: true
})
```

| Fields                      | Type               | Description                                                                                                                                                  |
| --------------------------- | ------------------ | :----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| host                        | String             | IRC server <br> e.g., `irc.rizon.net`                                                                                                                        |
| port                        | Number             | IRC server's port                                                                                                                                            |
| nick                        | String             | Nickname to use.                                                                                                                                             |
| chan                        | String \| String[] | Channel to join<br> e.g., `#mychannel` or `mychannel` or `['#mychannel','yourchannel']`                                                                      |
| path                        | String \| false    | Download folder's name, e.g, `"downloads"` will save your files into *`/yourProject/downloads`*<br>If set to `false` disable file saving and **enable pipe** |
| randomizeNick<br>[optional] | Boolean            | Automatically truncate nickname if more than 6 characters and add number at the end<br>- default: `true`                                                     |
| verbose<br>[optional]       | Boolean            | Enable console logging (mostly download progress)<br>- default: `false`                                                                                      |
> download(target, package)

Download file from XDCC bot.
```js
// EXEMPLE #1 : Save to disk

/**
 * equivalent of IRC command:
 * /MSG XDCC|Aurora xdcc send #109 
 */

xdccJS.on('xdcc-ready', () => { 
 xdccJS.download("XDCC|Aurora", 109)
})
 

```
```js
// EXEMPLE #2 : Pipe
 
 /** 
  * To enable pipe make sure path is set to false
  * 
  * you can change this setting any time you want :
  * xdcc.path = false
  */

 xdccJS.on('xdcc-ready', () => {
  xdccJS.download("XDCC|Aurora", 109)
  xdccJS.on('pipe', (stream) => {
    stream.pipe(somewhere)
  })
 })

```
| Fields  | Type   | Description    |
| ------- | ------ | -------------- |
| target  | String | Bot's nickname |
| package | Number | Pack number    |
___
## Events
```js
.on('xdcc-ready', () => {
  //> every other events and methods should be written here.
})

.on('download start', (fileInfo) => {
 console.log(`Download of ${fileInfo.file} is starting`)
 //> output : Download of filename.mp4 is starting
})

.on('downloading', (bytesReceived, fileInfo) => {
  console.log(`${bytesReceived} / ${fileInfo.length}`)
  //> ouput : 15152 / 25123585
  // this is kind of what verbose does. 
})

.on('downloaded', (fileInfo) => {
 console.log(`Download available at: ${fileInfo.filePath}`)
 //> output: Download available at: /home/USER/myProject/downloads/filename.mp4'
})

.on('download error', (fileInfo) => {
  console.log('could not download: ' + fileInfo.file)
  //> output: could not download: filename.mp4
})
```
| Event Name     | Fired When                                                             | Callback                |
| -------------- | ---------------------------------------------------------------------- | ----------------------- |
| xdcc-ready     | xdccjs is ready to download: connected to irc and has joined a channel | -                       |
| download start | A download starts                                                      | fileInfo                |
| downloading    | Downloading (every chunk of bytes received)                            | bytesReceived, fileInfo |
| downloaded     | A download has been completed                                          | fileInfo                |
| download error | A download fails                                                       | fileInfo                |

> ```ts
> bytesReceived: Object
> ```
```js
// EXEMPLE of data returned
{
  file: "filename.mp4",
  filePath: "/home/myproject/dl/filename.mp4",
  ip: "104.244.42.1",
  port: 3010,
  length: 204800
}
```
> ```ts
> bytesReceived: Number
> ```
```js
// EXEMPLE of data returned
byteReceived // = 11548
```
## SHARED API?

`xdccjs` is built around [kiwiirc/irc-framework](https://github.com/kiwiirc/irc-framework) (a nodejs IRC client).  
As a result `xdccjs` inherits 100% of [`irc-framework` API](https://github.com/kiwiirc/irc-framework/blob/master/docs/clientapi.md)
###### Psst.. You don't need to install `irc-framework`, of course it's bundled with `xdccjs` <br>(TypeScript users: thanks to [@guyguy2001](https://github.com/guyguy2001) ~80% of it is typed)

## ADVANCED EXEMPLE

### run an http server with using express and download from browser :
Goal : trigger a download by visiting `/download?bot=BOTNAME&pack=32`
Goal#2: directly send file to client's web browser

```js
const XDCC = require('xdccjs').default

let opts = {
  host: 'irc.server.net',
  nick: 'JiPaix',
  chan: '#friendly',
  path: 'dl',
  port: 6660,
  verbose: false,
  disconnect: false // HAS to be false in this example
}

const xdccJS = new XDCC(opts)

// setting up express
const express = require('express')
const app = express()
const port = 3000


xdccJS.on('xdcc-ready', () => {
    app.get('/download', (req, res) => {
        xdccJS.download(req.query.bot, req.query.pack)

        xdccJS.on('pipe', (stream, fileInfo) => {
            res.set('Content-Disposition', `attachment;filename=${fileInfo.file}`);
            res.set('Content-Length', fileInfo.length)
            res.set('Content-Type', 'application/octet-stream')
            stream.on('data', (data) => {
                res.write(data)
            })
            stream.on('end', () => {
                res.end()
            })
        })
    })
    app.listen(port, () => console.log(`listening on port ${port}!`))
})
```
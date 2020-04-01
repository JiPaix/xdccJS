# XDCC for nodejs

## INSTALLATION
`npm i xdccjs`
```js
// ES6
import XDCC from 'xdccjs'

// CommonJS
const XDCC = require('xdccjs')
```
## USAGE
```js
let opts = {
  host: 'irc.server.net',
  nick: 'JiPaix',
  chan: '#friendly',
  path: 'dl',
  port: 6660,
  verbose: false,
  disconnect: false
}
```
```js
const xdcc = new  XDCC(opts)

xdcc.on('xdcc-ready', () => {
  // your code..
  xdcc.send("xdcc-bot-nickname", 23) //=> /MSG xdcc-bot-nickname xdcc send #23
})
```

## More examples
running an http server with express and starting download with POST
```js
// xdccJS setup
const XDCC = require('xdccjs')

let opts = {
  host: 'irc.server.net',
  nick: 'JiPaix',
  chan: '#friendly',
  path: 'dl',
  port: 6660,
  verbose: false,
  disconnect: false // HAS to be false in this example
}

const xdcc = new XDCC(opts)

// setting up express
const express = require('express')
const app = express()
const port = 3000
const bodyParser = require('body-parser')

app.use(bodyParser.json())


xdcc.on('xdcc-ready', () => {
  app.post('/download', (req, res) => {
    let target = req.body.xdccBotNickname
    let package = req.body.package
    xdcc.send(target, package)
  })
  app.listen(port, () => console.log(`listening on port ${port}!`))
})
```
## API
### Constructor
```ts
new XDCC({
    host: string; // irc server, e.g: irc.rizon.net
    port: number; 
    nick: string; // nickname, truncated if > 6 characters.
    chan: string; // #channel to join.
    path: string; // path relative to your project directory
    disconnect?: boolean | undefined; // default = false - disconnect from irc once download complete. 
    verbose?: boolean | undefined; // default = false - enable console logging (mostly connection and download progress). 
})
```
### Method
```ts
.send(
  target: string; // nickname of XDCC bot to receive the file from.
  pack: string | number; // pack id you need to download
)
```
```js
//> EXAMPLE
xdcc.send('XDCC-BOT', 23) // equivalent of irc command : /MSG XDCC-BOT xdcc send #23
```
### Events
```ts
.on('xdcc-ready', callback)
// trigger once connected to IRC and #channel is joined
```
```js
.on('download start', callback)
// triggered when a download starts

.on('download start', (fileInfo) => {
  console.log(fileInfo)
  // {
  //   file: "filename.mp4",
  //   filePath: "/home/myproject/dl/filename.mp4;
  //   ip: "104.244.42.1";
  //   port: 3010;
  //   length: 204800;
  //   }
})

```
```js
.on('downloading', callback)
// triggers every chunk of bytes you receive while downloading.
// you might want to use .once to avoid overloading.

.on('downloading', (bytesReceived, fileInfo) => {
  console.log(bytesReceived*100/fileInfo.length+'%')
  //=> 0%
  //=> 0.1%
  //=> etc...
})
// this is for example purpose only i recommend using the verbose parameters, it achieves the same things, in a better way.
```
```js
.on('downloaded', callback)
// triggers once download is completed.


.on('downloaded', (fileInfo) => {
  console.log('file available at: ' + fileInfo.filePath)
  //=> file available at: /home/myproject/dl/filename.mp4
})
```
```js
.on('download error', callback)
// triggers if download fails partway.


.on('download error', (fileInfo) => {
  console.log('could not download: ' + fileInfo.file)
  //=> could not download: filename.mp4
})
```
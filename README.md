# XDCC downloader for nodejs

## INSTALLATION
`npm i xdccjs`

```js
// commonJS
const XDCC = require('xdccjs').default

// ES6 or TypeScript
import XDCC from 'xdccjs'
```
## OPTIONS
```js
let opts = {
  host: 'irc.server.net', // IRC server
  nick: 'ItsMeJiPaix', // Nickname
  chan: '#friendly', // Channel to join
  path: 'dl', // Download path (relative)
  port: 6660, // IRC server's port
  verbose: false, // Show download progress
  disconnect: false // Disconnect from server once download is complete
}
```
## USAGE
```js
const xdcc = new  XDCC(opts)

xdcc.on('xdcc-ready', () => {
  xdcc.send("xdcc-bot-nickname", 23) //=> /MSG xdcc-bot-nickname xdcc send #23
})

xdcc.on('downloaded' (fileInfo) => {
  console.log(fileInfo.filePath) //=> /home/USER/folder/dl/filename.mp4
  //  Works on Windows too :
  //=> C:/users/USERNAME/folder/dl/filename.mp4
})
```
## More examples
run an http server with express and download files from POST data
```js
// xdccJS setup
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
    host: String, // IRC server - e.g: "irc.rizon.net"
    port: Number, // IRC server's port - e.g: 6660
    nick: String, // Nickname (truncated if > 6 chars + adds random number) - e.g: "ItsMeMario" = "ItsMeM293"
    chan: String, // Channel to join - e.g: "#friendly".
    path: String, // Download path is relative. - e.g: "dl"
    disconnect: Boolean, // [optional][default = false] Disconnect from server once download is complete. 
    verbose: Boolean // [optional][default = false] Enable console logging (connection status and download progress). 
})
```
### Method
```ts
.send(
  target: String, // XDCC bot's nickname - e.g : XDCC|Aurora.
  package: String | Number // pack #id - e.g : 152
)
```
```js
//> EXAMPLE
xdcc.send('XDCC-BOT', 23) // is equivalent of IRC command : /MSG XDCC-BOT xdcc send #23
```
### Events
```ts
.on('xdcc-ready', callback)
// triggers once IRC is connected to the server server and the channel is joined
```
```js
.on('download start', callback)
// triggers when a download starts

.on('download start', (fileInfo) => {
  console.log(fileInfo)
/**
 *   {
 *     file: "filename.mp4",
 *     filePath: "/home/myproject/dl/filename.mp4,
 *     ip: "104.244.42.1";
 *     port: 3010;
 *     length: 204800;
 *   }
 * 
 * .filePath always shows absolute path
 */
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
// triggers if a download fails partway.


.on('download error', (fileInfo) => {
  console.log('could not download: ' + fileInfo.file)
  //=> could not download: filename.mp4
})
```

## MORE API?

`xdccjs` is built around [kiwiirc/irc-framework](https://github.com/kiwiirc/irc-framework) (a nodejs IRC client).  
As a result `xdccjs` inherits 100% of [`irc-framework` API](https://github.com/kiwiirc/irc-framework/blob/master/docs/clientapi.md)
###### Psst.. You don't need to install `irc-framework`, of course it's bundled with `xdccjs` <br>(TypeScript users: thanks to [@guyguy2001](https://github.com/guyguy2001) ~80% of it is typed)
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
const XDCC = require('xdccJS').default

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

RTFM (coming soon)



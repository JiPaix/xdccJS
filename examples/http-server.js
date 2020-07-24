/**
 * Goal     : trigger a download by visiting `http://localhost:3000/download?bot=BOTNAME&pack=32`
 * Goal#2   : directly send file to client's web browser
 */

const XDCC = require('xdccjs').default

let opts = {
  host: 'irc.server.net',
  port: 6660,
  nick: 'ItsMeJiPaix',
  chan: ['#candy', '#fruits'],
  path: 'downloads',
  retry: 2,
  verbose: true, // optional
  randomizeNick: true, // optional
  passivePort: [5000, 5001, 5002], // optional
}

const xdccJS = new XDCC(opts)

// setting up express
const express = require('express')
const app = express()
const port = 3000
app.listen(port, () => console.log(`listening on port ${port}!`))

// waiting for xdccJS to be connected to IRC
xdccJS.on('xdcc-ready', () => {
  app.get('/download', (req, res) => {
    // starts download using url parameters
    xdccJS.download(req.query.bot, req.query.pack)
    // waiting xdcc bot to send data
    xdccJS.on('pipe-data', chunk => {
      res.set('Content-Disposition', `attachment;filename=${fileInfo.file}`) // set the filename and avoid browser directly playing the file.
      res.set('Content-Length', fileInfo.length) // set the size so browsers know completion%
      res.set('Content-Type', 'application/octet-stream')
      res.write(chunk) // redirecting data to client
    })
    // listening completion of downloads
    xdccJS.on('pipe-downloaded', () => {
      res.end() // stop sending data to client
    })
    // listening to errors
    xdccJS.on('pipe-err', () => {
        res.status(500).end() // stop sending data to client and raise a status 500 to make it aware of failure
    })
  })
})

/**
 * Goal     : trigger a download by visiting `http://localhost:3000/download?bot=BOTNAME&pack=32`
 * Goal#2   : directly send file to client's web browser
 */

const XDCC = require('xdccjs').default

let opts = {
  host: 'irc.server.net', // IRC hostname                           - required
  port: 6660, // IRC port                                           - optional (default: 6667)
  nick: 'ItsMeJiPaix', // Nickname                                  - optional (default: xdccJS)
  chan: ['#candy', '#fruits'], // Channel(s)                        - optional (default: "#xdccJS")
  path: 'downloads', // Download path                               - optional (default: false, which enables piping)
  retry: 2, // Nb of retries on failed download                     - optional (default: 1)
  verbose: false, // Display download progress and xdccJS status     - optioanl (default: false)
  randomizeNick: true, // Add random numbers at end of nickname     - optional (default: true)
  passivePort: [5000, 5001, 5002], // Ports to use with Passive DCC  - optional (default: [5001])
}

const xdccJS = new XDCC(opts)

// setting up express
const express = require('express')
const app = express()
const port = 3000
app.listen(port, () => console.log(`listening on port ${port}!`))

// waiting for xdccJS to be connected to IRC
xdccJS.on('ready', () => {
  app.get('/download', (req, res) => {
    // starts download using url parameters
    xdccJS.download(req.query.bot, req.query.pack)
    // waiting xdcc bot to send data
    xdccJS.on('data', chunk => {
      res.set('Content-Disposition', `attachment;filename=${fileInfo.file}`) // set the filename and avoid browser directly playing the file.
      res.set('Content-Length', fileInfo.length) // set the size so browsers know completion%
      res.set('Content-Type', 'application/octet-stream')
      res.write(chunk) // redirecting data to client
    })
    // listening completion of downloads
    xdccJS.on('downloaded', () => {
      res.end() // stop sending data to client
    })
    // listening to errors
    xdccJS.on('err', () => {
      res.status(500).end() // stop sending data to client and raise a status 500 to make it aware of failure
    })
  })
})

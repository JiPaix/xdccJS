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
  verbose: true, // optional
  randomizeNick: true, // optional
  passivePort: [5000, 5001, 5002] // optional
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
        // download respond with a downoad-pipe event
        xdccJS.on('pipe-data', (stream) => {
            res.set('Content-Disposition', `attachment;filename=${fileInfo.file}`); // set the filename and avoid browser directly playing the file.
            res.set('Content-Length', fileInfo.length) // set the size so browsers know completion% 
            res.set('Content-Type', 'application/octet-stream')
            stream.on('data', (chunk) => {
                // send every chunk received from XDCC directly to the client
                res.write(chunk)
            })
            stream.on('end', () => {
                // tell the client download is complete
                res.end()
            })
        })
    })
})

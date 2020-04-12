/**
 * Goal     : trigger a download by visiting `/download?bot=BOTNAME&pack=32`<br>
 * Goal#2   : directly send file to client's web browser
 */

const XDCC = require('xdccjs')

let opts = {
    host: 'irc.server.net',
    nick: 'JiPaix',
    chan: '#friendly',
    path: 'dl',
    port: 6660,
    verbose: false,
    disconnect: false // HAS to be false so we can directly serve files to client without saving them on disk
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
        xdccJS.on('download-pipe', (stream, fileInfo) => {
            res.set('Content-Disposition', `attachment;filename=${fileInfo.file}`); // set the filename and avoid browser directly playing the file.
            res.set('Content-Length', fileInfo.length) // set the size so browsers know completion% 
            res.set('Content-Type', 'application/octet-stream')
            stream.on('data', (data) => {
                // send every bytes received from DCC to the client
                res.write(data)
            })
            stream.on('end', () => {
                // tell the client download is complete
                res.end()
            })
        })
    })
})
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

// event triggered once xdccJS is connected to irc and all channels are joined
xdccJS.on('xdcc-ready', () => { 
    xdccJS.download('BOT_NICKNAME', 25) // equivalent of : /MSG BOT_NICKNAME XDCC SEND #25
    
    // event triggered right before data is being transfered
    xdccJS.on('download-start', (info) => {
        console.log(info.file) //=> file.mp4
        console.log(info.filePath) //=> /path/to/file.mp4
        console.log(info.length + ' bytes') //=> 734003200 bytes
    })
    
    // event triggered every chunk of bytes received
    xdccJS.on('data', (info, r) => {
       console.log('received : ' + r + ' / ' + info.length) //  /!\ this will spam your console /!\
       //=> received : 156078 / 734003200
    })
    
    // event triggered once a download is complete
    xdccJS.on('downloaded', (info) => {
        console.log('file download at: ' + info.filePath)
        //=> File downloaded at: /path/to/file.mp4
    })
    
    xdccJS.on('download-err', (err, info) => {
        console.log('failed to download: '+info.file) //=> failed to download: file.mp4
        console.log(err) // displays error informations
    })
})
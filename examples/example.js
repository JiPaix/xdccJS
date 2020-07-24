// example covering most of xdccJS basic options
/**
 * PSA: Do not use as is, this is an example for the sake of showing all functionalities
 * Using "verbose" is a lot more efficient if all you need is to display download status in console
 */

const XDCC = require('xdccjs').default

let opts = {
  host: 'irc.server.net', // IRC hostname                           - required
  port: 6660, // IRC port                                           - optional (default: 6667)
  nick: 'ItsMeJiPaix', // Nickname                                  - optional (default: xdccJS)
  chan: ['#candy', '#fruits'], // Channel(s)                        - optional (default: "#xdccJS")
  path: 'downloads', // Download path                               - optional (default: false, which enables piping)
  retry: 2, // Nb of retries on failed download                     - optional (default: 1)
  verbose: false, // Display download progress and xdccJS status    - optioanl (default: false)
  randomizeNick: false, // Add random numbers at end of nickname    - optional (default: true)
  passivePort: [5000, 5001, 5002], // Ports to use with Passive DCC - optional (default: [5001])
}

// event triggered once xdccJS is connected to irc and all channels are joined
xdccJS.on('xdcc-ready', () => {
  xdccJS.download('BOT_NICKNAME', 25) // equivalent of : /MSG BOT_NICKNAME XDCC SEND #25

  // event triggered right before data is being transfered
  xdccJS.on('download-start', info => {
    console.log(info.file) //=> file.mp4
    console.log(info.filePath) //=> /path/to/file.mp4
    console.log(info.length + ' bytes') //=> 734003200 bytes
  })

  // event triggered every chunk of bytes received
  xdccJS.on('downloading', (received, info) => {
    console.log('received : ' + received + ' / ' + info.length) //  /!\ this will spam your console /!\
    //=> received : 156078 / 734003200
  })

  // event triggered once a download is complete
  xdccJS.on('downloaded', info => {
    console.log('file download at: ' + info.filePath)
    //=> File downloaded at: /path/to/file.mp4
  })

  xdccJS.on('download-err', (err, info) => {
    console.log('failed to download: ' + info.file) //=> failed to download: file.mp4
    console.log(err) // displays error informations
  })
})

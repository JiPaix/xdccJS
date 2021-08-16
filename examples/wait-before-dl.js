// wait in channel x seconds before sending request to the bot

const XDCC = require('xdccjs').default

let opts = {
  host: 'irc.server.net', // IRC hostname                           - required
  port: 6660, // IRC port                                           - optional (default: 6667)
  nick: 'ItsMeJiPaix', // Nickname                                  - optional (default: xdccJS)
  chan: ['#candy', '#fruits'], // Channel(s)                        - optional (default: "#xdccJS")
  path: 'downloads', // Download path                               - optional (default: false, which enables piping)
  retry: 3, // Nb of retries on failed download                     - optional (default: 1)
  verbose: false, // Display download progress and xdccJS status    - optioanl (default: false)
  randomizeNick: false, // Add random numbers at end of nickname    - optional (default: true)
  passivePort: [5000, 5001, 5002], // Ports to use with Passive DCC - optional (default: [5001])
}

const xdccJS = new XDCC(opts)
const ms = 60 * 1000 //=> 60 seconds

xdccJS.on('ready', () => {
  // connected and joined channels: waiting 60s before sending /MSG delayed-bot xdcc send #44
  setTimeout(async () => {
    await xdccJS.download('delayed-bot', 44)
  }, ms)
})

// download from multiple servers

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

/**
 * EXAMPLE #1 - multi server with same instance (one server at a time):
 */
const xdccJS = new XDCC(opts)
xdccJS.once('ready', () => {
  xdccJS.donwload('a-bot', 20)
  xdccJS.once('can-quit', () => {
    xdccJS.reconnect({
      host: 'irc.other-server.net',
      port: 9999,
      chan: ['#salty', '#lemon'],
    })
    xdccJS.once('ready', () => {
      xdccJS.download('bot-from-another-server', 33)
    })
    xdccJS.once('can-quit', () => {
      xdccJS.quit() // finish and quit here
    })
  })
})

/**
 * EXAMPLE # 2 - multi server with multiple instance
 */

const xdccJS_1 = new XDCC(opts)
opts.host = 'irc.new-server.net'
opts.port = 9999
opts.chan = ['#another', '#planet']
const xdccJS_2 = new XDCC(opts)

xdccJS_1.once('ready', () => {
  xdccJS_1.download('bot-from-server1', 20)
})
xdccJS_2.once('ready', () => {
  xdccJS_2.download('bot-from-server2', 79)
})

const XDCC = require('xdccjs').default

let opts = {
  host: 'irc.server.net', // IRC hostname                           - required
  port: 6660, // IRC port                                           - optional (default: 6667)
  nick: 'ItsMeJiPaix', // Nickname                                  - optional (default: xdccJS)
  chan: ['#candy', '#fruits'], // Channel(s)                        - optional (default: "#xdccJS")
  path: 'downloads', // Download path                               - optional (default: false, which enables piping)
  retry: 2, // Nb of retries on failed download                     - optional (default: 1)
  verbose: false, // Display download progress and xdccJS status    - optioanl (default: false)
  randomizeNick: true, // Add random numbers at end of nickname    - optional (default: true)
  passivePort: [5000, 5001, 5002], // Ports to use with Passive DCC - optional (default: [5001])
}

const xdccJS = new XDCC(opts)

xdccJS.once('ready', () => {
  const Job1 = xdccJS.download('a-bot', '1-5, 26')
  xdccJS.download('another-bot', 32)
  xdccJS.download('wow-you-leecher', [22, 150, 20])

  xdccJS.jobs().length // 2

  // find job by botname
  const Job2 = xdccJS.job('another-bot')

  // cancel a job
  Job1.cancel()

  // find job and cancel() it
  xdccJS.job('wow-you-leecher').cancel()

  // lets pretend Job2 finished
  console.log(xdccJS.jobs('another-bot')) // [ ]
  // but this one is still accessible
  console.log(Job2.show())

  /**
   * Jobs limitation a.k.a how not to get xdccJS buggy
   */

  xdccJS.jobs() // returns jobs with additional information (like internal functions you don't want to break)
  xdccJS.jobs()[0].cancel() // OK: cancel current job
  xdccJS.jobs()[0].mycustomProperty = 'x' // OK: but Meehh
  xdccJS.jobs()[0].queue = [3, 2, 5] // OK: change content of queue
  xdccJS.jobs()[0].now = 22 // NO!
  xdccJS.jobs()[0].emit('error') // NO! WHY? emitted events are used internally.
})

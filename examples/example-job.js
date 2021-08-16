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

xdccJS.once('ready', async () => {
  const Job1 = await xdccJS.download('a-bot', '1-5, 26') //=> save job as Job1
  await xdccJS.download('another-bot', 32) //=> start Job without reference
  await xdccJS.download('wow-you-leecher', [22, 150, 20]) //=> start Job without reference

  await xdccJS.jobs().length //=> 3

  // retrieve a job by nickname
  const Job2 = xdccJS.job('another-bot')
  const Job3 = xdccJS.job('wow-you-leecher')

  // cancel job2
  Job2.cancel()

  // display job3 info and progress
  console.log(Job3.show())
  // lets pretend Job1 finished
  console.log(Job1) // [ ]

  /**
   * Jobs limitation a.k.a how not to get xdccJS buggy
   */

  xdccJS.jobs()[0].queue = [3, 2, 5] // Don't!
  xdccJS.jobs()[0].now = 22 // NO!
  xdccJS.jobs()[0].emit('error') // WHY?
})

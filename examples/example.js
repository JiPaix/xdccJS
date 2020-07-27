// example covering most of xdccJS basic options

// PSA: Using console.log is not recommended, this example is for the sake of showing xdccJS capabilities
// FYI: Setting `verbose` to `true` gives the same results as this example (with colors and better formatting).

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

xdccJS.on('ready', () => {
  // every .download() starts a job
  xdccJS.download('XDCC|BLUE', '1-3, 8, 55') // Job#1 is started
  xdccJS.download('XDCC|RED', [1, 3, 10, 20]) // Job#2 is started
  xdccJS.download('XDCC|BLUE', 23) // Job#1 is updated
})

// event triggered everytime a file is downloaded regardless of its job
xdccJS.on('downloaded', fileInfo => {
  console.log(fileInfo.filePath) //=> /home/user/xdccJS/downloads/myfile.pdf
})

// event triggered when a job is done.
xdccJS.on('done', job => {
  console.log(job.nick) //=> XDCC|BLUE
  console.log(job.failures) //=> [1, 8, 55]
  console.log(job.success) //=> ['document.pdf', 'audio.wav']
  // Job#1 deleted
})

// event triggered when all jobs are done.
xdccJS.on('can-quit', () => {
  xdccJS.quit() // this is how you disconnect from IRC
})

// Running jobs can be shown anytime using `.jobs()`
console.log(xdccJS.jobs())
//=> CONSOLE OUTPUT :
// [
//   {
//     nick: 'bot',
//     queue: [5, 9, 21], // packs in queue
//     now: 4, // pack currently downloading
//     failures: [1, 2], // failed packs
//     success: ['document.pdf', 'audio.wav', 'video.mp4'], // successfully downloaded files
//   },
//   {
//     nick: 'another-bot',
//     queue: [3],
//     now: 2,
//     failures: [],
//     success: [],
//   }
// ]

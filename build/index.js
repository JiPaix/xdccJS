// build helper
const fs = require('fs')
files = ['./lib/progress/index.js', './lib/progress/index.d.ts']
fs.mkdirSync('./dist/lib/progress', { recursive: true })
fs.createReadStream('./lib/progress/index.js').pipe(fs.createWriteStream('./dist/lib/progress/index.js'))
fs.createReadStream('./lib/progress/index.d.ts').pipe(fs.createWriteStream('./dist/lib/progress/index.d.ts'))

const jsPath = './dist/index.js'
const tsPath = './dist/index.d.ts'

// lazy typing :

let dts = fs.readFileSync('./dist/index.d.ts').toString()
const LazyString = `declare class Controller extends EventEmitter {
on(eventType: string | symbol, cb: (event?: unknown, another?: unknown) => void): this
/**
 * @description Event triggered when .download() has finished downloading all files
 * @example
 * xdccJS.on('ready', () => {
 *    xdccJS.download('XDCC|BLUE', '23-25, 102, 300')
 *    xdccJS.download('XDCC|RED', 1152)
 * })
 *
 * xdccJS.on('done', job => {
 *    console.log(job)
 *    console.log('-----')
 * })
 *
 * // console output :
 *
 * {
 *    nick: 'XDCC|RED',
 *    success: ['file.txt'],
 *    failures: []
 * }
 * -----
 * {
 *    nick: 'XDCC|BLUE',
 *    success: [ 'file.pdf', 'video.mp4', 'audio.wav' ],
 *    failures: [ 24, 300 ]
 * }
 */
on(eventType: 'done', cb: (job: Job) => void): this
/**
 * @description Event triggered when a file is downloaded
 * @example
 * xdccJS.on('downloaded', fileInfo => {
 *    console.log('file available @: ' + fileInfo.filePath)
 * })
 */
on(eventType: 'downloaded', cb: (fileInfo: FileInfo) => void): this
/**
 * @description Event triggered when all downloads are done
 * @example
 * xdccJS.on('can-quit', () => {
 *    xdccJS.quit()
 * })
 */
on(eventType: 'can-quit', cb: () => void): this
/**
 * @description Event triggered when a download/connection error happens
 * @remark This event doesn't skip retries
 * @remark fileInfo isn't provided in case of an error not related to a download
 * @example
 * xdccJS.on('error', (error, fileInfo) => {
 *    console.log('failed to download: ' + fileInfo.file)
 *    console.log(error)
 * })
 * // CONSOLE OUTPUT
 *  //=> failed to download myfile.mp'
 *  //=> timeout: no response from BOT-NICKNAME
 */
on(eventType: 'error', cb: (error: Error, fileInfo: FileInfo) => void): this
/**
 * @description Event triggered when xdccJS is ready to download
 * @example
 * 
 * xdccJS.on('ready', () => {
 *    xdccJS.download('BOT', '1-5, 22-35, 100, 132')
 * })
 */
on(eventType: 'ready', cb: () => void): this

`
dts = dts.replace(`declare class Controller extends EventEmitter {`, LazyString)
fs.writeFileSync(tsPath, dts)

// pattern to replace
const strings = [
  { match: /\s+\*\s```js/gi, replace: '' },
  { match: /\s+\*\s```sh/gi, replace: '' },
  { match: /\s+\*\s```/gi, replace: '' },
  { match: /{@link (\S+)}/gi, replace: '`$1`' },
]

const replace = buffer => {
  let string = buffer.toString()
  for (const i of strings) {
    string = string.replace(i.match, i.replace)
  }
  return string
}

if (fs.existsSync(tsPath) && fs.existsSync(jsPath)) {
  let js = fs.readFileSync(jsPath)
  let ts = fs.readFileSync(tsPath)
  fs.writeFileSync(jsPath, replace(js))
  fs.writeFileSync(tsPath, replace(ts))
  console.log('done')
} else {
  console.error('run yarn build first')
  process.exit(1)
}

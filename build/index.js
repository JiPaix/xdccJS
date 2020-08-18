// build helper
const fs = require('fs')
files = ['./lib/progress/index.js', './lib/progress/index.d.ts']
fs.mkdirSync('./dist/lib/progress', { recursive: true })
fs.createReadStream('./lib/progress/index.js').pipe(fs.createWriteStream('./dist/lib/progress/index.js'))
fs.createReadStream('./lib/progress/index.d.ts').pipe(fs.createWriteStream('./dist/lib/progress/index.d.ts'))

const jsPath = './dist/index.js'
const tsPath = './dist/index.d.ts'

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

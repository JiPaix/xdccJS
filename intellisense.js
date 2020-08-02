const fs = require('fs')
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

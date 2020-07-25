const fs = require('fs')
const jsPath = './dist/index.js'
const tsPath = './dist/index.d.ts'

// strings to remove
const strings = [
  { match: /```js/gi, replace: '' },
  { match: /```sh/gi, replace: '' },
  { match: /```/gi, replace: '' },
  {
    match: ', see {@link Params} for a complete description of all parameters',
    replace: '',
  },
  { match: '{@link Params.path}', replace: '`path`' },
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

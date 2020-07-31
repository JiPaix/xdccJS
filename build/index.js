// build helper
const fs = require('fs')
files = ['./lib/progress/index.js', './lib/progress/index.d.ts']
fs.mkdirSync('./dist/lib/progress', { recursive: true })
fs.createReadStream('./lib/progress/index.js').pipe(fs.createWriteStream('./dist/lib/progress/index.js'))
fs.createReadStream('./lib/progress/index.d.ts').pipe(fs.createWriteStream('./dist/lib/progress/index.d.ts'))

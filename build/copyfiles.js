// Copy necessary files to dist
const fs = require('fs')
fs.mkdirSync('./dist/lib/progress', { recursive: true })
fs.createReadStream('./lib/progress/index.js').pipe(fs.createWriteStream('./dist/lib/progress/index.js'))
fs.createReadStream('./lib/progress/index.d.ts').pipe(fs.createWriteStream('./dist/lib/progress/index.d.ts'))

fs.createReadStream('./package.json').pipe(fs.createWriteStream('./src/package.json'))



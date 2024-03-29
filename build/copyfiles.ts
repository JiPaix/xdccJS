// Copy necessary files to dist
import * as fs from 'fs';

fs.mkdirSync('./dist/lib/progress', { recursive: true });
fs.createReadStream('./src/lib/progress/index.js').pipe(fs.createWriteStream('./dist/lib/progress/index.js'));
fs.createReadStream('./src/lib/progress/index.d.ts').pipe(fs.createWriteStream('./dist/lib/progress/index.d.ts'));
fs.createReadStream('./package.json').pipe(fs.createWriteStream('./src/version.json'));

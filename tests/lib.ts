import 'dotenv/config';
import XDCC from '../src'
import { env } from 'process'

const xdccJS = new XDCC({
  host: env.SERVER,
})


function msToReadableTime(ms: number) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  const readableTime = {
    days,
    hours: hours % 24,
    minutes: minutes % 60,
    seconds: seconds % 60,
  };

  // return a human readable string
  const readableString = Object.entries(readableTime)
    .map(([unit, value]) => `${value} ${unit}${value > 1 ? 's' : ''}`)
    .join(', ');

  return readableString;
}


xdccJS.on('ready', ()=> {
  xdccJS.download(env.BOT, env.PACK)
  let lastTime = Date.now();
  xdccJS.on('downloading', (fileinfo, received, percentage, eta) => {
    if(lastTime + 500 < Date.now()) {
      lastTime = Date.now()
      console.log(`Downloading ${fileinfo.file} - ${received}/${fileinfo.length} - (${percentage}%) @ETA (${msToReadableTime(eta)})`)
    }
  })
  xdccJS.on('done', () => console.log('done'));
})
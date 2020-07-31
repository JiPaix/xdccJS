// This example will start vlc.exe then play the video while it's downloading. (videos aren't skippable)
const opts = {
  host: 'irc.server.net',
  path: false,
}

const xdccJS = new XDCC(opts)

// Start VLC
const { spawn } = require('child_process')
const vlcPath = path.normalize('C:\\Program Files\\VideoLAN\\VLC\\vlc.exe')
const vlc = spawn(vlcPath, ['-'])

xdccJS.on('ready', () => {
  const Job = xdccJS.download('bot', 155)
})

// send data to VLC that plays the file
Job.on('pipe', stream => {
  stream.pipe(vlc.stdin)
})

/* eslint-disable @typescript-eslint/member-delimiter-style */
/* eslint-disable @typescript-eslint/no-this-alias */
/* eslint-disable @typescript-eslint/triple-slash-reference */
/// <reference path="@types/irc-framework.ts"/>
import { Client } from 'irc-framework'
import { Candidate } from './interfaces/candidate'
import { FileInfo } from './interfaces/fileinfo'
import { Job } from './interfaces/job'
import { PassThrough } from 'stream'
import ePrint, { colorize } from './helpers/printer'
import Timeout from './helpers/timeouthandler'
import EventHandler from './helpers/eventhandler'
import TypeChecker from './helpers/typechecker'
import * as fs from 'fs'
import * as path from 'path'
import * as net from 'net'
import * as ProgressBar from './lib/progress'
import * as colors from 'colors/safe'
import * as ip from 'public-ip'
import { Params } from './interfaces/params'

/**
 * XDCC
 * @noInheritDoc
 */
export default class XDCC extends Client {
  host!: string
  port = 6667
  retry = 1
  nick = 'xdccJS'
  chan: string[] = []
  resumequeue: {
    nick: string
    ip: string
    length: number
    token: number
  }[] = []
  candidates: Job[] = []
  connectionTimeout: NodeJS.Timeout
  path: false | string = false
  verbose!: boolean
  passivePort: number[] = [5001]
  portInUse: number[] = []
  ip!: number

  /**
   * @description Initiate IRC connection
   * @remark If you want to use pipes {@link Params.path} must be set to false
   * @example
   * ```js
   * let params = {
   *  host: 'irc.server.net',
   *  port: 6667,
   *  nick: 'JiPaix',
   *  chan: ['#itsMe', '#JiPaix' ],
   *  path: 'downloads',
   *  retry: 2,
   *  verbose: true,
   *  randomizeNick: true,
   *  passivePort : [5001, 5002, 5003]
   * }
   *
   * const xdccJS = new XDCC(params)
   *
   * xdccJS.on('ready', () => {
   *  // do your stuff here
   * })
   * ```
   */
  constructor(parameters: {
    /**
     * @description IRC server's hostname
     * @example
     * ```js
     * params.host = 'irc.server.net'
     * ```
     */
    host: string
    /**
     * @description IRC server PORT
     * @default `6667`
     * @example
     * ```js
     * params.port = 6669
     * ```
     */
    port?: number
    /**
     * @description Nickname to use on IRC
     * @default `'xdccJS' + randomInt`
     * @example
     * ```js
     * params.nick = 'JiPaix'
     * ```
     */
    nick?: string
    /**
     * @description Channel(s) to join
     * @remark Hashtags are optional
     * @example
     * ```js
     * params.chan = '#wee'
     * // can also be an array
     * params.chan = ['#wee', '#happy']
     * // in both cases # are optional
     * params.chan = 'weee'
     * params.chan = ['#wee', 'happy']
     * ```
     */
    chan?: string | string[]
    /**
     * @description Download path
     * @default `false`
     * @remark `undefined` or `false` enables piping, see {@link XDCC.download} for example on how to use pipes.
     * @example
     * ```js
     * // absolute path
     * params.path = '/home/user/downloads
     * ```
     * @example
     * ```js
     * // relative path
     * params.path = 'downloads/xdcc' //=> /your/project/folder/downloads/xdcc
     * ```
     * @example
     * ```js
     * // explicitly enable piping
     * params.path = false
     * ```
     * */
    path?: string | false
    /**
     * @description Display information regarding your download in console
     * @default `false`
     * @example
     * ```js
     * params.verbose = true
     * ```
     */
    verbose?: boolean
    /**
     * @description Add Random numbers to nickname
     * @default: `true`
     * @example
     * ```js
     * params.randomizeNick = false
     * ```
     */
    randomizeNick?: boolean
    /**
     * @description Array of ports for passive DCC
     * @default `[5001]`
     * @remark Some xdcc bots use passive dcc, this require to have these ports opened on your computer/router/firewall
     * @example
     * ```js
     * params.passivePort = [3833, 2525]
     */
    passivePort?: number[]
    /**
     * @description Number of retries when a download fails
     * @default `1`
     * @example
     * ```js
     * // we've set params.retry = 2
     * xdccJS.download('xdcc|bot', '20, 25')
     * // if download of pack '20' fails it will retry twice before skipping to pack '25'
     */
    retry?: number
  }) {
    super()
    ip.v4().then(res => {
      const d = res.split('.')
      this.ip = ((+d[0] * 256 + +d[1]) * 256 + +d[2]) * 256 + +d[3]
    })
    const checkedParams = TypeChecker.paramChecker(parameters)
    this.host = checkedParams.host
    this.nick = checkedParams.nick
    this.path = checkedParams.path
    this.verbose = checkedParams.verbose
    this.chan = checkedParams.chan
    this.passivePort = checkedParams.passivePort
    this.retry = checkedParams.retry
    this.chan = this.chan.map(c => TypeChecker.chanHashtag(c))
    this.connectionTimeout = setTimeout(() => {
      const msg = colorize(`%danger% couldn't connect to : %bold%%yellow%${parameters.host}`)
      console.error(msg)
    }, 1000 * 60)
    this.connect({
      host: this.host,
      port: this.port,
      nick: this.nick,
      encoding: 'utf8',
    })
    this.__startListeningEvents()
  }

  /**
   * @description reconnect to IRC
   * @remark will reconnect to the same server if no parameters are provided
   * @default
   * info.port = 6667
   * @example
   * ```js
   * // reconnect to the same server
   * xdccJS.reconnect()
   * ```
   * ```js
   * // connect to another server
   * xdccJS.reconnect({
   *    host: 'irc.newserver.net'
   * })
   */
  public reconnect(info?: Params): void {
    this.quit()
    setTimeout(() => {
      if (info) {
        const checkedParams = TypeChecker.paramChecker(info)
        this.host = checkedParams.host
        this.nick = checkedParams.nick
        this.path = checkedParams.path
        this.verbose = checkedParams.verbose
        this.chan = checkedParams.chan
        this.passivePort = checkedParams.passivePort
        this.retry = checkedParams.retry
        this.chan = this.chan.map(c => TypeChecker.chanHashtag(c))
      }
      this.connect({
        host: this.host,
        port: this.port,
        nick: this.nick,
        encoding: 'utf8',
      })
      console.log('connect!')
    }, 1000 * 5)
  }
  /**
   * @ignore
   */
  __startListeningEvents(): void {
    EventHandler.onConnect(this)
    EventHandler.onRequest(this)
    EventHandler.onCtcpRequest(this)
    EventHandler.onNext(this)
  }

  __checkBeforeDL(resp: { [prop: string]: string }, candidate: Job): void {
    let isNotResume = true
    const fileInfo = this.__parseCtcp(resp.message, resp.nick)
    let stream: fs.WriteStream | PassThrough | undefined = undefined
    if (fileInfo) {
      new Timeout(this, candidate, fileInfo)
        .eventType('error')
        .eventMessage(`%danger% couldn't connect to %yellow%` + fileInfo.ip + ':' + fileInfo.port, 6)
        .start(15)
      if (!this.path) {
        stream = new PassThrough()
      } else {
        if (fileInfo.type === 'DCC ACCEPT') {
          fileInfo.position = fileInfo.position ? fileInfo.position : 0
          fileInfo.length = fileInfo.length - fileInfo.position
          stream = fs.createWriteStream(fileInfo.filePath, {
            flags: 'r+',
            start: fileInfo.position,
          })
        } else if (fileInfo.type === 'DCC SEND') {
          if (fs.existsSync(fileInfo.filePath)) {
            candidate.timeout ? clearTimeout(candidate.timeout) : false
            isNotResume = false
            let position = fs.statSync(fileInfo.filePath).size
            if (fileInfo.length === position) {
              position = position - 8192
            }
            const quotedFilename = /\s/.test(fileInfo.file) ? `"${fileInfo.file}"` : fileInfo.file
            this.ctcpRequest(resp.nick, 'DCC RESUME', quotedFilename, fileInfo.port, position, fileInfo.token)
            this.resumequeue.push({
              nick: resp.nick,
              ip: fileInfo.ip,
              length: fileInfo.length,
              token: fileInfo.token,
            })
            new Timeout(this, candidate, fileInfo)
              .eventType('error')
              .eventMessage(`%danger% couldn't resume download of %cyan%` + fileInfo.file, 6)
              .start(15)
          } else {
            stream = fs.createWriteStream(fileInfo.filePath)
          }
        }
      }
      if (stream && isNotResume) {
        this.__prepareDL(stream, fileInfo, candidate, resp)
      }
    }
  }

  __prepareDL(
    stream: fs.WriteStream | PassThrough,
    fileInfo: FileInfo,
    candidate: Job,
    resp: { [x: string]: string }
  ): void {
    let server: net.Server | undefined = undefined
    let client: net.Socket | undefined = undefined
    let available
    let pick: number | undefined
    if (fileInfo.port === 0) {
      available = this.passivePort.filter(port => !this.portInUse.includes(port))
      pick = available[Math.floor(Math.random() * available.length)]
      if (pick) {
        server = net.createServer(client => {
          new Timeout(this, candidate, fileInfo)
            .eventType('error')
            .eventMessage('%danger% Timeout: no initial connnection', 6)
            .disconnectAfter(stream, client, server)
            .start(15)
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          this.__processDL(server, client, stream!, candidate, fileInfo, pick)
        })
        this.portInUse.push(pick)
        server.listen(pick, '0.0.0.0', () => {
          this.raw(
            `PRIVMSG ${resp.nick} ${String.fromCharCode(1)}DCC SEND ${fileInfo.file} ${this.ip} ${pick} ${
              fileInfo.length
            } ${fileInfo.token}${String.fromCharCode(1)}`
          )
          if (this.verbose) {
            ePrint(`%info% waiting for connexion on port: %yellow%${pick}`, 6)
          }
        })
      } else {
        new Timeout(this, candidate, fileInfo)
          .eventType('error')
          .eventMessage('%danger% all passive ports are currently used %yellow' + this.portInUse.join(', '), 4)
          .start(0)
      }
    } else {
      client = net.connect(fileInfo.port, fileInfo.ip)
      this.__processDL(server, client, stream, candidate, fileInfo, pick)
    }
  }
  __processDL(
    server: net.Server | undefined,
    client: net.Socket,
    stream: fs.WriteStream | PassThrough,
    candidate: Job,
    fileInfo: FileInfo,
    pick: number | undefined
  ): void {
    candidate.cancel = (): void => {
      candidate.timeout ? clearTimeout(candidate.timeout) : false
      const cancel = new Error('cancel')
      client.destroy(cancel)
    }
    const bar = this.__setupProgressBar(fileInfo.length)
    let received = 0
    const sendBuffer = Buffer.alloc(8)
    client.on('connect', () => {
      candidate.timeout ? clearTimeout(candidate.timeout) : false
      if (!this.path) {
        candidate.emit('pipe', stream, fileInfo)
        this.emit('pipe', stream, fileInfo)
      }
    })
    client.on('data', data => {
      candidate.timeout ? clearTimeout(candidate.timeout) : false
      stream.write(data)
      received += data.length
      sendBuffer.writeBigInt64BE(BigInt(received), 0)
      client.write(sendBuffer)
      if (this.verbose) {
        bar.tick(data.length)
      }
      if (received === fileInfo.length) {
        client.end()
      } else {
        new Timeout(this, candidate, fileInfo, bar)
          .eventType('error')
          .eventMessage('%danger% Timeout: Not receiving data', 6)
          .disconnectAfter(stream, client, server)
          .start(2)
      }
    })
    client.on('end', () => {
      candidate.timeout ? clearTimeout(candidate.timeout) : false
      ePrint('%success% done : %cyan%' + fileInfo.file, 8)
      candidate.success.push(fileInfo.file)
      if (server) {
        server.close(() => {
          this.portInUse = this.portInUse.filter(p => p !== pick)
        })
      }
      stream.end()
      client.end()
      this.emit('downloaded', fileInfo)
      candidate.emit('downloaded', fileInfo)
      this.emit('next', candidate)
    })

    client.on('error', (e: { message: string }) => {
      candidate.timeout ? clearTimeout(candidate.timeout) : false
      const msg =
        e.message === 'cancel'
          ? '%danger% Job cancelled: %cyan%' + candidate.nick
          : '%danger% Connection error: %yellow%' + e.message
      const event = e.message === 'cancel' ? 'cancel' : 'error'
      new Timeout(this, candidate, fileInfo, bar)
        .eventType(event)
        .eventMessage(msg)
        .disconnectAfter(stream, client, server)
        .executeLater(() => {
          if (e.message === 'cancel') {
            candidate.failures.push(candidate.now)
            candidate.queue = []
            if (fs.existsSync(fileInfo.filePath)) {
              fs.unlinkSync(fileInfo.filePath)
            }
            this.emit('next', candidate)
          } else {
            this.__redownload(candidate, fileInfo)
          }
        })
        .start(0)
    })
  }

  /**
   * @description Method used to download packet(s). <br/>`download()` returns a {@link Job} object, jobs are used to keep track of what's going on
   * @see {@link Job} documentation
   * @see {@link pipe} event to see how piping works
   * @param target - Bot's nickname
   * @param packets - Pack number(s)
   * @example
   * ```js
   * const params = {
   *  host: 'irc.server.net',
   *  path: '/home/user/downloads'
   * }
   *
   * const xdccJS = new XDCC(params)
   *
   * xdccJS.on('ready', () => {
   *   const Job1 = xdccJS.download('XDCC|Bot', 152)
   *   const Job2 = xdccJS.download('XDCC|Another-bot', '1-3, 55, 32-40, 99999')
   * })
   * ```
   * @example Each {@link Job} has events :
   * ```js
   * // when Job1 has downloaded a file
   * Job1.on('downloaded', (fileInfo) => {
   *  console.log(fileInfo.filePath) //=> "/home/user/downloads/myfile.pdf"
   * })
   *
   * // when Job2 is completly done
   * Job2.on('done', (job) => {
   *   console.log(job.show())
   *   //=> { name: 'XDCC|Another-bot', failures: [40, 99999], success: ['doc.pdf', 'audio.wav'] }
   * })
   *```
   * @example You can access events globally
   * ```js
   * // everytime a file is downloaded
   * xdccJS.on('downloaded', (fileInfo) => {
   *   console.log(fileInfo.filePath) //=> "/home/user/downloads/myfile.pdf"
   * })
   *
   * // everytime a job's done.
   * xdccJS.on('done', (job) => {
   *  console.log(job.show())
   * })
   *
   * ```
   */
  public download(target: string, packets: string | string[] | number | number[]): Job {
    const range = TypeChecker.parsePackets(packets)
    let candidate = this.__getCandidate(target)
    if (!candidate) {
      const base: Candidate = {
        nick: target,
        queue: range,
        retry: 0,
        now: 0,
        failures: [],
        success: [],
      }
      const newCand = new Job(base)
      this.candidates.push(newCand)
      candidate = this.__getCandidate(target)
    } else {
      const tmp: Job['queue'] = candidate.queue.concat(range)
      candidate.queue = tmp.sort((a, b) => a - b)
    }
    if (candidate.now === 0) {
      this.emit('request', { target: target, packets: candidate.queue })
    }
    return candidate
  }

  __uint32ToIP(n: number): string {
    const byte1 = n & 255,
      byte2 = (n >> 8) & 255,
      byte3 = (n >> 16) & 255,
      byte4 = (n >> 24) & 255
    return byte4 + '.' + byte3 + '.' + byte2 + '.' + byte1
  }

  __parseCtcp(text: string, nick: string): FileInfo | void {
    const parts = text.match(/(?:[^\s"]+|"[^"]*")+/g)
    if (parts === null) {
      throw new TypeError(`CTCP : received unexpected msg : ${text}`)
    }
    const fileInfo: FileInfo = {
      type: `${parts[0]} ${parts[1]}`,
      file: parts[2].replace(/"/g, ''),
      filePath: this.path ? path.normalize(this.path + '/' + parts[2].replace(/"/g, '')) : 'pipe',
      ip: this.__uint32ToIP(parseInt(parts[3], 10)),
      port: parseInt(parts[4], 10),
      length: parseInt(parts[5], 10),
      token: parseInt(parts[6], 10),
    }
    if (parts[1] === 'SEND') {
      return fileInfo
    }
    if (parts[1] === 'ACCEPT') {
      const resume = this.resumequeue.filter(q => q.nick == nick)
      this.resumequeue = this.resumequeue.filter(q => q.nick !== nick)
      fileInfo.ip = resume[0].ip
      fileInfo.length = resume[0].length
      fileInfo.token = resume[0].token
      return fileInfo
    }
  }

  __setupProgressBar(len: number): ProgressBar {
    return new ProgressBar(
      `\u2937`.padStart(6) + ` ${colors.bold(colors.green('\u2713'))} downloading [:bar] ETA: :eta @ :rate - :percent `,
      {
        complete: '=',
        incomplete: ' ',
        width: 20,
        total: len,
      }
    )
  }
  __getCandidate(target: string): Job {
    return this.candidates.filter(
      candidates => candidates.nick.localeCompare(target, 'en', { sensitivity: 'base' }) === 0
    )[0]
  }

  __removeCurrentFromQueue(candidate: Job): void {
    candidate.queue = candidate.queue.filter(pending => pending.toString() !== candidate.now.toString())
  }

  __redownload(candidate: Job, fileInfo?: FileInfo): void {
    if (candidate.retry < this.retry) {
      this.say(candidate.nick, `xdcc send ${candidate.now}`)
      candidate.retry++
      ePrint(`%info% retrying: ${candidate.retry}/${this.retry}`, 6)
    } else {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      clearInterval(candidate.timeout!)
      const pad = this.retry > 0 ? 7 : 6
      ePrint(`%danger% skipped pack: ${candidate.now}`, pad)
      candidate.emit('error', `skipped pack: ${candidate.now}`, fileInfo)
      this.emit('error', `skipped pack: ${candidate.now}`, fileInfo)
      candidate.failures.push(candidate.now)
      this.__removeCurrentFromQueue(candidate)
      this.emit('next', candidate)
    }
  }
  /**
   * @description Returns an array with all jobs currently running
   * @see {@link Job} documentation
   * @example
   * ```js
   * console.log(xdccJS.jobs())
   * // CONSOLE OUTPUT
   * //=>
   * [
   *  {
   *    nick: 'bot',
   *    queue: [ 5, 9, 21 ], // packs in queue
   *    now: 4, // pack currently downloading
   *    failures: [ 1, 2 ], // failed packs
   *    success: [ 'document.pdf', 'audio.wav', 'video.mp4' ] // successfully downloaded files
   *  },
   *  {
   *    nick: 'another-bot',
   *    queue: [ 3 ],
   *    now: 2,
   *    failures: [ ],
   *    success: [ ]
   *  }
   * ]
   * ```
   */
  public jobs(botname?: string): Job[] | Job {
    if (botname) {
      return this.__getCandidate(botname)
    } else {
      return this.candidates
    }
  }
  /**
   * Event triggered when xdccJS is connected to IRC (and has joined channels, if any)
   * @event ready
   * @example
   * ```js
   * xdccJS.on('ready', () => {
   *  xdccJS.download('XDCC|BOT', 23)
   * })
   * ```
   */
  static EVENT_READY: () => void
  /**
   * @description	Event triggered when a file starts downloading
   * @remark only works with {@link Params.path} = false`
   * @remark events are accessible from {@link Job} or globally
   * @event pipe
   * @example
   * ```js
   * // example with 'params.path' defined as a path
   * xdccJS.once('pipe', (stream) => {
   *   stream.pipe(somewhere)
   * })
   * ```
   * @example
   * ```js
   * // how to use pipes
   * // example with express
   * const params = {
   *    host: 'irc.server.net',
   *    path: false // important!
   * }
   *
   * const xdccJS = new XDCC(params)
   *
   * xdccJS.on('ready', () => {
   * 	app.listen(3000)
   * 	app.get('/download', (req, res) => {
   * 		// start a download eg: http://hostname:3000/download?bot=XDCCBOT&pack=32
   *		const Job = xdccJS.download(req.query.bot, req.query.pack)
   *		Job.on('pipe', (stream, fileInfo) => {
   * 		// set the filename and avoid browser directly playing the file.
   *     	res.set('Content-Disposition', `attachment;filename=${fileInfo.file}`)
   * 		// set the size so browsers know completion%
   *     	res.set('Content-Length', fileInfo.length)
   *     	res.set('Content-Type', 'application/octet-stream')
   *      stream.on('end', () => {
   *        res.end()
   *      })
   *      stream.pipe(res)
   * 	})
   * })
   * ```
   */
  static EVENT_DATA: (f?: FileInfo | Buffer, r?: received) => void
  /**
   * @description Event triggered when a download/connection error happens
   * @remark This event doesn't skip retries
   * @remark `fileInfo` and `received` aren't provided in case of an IRC error
   * @remark events are accessible from {@link Job} or globally
   * @event error
   * @example
   * ```js
   * xdccJS.on('error', (error, fileInfo) => {
   *   console.log(`failed to download ${fileInfo.file}`)
   *   console.error(error)
   * })
   *
   *
   * // console output:
   * //=> failed to download myfile.mp4
   * //=> timeout: no response from BOT-NICKNAME
   * ```
   */
  static EVENT_ERR: (error: Error, fileInfo: FileInfo) => void
  /**
   * @description Event triggered when their is no more `Job` (all download are completed)
   * @event can-quit
   * @example
   * ```js
   * xdccJS.on('can-quit', () => {
   *    xdccJS.quit()
   * })
   * ```
   */
  static EVENT_QUIT: () => void
  /**
   * @description Event triggered when a file is downloaded
   * @event downloaded
   * @remark events are accessible from {@link Job} or globally
   * @example
   * ```js
   * xdccJS.on('downloaded', (fileInfo) => {
   *   console.log(`Download completed: ${fileInfo.filePath}`)
   * })
   * Job2.on('downloaded', (fileInfo) => {
   *  console.log(`Job2 completed: ${fileInfo.filePath}`)
   * })
   * ```
   */
  static EVENT_DOWNLOADED: (f: FileInfo) => void
  /**
   * @description Event triggered when a `Job` is done.
   * @remark events are accessible from {@link Job} or globally
   * @event done
   * @example global event
   * ```js
   * xdccJS.on('ready', () => {
   *  xdccJS.download('XDCC|BLUE', '23-25, 102, 300')
   *  xdccJS.download('XDCC|RED', 1152)
   * })
   *
   * xdccJS.on('done', (job) => {
   *    console.log(job.show())
   *    console.log('-----')
   * })
   *
   *
   * // console output:
   * {
   *   nick: 'XDCC|BLUE',
   *   success: [ 'file.pdf', 'video.mp4', 'audio.wav' ],
   *   failures: [ 24, 300 ]
   * }
   * -----
   * {
   *   nick: 'XDCC|RED',
   *   success: [ 'file.txt' ],
   *   failures: [ ]
   * }
   * -----
   * ```
   * @example {@link Job} event
   * ```js
   * xdccJS.on('ready', () => {
   *  const Job1 = xdccJS.download('XDCC|BLUE', '23-25, 102, 300')
   *  const Job2 = xdccJS.download('XDCC|RED', 1152)
   * })
   *
   * Job1.on('done', (job) => {
   *  console.log('Job1 is done')
   *  console.log(job)
   * })
   *
   * Job2.on('done', (job) => {
   *  console.log('Job2 is done')
   *  console.log(job)
   * })
   *
   * // console output:
   * Job1 is done
   * {
   *   nick: 'XDCC|BLUE',
   *   success: [ 'file.pdf', 'video.mp4', 'audio.wav' ],
   *   failures: [ 24, 300 ]
   * }
   * Job2 is done
   * {
   *   nick: 'XDCC|RED',
   *   success: [ 'file.txt' ],
   *   failures: [ ]
   * }
   */
  static EVENT_DONE: (cb: (job: Job) => void) => Job
}

/**
 * Accumulated lenght of data received*
 * @asMemberOf XDCC
 */
declare type received = number

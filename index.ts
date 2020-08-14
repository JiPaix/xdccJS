/* eslint-disable @typescript-eslint/member-delimiter-style */
/* eslint-disable @typescript-eslint/no-this-alias */
/* eslint-disable @typescript-eslint/triple-slash-reference */
/// <reference path="@types/irc-framework.ts"/>
import { Client } from 'irc-framework'
import { Candidate } from './@types/candidate'
import { Params } from './@types/params'
import { FileInfo } from './@types/fileinfo'
import { Job } from './@types/job'
import { PassThrough } from 'stream'
import * as fs from 'fs'
import * as path from 'path'
import * as net from 'net'
import * as ProgressBar from './lib/progress'
import * as colors from 'colors/safe'
import * as ip from 'public-ip'

/**
 * XDCC
 * @noInheritDoc
 */
export default class XDCC extends Client {
  private host!: string
  private port = 6667
  private retry = 1
  private nick = 'xdccJS'
  private chan: string[] = []
  private resumequeue: {
    nick: string
    ip: string
    length: number
    token: number
  }[] = []
  private candidates: Job[] = []
  private connectionTimeout: NodeJS.Timeout
  private path: false | string = false
  private verbose!: boolean
  private passivePort: number[] = [5001]
  private portInUse: number[] = []
  private ip!: number

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
    this.__ParametersCheck(parameters)
    this.path = this.__pathCheck(parameters.path)
    this.chan = this.__chanCheck(parameters.chan)
    this.connectionTimeout = setTimeout(() => {
      console.error(
        colors.bold(colors.red('\u0058')),
        `couldn't connect to: ${colors.bold(colors.yellow(parameters.host))}`
      )
    }, 1000 * 10)
    this.connect({
      host: this.host,
      port: this.port,
      nick: this.nick,
      encoding: 'utf8',
    })
    this.__live()
  }

  private __pathCheck(fpath?: string | false): string | false {
    if (typeof fpath === 'string') {
      const tmp = path.normalize(fpath)
      if (path.isAbsolute(tmp)) {
        this.__mkdir(tmp)
        return tmp
      } else {
        this.__mkdir(path.join(path.resolve('./'), fpath))
        return path.join(path.resolve('./'), fpath)
      }
    } else {
      return false
    }
  }
  private __chanCheck(chan?: string | string[]): string[] {
    if (typeof chan === 'string') {
      return [this.__checkHashtag(chan, true)]
    } else if (Array.isArray(chan)) {
      return chan
    } else if (!chan) {
      return []
    } else {
      const err = new TypeError()
      err.name = err.name + ' [ERR_INVALID_ARG_TYPE]'
      err.message = `unexpected type of 'chan': 'string[] | undefined' was expected'`
      throw err
    }
  }

  private __mkdir(path: string): void {
    if (!fs.existsSync(path)) {
      fs.mkdirSync(path, {
        recursive: true,
      })
    }
  }

  private __ParametersCheck(params: Params, recheck?: boolean): void {
    this.verbose = this._is('verbose', params.verbose, 'boolean', false)
    this.host = this._is('host', params.host, 'string')
    this.port = this._is('port', params.port, 'number', 6667)
    if (!recheck) {
      this.retry = this._is('retry', params.retry, 'number', 1)
      if (this._is('randomizeNick', params.randomizeNick, 'boolean', true)) {
        this.nick = this.__nickRandomizer(params.nick ? params.nick : 'xdccJS')
      } else {
        this.nick = params.nick ? params.nick : this.__nickRandomizer('xdccJS')
      }
      this.passivePort = this._is('passivePort', params.passivePort, 'object', [5001])
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _is(name: string, variable: any, type: string, def?: any): any {
    if (typeof variable !== type) {
      if (typeof def === 'undefined') {
        const err = new TypeError()
        err.name = err.name + ' [ERR_INVALID_ARG_TYPE]'
        err.message = `unexpected type of '${name}': a ${type} was expected but got '${typeof variable}'`
        throw err
      } else {
        return def
      }
    } else {
      return variable
    }
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
  public reconnect(info?: { host: string; port?: number; chan?: string | string[] }): void {
    this.quit()
    this.connectionTimeout = setTimeout(() => {
      if (info) {
        this.__ParametersCheck(info)
      }
      if (!this.connected) {
        this.connect({
          host: this.host,
          port: this.port,
          nick: this.nick,
          encoding: 'utf8',
        })
      }
    }, 2000)
  }
  private __live(): void {
    this.on('connected', () => {
      clearTimeout(this.connectionTimeout)
      this.chan = this.chan.map(c => this.__checkHashtag(c, true))
      for (let index = 0; index < this.chan.length; index++) {
        const channel = this.channel(this.__checkHashtag(this.chan[index], true))
        channel.join()
      }
      if (this.verbose) {
        console.error(colors.bold(colors.green(`\u2713`)), `connected to: ${colors.yellow(this.host)}`)
      }
      this.__verb(2, 'green', `joined: [ ${colors.yellow(this.chan.join(`${colors.white(', ')}`))} ]`)
      this.emit('ready')
    })
    this.on('request', (args: { target: string; packets: number[] }) => {
      const candidate = this.__getCandidate(args.target)
      candidate.now = args.packets[0]
      candidate.queue = candidate.queue.filter(pending => pending.toString() !== candidate.now.toString())
      this.say(args.target, `xdcc send ${candidate.now}`)
      candidate.timeout = this.__setupTimeout(
        [true, args.target],
        {
          eventname: 'error',
          message: `timeout: no response from ${colors.yellow(args.target)}`,
          padding: 6,
          candidateEvent: candidate,
        },
        1000 * 15,
        () => {
          this.__redownload(candidate)
        }
      )
      this.__verb(
        4,
        'green',
        `sending command: /MSG ${colors.yellow(args.target)} xdcc send ${colors.yellow(candidate.now.toString())}`
      )
    })
    this.on('ctcp request', (resp: { [prop: string]: string }): void => {
      this.__checkBeforeDL(resp, this.candidates[0])
    })
    this.on('next', (candidate: Job) => {
      candidate.timeout ? clearTimeout(candidate.timeout) : false
      candidate.retry = 0
      candidate.queue = candidate.queue.filter(pending => pending.toString() !== candidate.now.toString())
      if (candidate.queue.length) {
        candidate.now = candidate.queue[0]
        candidate.queue = candidate.queue.filter(pending => pending.toString() !== candidate.now.toString())
        this.say(candidate.nick, `xdcc send ${candidate.now}`)
        candidate.timeout = this.__setupTimeout(
          [true, candidate.nick],
          {
            eventname: 'error',
            message: `timeout: no response from ${colors.yellow(candidate.now.toString())}`,
            padding: 6,
            candidateEvent: candidate,
          },
          1000 * 15,
          () => {
            this.__redownload(candidate)
          }
        )
        this.__verb(
          4,
          'green',
          `sending command: /MSG ${colors.yellow(candidate.nick)} xdcc send ${colors.yellow(candidate.now.toString())}`
        )
      } else {
        this.candidates = this.candidates.filter(c => c.nick !== candidate.nick)
        candidate.emit('done', candidate.show())
        this.emit('done', () => candidate.show())
        if (!this.candidates.length) {
          this.emit('can-quit')
        } else {
          const newcandidate = this.candidates[0]
          this.emit('request', { target: newcandidate.nick, packets: newcandidate.queue })
        }
      }
    })
  }

  private __checkBeforeDL(resp: { [prop: string]: string }, candidate: Job): void {
    let isNotResume = true
    const fileInfo = this.__parseCtcp(resp.message, resp.nick)
    let stream: fs.WriteStream | PassThrough | undefined = undefined
    if (fileInfo) {
      candidate.timeout ? clearTimeout(candidate.timeout) : false
      candidate.timeout = this.__setupTimeout(
        [true, resp.nick],
        {
          eventname: 'error',
          message: `couldn't connect to: ${colors.yellow(`${fileInfo.ip}:${fileInfo.port}`)}`,
          padding: 6,
          candidateEvent: candidate,
        },
        1000 * 10,
        () => {
          this.__redownload(candidate, fileInfo)
        }
      )
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
            candidate.timeout = this.__setupTimeout(
              [true, resp.nick],
              {
                eventname: 'error',
                message: `couldn't resume download of ${colors.yellow(fileInfo.file)}`,
                padding: 6,
                candidateEvent: candidate,
              },
              1000 * 10,
              () => {
                this.__redownload(candidate, fileInfo)
              }
            )
          } else {
            candidate.timeout ? clearTimeout(candidate.timeout) : false
            stream = fs.createWriteStream(fileInfo.filePath)
          }
        }
      }
      if (stream && isNotResume) {
        this.__prepareDL(stream, fileInfo, candidate, resp)
      }
    }
  }

  private __prepareDL(
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
          candidate.timeout ? clearTimeout(candidate.timeout) : false
          candidate.timeout = this.__setupTimeout(
            [true, resp.nick],
            {
              eventname: 'error',
              message: `timeout: no initial connection`,
              padding: 6,
              fileInfo: fileInfo,
              candidateEvent: candidate,
            },
            1000 * 10,
            () => {
              if (server) {
                server.close(() => {
                  this.portInUse = this.portInUse.filter(p => p !== pick)
                  this.__redownload(candidate, fileInfo)
                })
              }
            }
          )
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
            this.__verb(
              6,
              'cyan',
              `waiting for connexion at: ${colors.yellow(`${this.__uint32ToIP(this.ip)}:${pick}`)}`
            )
          }
        })
      } else {
        candidate.timeout ? clearTimeout(candidate.timeout) : false
        candidate.timeout = this.__setupTimeout(
          [true, resp.nick],
          {
            eventname: 'error',
            message: `all passive ports are currently used: ${colors.yellow(`${fileInfo.ip}:${fileInfo.port}`)}`,
            fileInfo: fileInfo,
            padding: 4,
            candidateEvent: candidate,
          },
          0,
          () => {
            this.__redownload(candidate, fileInfo)
          }
        )
      }
    } else {
      client = net.connect(fileInfo.port, fileInfo.ip)
      this.__processDL(server, client, stream, candidate, fileInfo, pick)
    }
  }
  private __processDL(
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
        candidate.timeout = this.__setupTimeout(
          [true, candidate.nick],
          {
            eventname: 'error',
            message: `timeout: not receiving data`,
            padding: 6,
            fileInfo: fileInfo,
            bar: bar,
            candidateEvent: candidate,
          },
          1000 * 2,
          () => {
            client.end()
            stream.end()
            if (server) {
              server.close(() => {
                this.portInUse = this.portInUse.filter(p => p !== pick)
              })
            }
            this.__redownload(candidate, fileInfo)
          }
        )
      }
    })
    client.on('end', () => {
      candidate.timeout ? clearTimeout(candidate.timeout) : false
      this.__verb(8, 'green', `done: \x1b[36m${fileInfo.file}\x1b[0m`)
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
          ? `Job cancelled: ${colors.cyan(candidate.nick)}`
          : `connection error: ${colors.bold(colors.red(e.message))}`
      const event = e.message === 'cancel' ? 'cancel' : 'error'
      candidate.timeout = this.__setupTimeout(
        [true, candidate.nick],
        {
          eventname: event,
          message: msg,
          bar: bar,
          padding: 6,
          fileInfo: fileInfo,
          candidateEvent: candidate,
        },
        0,
        () => {
          if (server) {
            server.close(() => {
              this.portInUse = this.portInUse.filter(p => p !== pick)
            })
          }
          stream.end()
          client.end()
          if (e.message === 'cancel') {
            candidate.timeout ? clearTimeout(candidate.timeout) : false
            candidate.failures.push(candidate.now)
            candidate.queue = []
            if (fs.existsSync(fileInfo.filePath)) {
              fs.unlinkSync(fileInfo.filePath)
            }
            this.emit('next', candidate)
          } else {
            this.__redownload(candidate, fileInfo)
          }
        }
      )
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
    let range = []
    if (typeof packets === 'string') {
      const packet = packets.replace(/#/gi, '').split(',')
      for (const s of packet) {
        const minmax = s.split('-')
        if (s.includes('-')) {
          for (let i = +minmax[0]; i <= +minmax[1]; i++) {
            range.push(i)
          }
        } else {
          range.push(parseInt(s))
        }
      }
    } else if (Array.isArray(packets)) {
      for (let pack of packets) {
        if (typeof pack === 'number') {
          range.push(pack)
        } else if (typeof pack === 'string') {
          pack = pack.replace(/#/gi, '')
          range.push(parseInt(pack))
        }
      }
    } else if (typeof packets === 'number') {
      range.push(packets)
    }
    range = range
      .sort((a, b) => a - b)
      .filter((item, pos, ary) => {
        return !pos || item != ary[pos - 1]
      })
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

  private __nickRandomizer(nick: string): string {
    if (nick.length > 6) {
      nick = nick.substr(0, 6)
    }
    return nick + Math.floor(Math.random() * 999) + 1
  }

  private __checkHashtag(value: string | number, isChannel: boolean): string {
    if (isChannel) {
      if (typeof value === 'string') {
        if (value.charAt(0) === '#') {
          return value
        } else {
          return `#${value}`
        }
      } else if (typeof value === 'number') {
        return `#${value.toString()}`
      } else {
        throw TypeError(`unexpected type of 'chan': a string|number was expected but got '${typeof value}'`)
      }
    } else {
      if (typeof value === 'number') {
        if (value % 1 === 0) {
          return `#${value.toString()}`
        } else {
          throw TypeError(`unexpected 'package': number must be an integer'`)
        }
      } else if (typeof value === 'string') {
        const isPack = RegExp(/^\d+-\d+$|^#\d+-\d+$|^\d+$|^#\d+$/gm).test(value)
        if (isPack) {
          return value
        } else {
          throw new TypeError(`unexpected 'package': string must be '100' or '#100' or '100-102' or '#102-102'`)
        }
      } else {
        throw new TypeError(`unexpected type of 'package': a string|number was expected but got ${typeof value}`)
      }
    }
  }

  private __uint32ToIP(n: number): string {
    const byte1 = n & 255,
      byte2 = (n >> 8) & 255,
      byte3 = (n >> 16) & 255,
      byte4 = (n >> 24) & 255
    return byte4 + '.' + byte3 + '.' + byte2 + '.' + byte1
  }

  private __parseCtcp(text: string, nick: string): FileInfo | void {
    const parts = text.match(/(?:[^\s"]+|"[^"]*")+/g)
    if (parts === null) {
      throw new TypeError(`CTCP : received unexpected msg : ${text}`)
    }
    if (parts[1] === 'SEND') {
      return {
        type: `${parts[0]} ${parts[1]}`,
        file: parts[2].replace(/"/g, ''),
        filePath: this.path ? path.normalize(this.path + '/' + parts[2].replace(/"/g, '')) : 'pipe',
        ip: this.__uint32ToIP(parseInt(parts[3], 10)),
        port: parseInt(parts[4], 10),
        length: parseInt(parts[5], 10),
        token: parseInt(parts[6], 10),
      }
    } else if (parts[1] === 'ACCEPT') {
      const resume = this.resumequeue.filter(q => q.nick == nick)
      this.resumequeue = this.resumequeue.filter(q => q.nick !== nick)
      return {
        type: `${parts[0]} ${parts[1]}`,
        file: parts[2].replace(/"/g, ''),
        filePath: path.normalize(this.path + '/' + parts[2].replace(/"/g, '')),
        ip: resume[0].ip,
        port: parseInt(parts[3], 10),
        length: resume[0].length,
        position: parseInt(parts[4], 10),
        token: resume[0].token,
      }
    }
  }
  private __setupTimeout(
    xdccCancel: [boolean, string],
    errorInfo: {
      eventname: string
      message: string
      padding: number
      fileInfo?: FileInfo
      bar?: ProgressBar
      candidateEvent: Job
    },
    timeout: number,
    /* eslint-disable @typescript-eslint/ban-types */
    exec?: Function
  ): NodeJS.Timeout {
    return setTimeout(() => {
      if (xdccCancel[0]) {
        this.say(xdccCancel[1], 'XDCC CANCEL')
      }
      const error = new Error(errorInfo.message)
      this.emit(errorInfo.eventname, error, errorInfo.fileInfo)
      if (this.verbose) {
        const msg = `\u2937 `.padStart(errorInfo.padding) + colors.bold(colors.red('\u0058 ')) + errorInfo.message
        if (errorInfo.bar) {
          errorInfo.bar.interrupt(msg, false)
        } else {
          console.error(msg)
        }
      }
      if (exec) {
        exec()
      }
    }, timeout)
  }
  private __setupProgressBar(len: number): ProgressBar {
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
  private __getCandidate(target: string): Job {
    return this.candidates.filter(
      candidates => candidates.nick.localeCompare(target, 'en', { sensitivity: 'base' }) === 0
    )[0]
  }
  private __verb(pad: number, color: 'red' | 'cyan' | 'green', message: string): void {
    if (this.verbose) {
      let sign
      if (color === 'red') {
        sign = '\u0058'
      } else if (color === 'cyan') {
        sign = '\u2139'
      } else if (color === 'green') {
        pad--
        sign = '\u2713'
      } else {
        throw new Error()
      }
      console.error(`\u2937`.padStart(pad), colors.bold(colors[color](sign)), message)
    }
  }
  private __redownload(candidate: Job, fileInfo?: FileInfo): void {
    if (candidate.retry < this.retry) {
      candidate.retry++
      this.say(candidate.nick, `xdcc send ${candidate.now}`)
      this.__verb(6, 'cyan', `retrying: ${candidate.retry}/${this.retry}`)
      candidate.timeout = setInterval(() => {
        if (candidate.retry < this.retry) {
          this.say(candidate.nick, `xdcc send ${candidate.now}`)
          candidate.retry++
          this.__verb(6, 'cyan', `retrying: ${candidate.retry}/${this.retry}`)
        } else {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          clearInterval(candidate.timeout!)
          const pad = this.retry > 0 ? 7 : 6
          this.__verb(pad, 'red', `skipped pack: ${candidate.now}`)
          candidate.emit('error', `skipped pack: ${candidate.now}`, fileInfo)
          this.emit('error', `skipped pack: ${candidate.now}`, fileInfo)
          candidate.failures.push(candidate.now)
          candidate.queue = candidate.queue.filter(pending => pending.toString() !== candidate.now.toString())
          this.emit('next', candidate)
        }
      }, 1000 * 15)
    } else {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      clearInterval(candidate.timeout!)
      const pad = this.retry > 0 ? 7 : 6
      this.__verb(pad, 'red', `skipped pack: ${candidate.now}`)
      candidate.emit('error', `skipped pack: ${candidate.now}`, fileInfo)
      this.emit('error', `skipped pack: ${candidate.now}`, fileInfo)
      candidate.failures.push(candidate.now)
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

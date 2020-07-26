/* eslint-disable @typescript-eslint/member-delimiter-style */
/* eslint-disable @typescript-eslint/no-this-alias */
/* eslint-disable @typescript-eslint/triple-slash-reference */
/// <reference path="@types/irc-framework.ts"/>
import { Client } from 'irc-framework'
import * as fs from 'fs'
import * as path from 'path'
import * as net from 'net'
import * as ProgressBar from 'progress'
import * as colors from 'colors/safe'
import * as ip from 'public-ip'
/**
 * XDCC
 * @noInheritDoc
 */
export default class XDCC extends Client {
  private host: string
  private port?: number = 6667
  private canQuit = false
  private retry: number
  private nick: string
  private chan: string[]
  private resumequeue: {
    nick: string
    ip: string
    length: number
    token: number
  }[] = []
  private retryCandidates: Candidate[] = []
  private connectionTimeout: NodeJS.Timeout
  private path: false | string = false
  private verbose: boolean
  private passivePort: number[] = [5001]
  private portInUse: number[] = []
  private ip!: number

  /**
   * @description Initiate IRC connection, see {@link Params} for a complete description of all parameters
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
    this.host = this._is('host', parameters.host, 'string')
    this.port = this._is('port', parameters.port, 'number', 6667)
    if (this._is('randomizeNick', parameters.randomizeNick, 'boolean', true)) {
      this.nick = this.nickRandomizer(parameters.nick ? parameters.nick : 'xdccJS')
    } else {
      this.nick = parameters.nick ? parameters.nick : this.nickRandomizer('xdccJS')
    }
    this.verbose = this._is('verbose', parameters.verbose, 'boolean', false)
    parameters.passivePort = this._is('passivePort', parameters.passivePort, 'object', [5001])
    if (typeof parameters.path === 'string') {
      this.path = path.normalize(parameters.path)
      if (!path.isAbsolute(this.path)) {
        this.path = path.join(path.resolve('./'), parameters.path)
      }
      if (!fs.existsSync(this.path)) {
        fs.mkdirSync(this.path, {
          recursive: true,
        })
      }
    } else {
      this.path = false
    }
    if (typeof parameters.chan === 'string') {
      this.chan = [this.checkHashtag(parameters.chan, true)]
    } else if (Array.isArray(parameters.chan)) {
      this.chan = parameters.chan
    } else if (!parameters.chan) {
      this.chan = []
    } else {
      const err = new TypeError()
      err.name = err.name + ' [ERR_INVALID_ARG_TYPE]'
      err.message = `unexpected type of 'chan': 'string[] | undefined' was expected'`
      throw err
    }
    this.retry = this._is('retry', parameters.retry, 'number', 1)
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
    this.live()
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
        this.host = this._is('host', info.host, 'string')
        this.port = this._is('port', info.port, 'number', 6667)
        if (typeof info.chan === 'string') {
          this.chan = [this.checkHashtag(info.chan, true)]
        } else if (Array.isArray(info.chan)) {
          this.chan = info.chan
        } else if (!info.chan) {
          this.chan = []
        } else {
          const err = new TypeError()
          err.name = err.name + ' [ERR_INVALID_ARG_TYPE]'
          err.message = `unexpected type of 'chan': 'string[] | undefined' was expected'`
          throw err
        }
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
  private live(): void {
    const self = this
    this.on('connected', () => {
      clearTimeout(this.connectionTimeout)
      this.chan = this.chan.map(c => (c = this.checkHashtag(c, true)))
      for (let index = 0; index < this.chan.length; index++) {
        const channel = this.channel(this.checkHashtag(this.chan[index], true))
        channel.join()
      }
      console.error(colors.bold(colors.green(`\u2713`)), `connected to: ${colors.yellow(this.host)}`)
      this.verb(2, 'green', `joined: [ ${colors.yellow(this.chan.join(`${colors.white(', ')}`))} ]`)

      self.emit('ready')
    })
    this.on('request', (args: { target: string; packets: number[] }) => {
      let i = 0
      const candidate = this.getCandidate(args.target)
      candidate.now = args.packets[i]
      this.say(args.target, `xdcc send ${args.packets[i]}`)
      candidate.timeout = this.setupTimeout(
        [true, args.target],
        {
          eventname: 'error',
          message: `timeout: no response from ${colors.yellow(args.target)}`,
          padding: 6,
        },
        1000 * 15,
        () => {
          this.redownload(candidate)
        }
      )
      this.verb(
        4,
        'green',
        `sending command: /MSG ${colors.yellow(args.target)} xdcc send ${colors.yellow(args.packets[i].toString())}`
      )
      i++
      this.on('next', () => {
        candidate.retry = 0
        if (i < args.packets.length) {
          candidate.pack = candidate.pack.filter(pending => pending !== candidate.now)
          candidate.now = args.packets[i]
          this.say(args.target, `xdcc send ${args.packets[i]}`)
          candidate.timeout = this.setupTimeout(
            [true, args.target],
            {
              eventname: 'error',
              message: `timeout: no response from ${colors.yellow(args.target)}`,
              padding: 6,
            },
            1000 * 15,
            () => {
              this.redownload(candidate)
            }
          )
          this.verb(
            4,
            'green',
            `sending command: /MSG ${colors.yellow(args.target)} xdcc send ${colors.yellow(args.packets[i].toString())}`
          )
          i++
        } else {
          this.retryCandidates = this.retryCandidates.filter(candidates => candidates.nick !== candidate.nick)
          if (this.retryCandidates.length) {
            this.canQuit = false
          } else {
            this.emit('can-quit')
            this.canQuit = true
          }
          this.emit('done', {
            nick: candidate.nick,
            success: candidate.success,
            failures: candidate.failures,
          })
        }
      })
      this.on('ctcp request', (resp: { [prop: string]: string }): void => {
        if (this.path) {
          this.downloadToFile(resp, candidate)
        } else {
          this.downloadToPipe(resp, candidate)
        }
      })
    })
  }

  private downloadToPipe(resp: { [prop: string]: string }, candidate: Candidate): void {
    const self = this
    const fileInfo = this.parseCtcp(resp.message, resp.nick)
    if (fileInfo) {
      let received = 0
      const sendBuffer = Buffer.alloc(8)
      const available = this.passivePort.filter(port => !this.portInUse.includes(port))
      const pick = available[Math.floor(Math.random() * available.length)]
      const bar = this.setupProgressBar(fileInfo.length)
      candidate.timeout ? clearTimeout(candidate.timeout) : false
      if (fileInfo.port === 0) {
        const server = net.createServer(client => {
          candidate.timeout = this.setupTimeout(
            [true, resp.nick],
            {
              eventname: 'error',
              message: `timeout: no initial connection`,
              padding: 6,
              bar: bar,
              fileInfo: fileInfo,
            },
            1000 * 10,
            () => {
              server.close(() => {
                this.portInUse = this.portInUse.filter(p => p !== pick)
                this.redownload(candidate, fileInfo)
              })
            }
          )
          client.on('data', data => {
            candidate.timeout ? clearTimeout(candidate.timeout) : false
            received += data.length
            sendBuffer.writeBigInt64BE(BigInt(received), 0)
            client.write(sendBuffer)
            self.emit('data', data, received)
            if (this.verbose) {
              bar.tick(data.length)
            }
            candidate.timeout = this.setupTimeout(
              [true, resp.nick],
              {
                eventname: 'error',
                message: `timeout: not receiving data`,
                padding: 6,
                bar: bar,
                fileInfo: fileInfo,
              },
              1000 * 10,
              () => {
                server.close(() => {
                  this.portInUse = this.portInUse.filter(p => p !== pick)
                  this.redownload(candidate, fileInfo)
                })
              }
            )
            if (received === fileInfo.length) {
              client.end()
            }
          })
          client.on('end', () => {
            candidate.timeout ? clearTimeout(candidate.timeout) : false
            server.close(() => {
              this.portInUse = this.portInUse.filter(p => p !== pick)
              this.verb(8, 'green', `done piping: ${colors.cyan(fileInfo.file)}`)
              candidate.success.push(fileInfo.file)
              self.emit('downloaded', fileInfo)
              self.emit('next')
            })
          })
          client.on('error', () => {
            candidate.timeout = this.setupTimeout(
              [true, resp.nick],
              {
                eventname: 'error',
                message: `connection error: ${colors.bold(colors.yellow(resp.nick))} has disconnected`,
                bar: bar,
                padding: 8,
              },
              0,
              () => {
                server.close(() => {
                  this.portInUse = this.portInUse.filter(p => p !== pick)
                  this.redownload(candidate, fileInfo)
                })
              }
            )
          })
        })
        server.on('listening', () => {
          this.raw(
            `PRIVMSG ${resp.nick} ${String.fromCharCode(1)}DCC SEND ${fileInfo.file} ${this.ip} ${pick} ${
              fileInfo.length
            } ${fileInfo.token}${String.fromCharCode(1)}`
          )
        })
        if (pick) {
          this.portInUse.push(pick)
          server.listen(pick, '0.0.0.0')
        } else {
          this.setupTimeout(
            [true, resp.nick],
            {
              eventname: 'error',
              message: `all passive ports are currently used`,
              bar: bar,
              fileInfo: fileInfo,
              padding: 6,
            },
            0,
            () => {
              server.close(() => {
                this.portInUse = this.portInUse.filter(p => p !== pick)
              })
            }
          )
        }
        server.on('error', () => {
          candidate.timeout = this.setupTimeout(
            [true, resp.nick],
            {
              eventname: 'error',
              message: `server error: server has stopped functioning`,
              bar: bar,
              padding: 8,
            },
            0,
            () => {
              server.close(() => {
                this.portInUse = this.portInUse.filter(p => p !== pick)
                this.redownload(candidate, fileInfo)
              })
            }
          )
        })
      } else {
        candidate.timeout = this.setupTimeout(
          [true, resp.nick],
          {
            eventname: 'error',
            message: `timeout: couldn't connect to: ${colors.yellow(`${fileInfo.ip}:${fileInfo.port}`)}`,
            padding: 6,
            fileInfo: fileInfo,
            bar: bar,
          },
          1000 * 10,
          () => {
            this.redownload(candidate, fileInfo)
          }
        )
        const client = net.connect(fileInfo.port, fileInfo.ip)
        client.on('connect', () => {
          candidate.timeout ? clearTimeout(candidate.timeout) : false
          candidate.timeout = this.setupTimeout(
            [true, resp.nick],
            {
              eventname: 'error',
              message: `timeout: not receiving data`,
              padding: 6,
              bar: bar,
            },
            1000 * 2,
            () => {
              this.redownload(candidate, fileInfo)
            }
          )
          this.verb(6, 'green', `opening connection with bot: ${colors.yellow(`${fileInfo.ip}:${fileInfo.port}`)}`)
        })
        client.on('data', data => {
          candidate.timeout ? clearTimeout(candidate.timeout) : false
          received += data.length
          sendBuffer.writeBigInt64BE(BigInt(received), 0)
          client.write(sendBuffer)
          self.emit('data', data, received)
          candidate.timeout = this.setupTimeout(
            [true, resp.nick],
            {
              eventname: 'error',
              message: `timeout: not receiving data`,
              padding: 6,
              bar: bar,
            },
            1000 * 2,
            () => {
              this.redownload(candidate, fileInfo)
            }
          )
          if (this.verbose) {
            bar.tick(data.length)
          }
          if (received === fileInfo.length) {
            client.end()
          }
        })
        client.on('end', () => {
          candidate.timeout ? clearTimeout(candidate.timeout) : false
          this.verb(8, 'green', `done piping: ${colors.cyan(fileInfo.file)}`)
          candidate.success.push(fileInfo.file)
          self.emit('downloaded', fileInfo)
          self.emit('next')
        })
        client.on('error', () => {
          candidate.timeout = this.setupTimeout(
            [true, resp.nick],
            {
              eventname: 'error',
              message: `connection error: ${colors.bold(colors.yellow(resp.nick))} has disconnected`,
              bar: bar,
              padding: 8,
            },
            0,
            () => {
              this.portInUse = this.portInUse.filter(p => p !== pick)
              this.redownload(candidate, fileInfo)
            }
          )
        })
      }
    }
  }

  private downloadToFile(resp: { [prop: string]: string }, candidate: Candidate): void {
    const fileInfo = this.parseCtcp(resp.message, resp.nick)
    if (fileInfo) {
      candidate.timeout ? clearTimeout(candidate.timeout) : false
      candidate.timeout = this.setupTimeout(
        [true, resp.nick],
        {
          eventname: 'error',
          message: `couldn't connect to: ${colors.yellow(`${fileInfo.ip}:${fileInfo.port}`)}`,
          padding: 6,
        },
        1000 * 10,
        () => {
          this.redownload(candidate, fileInfo)
        }
      )
      if (fs.existsSync(fileInfo.filePath)) {
        clearTimeout(candidate.timeout)
        let position = fs.statSync(fileInfo.filePath).size
        if (fileInfo.length === position) {
          position = position - 8192
        }
        if (fileInfo.type === 'DCC SEND') {
          const quotedFilename = /\s/.test(fileInfo.file) ? `"${fileInfo.file}"` : fileInfo.file
          this.ctcpRequest(resp.nick, 'DCC RESUME', quotedFilename, fileInfo.port, position, fileInfo.token)
          this.resumequeue.push({
            nick: resp.nick,
            ip: fileInfo.ip,
            length: fileInfo.length,
            token: fileInfo.token,
          })
          candidate.timeout = this.setupTimeout(
            [true, resp.nick],
            {
              eventname: 'error',
              message: `couldn't resume download of ${colors.yellow(fileInfo.file)}`,
              padding: 6,
            },
            1000 * 10,
            () => {
              this.redownload(candidate, fileInfo)
            }
          )
        } else if (fileInfo.type === 'DCC ACCEPT') {
          this.verb(6, 'cyan', `resuming download of: ${colors.yellow(fileInfo.file)}`)
          fileInfo.position = fileInfo.position ? fileInfo.position : 0
          fileInfo.length = fileInfo.length - fileInfo.position
          const file = fs.createWriteStream(fileInfo.filePath, {
            flags: 'r+',
            start: fileInfo.position,
          })
          file.on('ready', () => {
            if (fileInfo.port === 0) {
              this.passiveToFile(file, fileInfo, candidate, resp.nick)
            } else {
              this.activeToFile(file, fileInfo, candidate, resp.nick)
            }
          })
        }
      } else {
        const file = fs.createWriteStream(fileInfo.filePath)
        file.on('ready', () => {
          this.verb(6, 'cyan', `starting download of: ${colors.yellow(fileInfo.file)}`)
          if (fileInfo.port === 0) {
            this.passiveToFile(file, fileInfo, candidate, resp.nick)
          } else {
            this.activeToFile(file, fileInfo, candidate, resp.nick)
          }
        })
      }
    }
  }

  private activeToFile(file: fs.WriteStream, fileInfo: FileInfo, candidate: Candidate, nick: string): void {
    candidate.timeout ? clearTimeout(candidate.timeout) : false
    const bar = this.setupProgressBar(fileInfo.length)
    const self = this
    let received = 0
    const sendBuffer = Buffer.alloc(8)
    const client = net.connect(fileInfo.port, fileInfo.ip)
    client.on('connect', () => {
      candidate.timeout = this.setupTimeout(
        [true, nick],
        {
          eventname: 'error',
          message: `timeout: connected but not receiving data`,
          padding: 6,
          bar: bar,
          fileInfo: fileInfo,
        },
        1000 * 2,
        () => {
          this.redownload(candidate, fileInfo)
        }
      )
      this.verb(6, 'green', `opening connection with bot: ${colors.yellow(`${fileInfo.ip}:${fileInfo.port}`)}`)
    })
    client.on('data', data => {
      candidate.timeout ? clearTimeout(candidate.timeout) : false
      file.write(data)
      received += data.length
      sendBuffer.writeBigInt64BE(BigInt(received), 0)
      client.write(sendBuffer)
      self.emit('data', fileInfo, received)
      candidate.timeout = this.setupTimeout(
        [true, nick],
        {
          eventname: 'error',
          message: `timeout: not receiving data`,
          padding: 6,
          fileInfo: fileInfo,
          bar: bar,
        },
        1000 * 2,
        () => {
          this.redownload(candidate, fileInfo)
        }
      )
      if (this.verbose) {
        bar.tick(data.length)
      }
      if (received === fileInfo.length) {
        client.end()
      }
    })
    client.on('end', () => {
      file.end()
      candidate.timeout ? clearTimeout(candidate.timeout) : false
      this.verb(8, 'green', `done: \x1b[36m${file.path}\x1b[0m`)
      candidate.success.push(fileInfo.file)
      self.emit('downloaded', fileInfo)
      self.emit('next')
    })
    client.on('error', () => {
      file.end()
      candidate.timeout ? clearTimeout(candidate.timeout) : false
      candidate.timeout = this.setupTimeout(
        [true, nick],
        {
          eventname: 'error',
          message: `connection error: ${colors.bold(colors.yellow(nick))} has disconnected`,
          bar: bar,
          padding: 6,
          fileInfo: fileInfo,
        },
        0,
        () => {
          this.redownload(candidate, fileInfo)
        }
      )
    })
  }

  private passiveToFile(file: fs.WriteStream, fileInfo: FileInfo, candidate: Candidate, nick: string): void {
    candidate.timeout ? clearTimeout(candidate.timeout) : false
    fileInfo.position = fileInfo.position ? fileInfo.position : 0
    const bar = this.setupProgressBar(fileInfo.length - fileInfo.position)
    const self = this
    let received = 0
    const sendBuffer = Buffer.alloc(8)
    const available = this.passivePort.filter(port => !this.portInUse.includes(port))
    const pick = available[Math.floor(Math.random() * available.length)]
    const server = net.createServer(client => {
      client.on('data', data => {
        file.write(data)
        candidate.timeout ? clearTimeout(candidate.timeout) : false
        received += data.length
        sendBuffer.writeBigInt64BE(BigInt(received), 0)
        client.write(sendBuffer)
        self.emit('data', fileInfo, received)
        candidate.timeout = this.setupTimeout(
          [true, nick],
          {
            eventname: 'error',
            message: `timeout: not receiving data`,
            padding: 6,
            fileInfo: fileInfo,
            bar: bar,
          },
          1000 * 2,
          () => {
            server.close(() => {
              this.portInUse = this.portInUse.filter(p => p !== pick)
              this.redownload(candidate, fileInfo)
            })
          }
        )
        if (this.verbose) {
          bar.tick(data.length)
        }
        if (received === fileInfo.length) {
          client.end()
        }
      })
      client.on('end', () => {
        file.end()
        candidate.timeout ? clearTimeout(candidate.timeout) : false
        server.close(() => {
          this.portInUse = this.portInUse.filter(p => p !== pick)
          this.verb(8, 'green', `done: \x1b[36m${file.path}\x1b[0m`)
          candidate.success.push(fileInfo.file)
          self.emit('downloaded', fileInfo)
          self.emit('next')
        })
      })
      client.on('error', () => {
        file.end()
        candidate.timeout ? clearTimeout(candidate.timeout) : false
        candidate.timeout = this.setupTimeout(
          [true, nick],
          {
            eventname: 'error',
            message: `connection error: ${colors.bold(colors.yellow(nick))} has disconnected`,
            padding: 6,
            bar: bar,
            fileInfo: fileInfo,
          },
          0,
          () => {
            server.close(() => {
              this.portInUse = this.portInUse.filter(p => p !== pick)
            })
          }
        )
      })
    })
    if (pick) {
      this.portInUse.push(pick)
      server.listen(pick, '0.0.0.0')
    } else {
      candidate.timeout ? clearTimeout(candidate.timeout) : false
      candidate.timeout = this.setupTimeout(
        [true, nick],
        {
          eventname: 'error',
          message: `all passive ports are currently used: ${colors.yellow(`${fileInfo.ip}:${fileInfo.port}`)}`,
          bar: bar,
          fileInfo: fileInfo,
          padding: 4,
        },
        0
      )
    }
    server.on('listening', () => {
      this.raw(
        `PRIVMSG ${nick} ${String.fromCharCode(1)}DCC SEND ${fileInfo.file} ${this.ip} ${pick} ${fileInfo.length} ${
          fileInfo.token
        }${String.fromCharCode(1)}`
      )

      if (this.verbose) {
        this.verb(6, 'cyan', `waiting for connexion at: ${colors.yellow(`${this.uint32ToIP(this.ip)}:${pick}`)}`)
      }
    })
    server.on('error', () => {
      file.end()
      candidate.timeout ? clearTimeout(candidate.timeout) : false
      candidate.timeout = this.setupTimeout(
        [true, nick],
        {
          eventname: 'error',
          message: `connection error: ${colors.bold(colors.yellow(nick))} has disconnected`,
          padding: 6,
          bar: bar,
          fileInfo: fileInfo,
        },
        0,
        () => {
          server.close(() => {
            this.portInUse = this.portInUse.filter(p => p !== pick)
          })
        }
      )
    })
  }
  /**
   * @description Method used to download a single packet.<br/><br/>
   * @param target Bot's nickname
   * @param packet Packet
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
   *   xdccJS.download('XDCC|Bot', 152)
   * })
   *
   * xdccJS.on('download-err', (err, fileInfo) => {
   *  console.error(err)
   * })
   *
   * xdccJS.on('downloaded', (fileInfo) => {
   *  console.log(fileInfo.filePath) //=> "/home/user/downloads/myfile.pdf"
   * })
   *
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
   *		xdccJS.download(req.query.bot, req.query.pack)
   *		xdccJS.on('pipe-start', (fileInfo) => {
   * 		// set the filename and avoid browser directly playing the file.
   *     	res.set('Content-Disposition', `attachment;filename=${fileInfo.file}`)
   * 		// set the size so browsers know completion%
   *     	res.set('Content-Length', fileInfo.length)
   *     	res.set('Content-Type', 'application/octet-stream')
   * 		xdccJS.on('pipe-data', (data) => {
   * 			res.write(data)
   * 		})
   * 		xdccJS.on('pipe-downloaded', () => {
   * 			res.end()
   * 		})
   * 	})
   * })
   */
  public download(target: string, packets: string | string[] | number | number[]): void {
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
    const candidate = this.getCandidate(target)
    if (!candidate) {
      this.retryCandidates.push({
        nick: target,
        pack: range,
        retry: 0,
        now: 0,
        failures: [],
        success: [],
      })
    }
    this.emit('request', { target: target, packets: range })
  }

  private nickRandomizer(nick: string): string {
    if (nick.length > 6) {
      nick = nick.substr(0, 6)
    }
    return nick + Math.floor(Math.random() * 999) + 1
  }

  private checkHashtag(value: string | number, isChannel: boolean): string {
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

  private uint32ToIP(n: number): string {
    const byte1 = n & 255,
      byte2 = (n >> 8) & 255,
      byte3 = (n >> 16) & 255,
      byte4 = (n >> 24) & 255
    return byte4 + '.' + byte3 + '.' + byte2 + '.' + byte1
  }

  private parseCtcp(text: string, nick: string): FileInfo | void {
    const parts = text.match(/(?:[^\s"]+|"[^"]*")+/g)
    if (parts === null) {
      throw new TypeError(`CTCP : received unexpected msg : ${text}`)
    }
    if (parts[1] === 'SEND') {
      return {
        type: `${parts[0]} ${parts[1]}`,
        file: parts[2].replace(/"/g, ''),
        filePath: this.path ? path.normalize(this.path + '/' + parts[2].replace(/"/g, '')) : 'pipe',
        ip: this.uint32ToIP(parseInt(parts[3], 10)),
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
  private setupTimeout(
    xdccCancel: [boolean, string],
    errorInfo: {
      eventname: string
      message: string
      padding: number
      fileInfo?: FileInfo
      bar?: ProgressBar
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
          errorInfo.bar.interrupt(msg)
        } else {
          console.error(msg)
        }
      }
      if (exec) {
        exec()
      }
    }, timeout)
  }
  private setupProgressBar(len: number): ProgressBar {
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
  private getCandidate(target: string): Candidate {
    return this.retryCandidates.filter(candidates => candidates.nick === target || candidates.ident === target)[0]
  }
  private verb(pad: number, color: 'red' | 'cyan' | 'green', message: string): void {
    if (this.verbose) {
      let sign
      if (color === 'red') {
        sign = '\u0058'
      } else if (color === 'cyan') {
        sign = '\u2139'
      } else if (color === 'green') {
        sign = '\u2713'
      } else {
        throw new Error()
      }
      console.error(`\u2937`.padStart(pad), colors.bold(colors[color](sign)), message)
    }
  }
  private redownload(candidate: Candidate, fileInfo?: FileInfo): void {
    if (candidate.retry < this.retry) {
      candidate.retry++
      this.say(candidate.nick, `xdcc send ${candidate.now}`)
      this.verb(6, 'cyan', `retrying: ${candidate.retry}/${this.retry}`)
      candidate.timeout = setInterval(() => {
        if (candidate.retry < this.retry) {
          this.say(candidate.nick, `xdcc send ${candidate.now}`)
          candidate.retry++
          this.verb(6, 'cyan', `retrying: ${candidate.retry}/${this.retry}`)
        } else {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          clearInterval(candidate.timeout!)
          const pad = this.retry > 0 ? 7 : 6
          this.verb(pad, 'red', `skipped pack: ${candidate.now}`)
          this.emit('error', `skipped pack: ${candidate.now}`, fileInfo)
          candidate.failures.push(candidate.now)
          this.emit('next')
        }
      }, 1000 * 15)
    } else {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      clearInterval(candidate.timeout!)
      const pad = this.retry > 0 ? 7 : 6
      this.verb(pad, 'red', `skipped pack: ${candidate.now}`)
      this.emit('error', `skipped pack: ${candidate.now}`, fileInfo)
      candidate.failures.push(candidate.now)
      this.emit('next')
    }
  }
  /**
   * Event triggered when xdccJS is ready to download
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
   * @description	Event triggered when chunks of data are being received
   * @remark Depending on {@link Params.path} value, returns either a Buffer with the acutal data or a {@link FileInfo}
   * @event data
   * @example {@link Params.path} defined as a path
   * ```js
   * // use .once to avoid spamming console and throttle download speed)
   * xdccJS.once('data', (fileInfo, received) => {
   *   console.log('downloading: ' + fileInfo.file)
   * })
   * ```
   * console output:
   * ```
   * downloading: myfile.mp4
   * ```
   * @example {@link Params.path} set to false or undefined
   * ```js
   * xdccJS.on('data', (data, received) => {
   *   stream.write(data)
   * })
   * ```
   */
  static EVENT_DATA: (f: FileInfo | Buffer, r: received) => void
  /**
   * @description Event triggered when a download fails
   * @remark This event doesn't skip {@link Params.retry}
   * @event error
   * @example
   * ```js
   * xdccJS.on('error', (error, fileInfo) => {
   *   console.log(`failed to download ${fileInfo.file}`)
   *   console.error(error)
   * })
   * ```
   * console output:
   * ```sh
   * failed to download myfile.mp4
   * timeout: no response from BOT-NICKNAME
   * ```
   */
  static EVENT_ERR: (error: Error, fileInfo: FileInfo) => void
  /**
   * @description Event triggered when all downloads are done
   * @event can-quit
   * @example
   * xdccJS.on('can-quit', () => {
   *    xdccJS.quit()
   * })
   */
  static EVENT_QUIT: () => void
  /**
   * @description Event triggered when a download is completed.
   * @event downloaded
   * @example
   * ```js
   * xdccJS.on('downloaded', (fileInfo) => {
   *   console.log(`Download completed: ${fileInfo.filePath}`)
   * })
   * ```
   */
  static EVENT_DOWNLOADED: (f: FileInfo) => void
  /**
   * @description Event triggered when `.download()` has finished
   * @remark
   * @event done
   * @example
   * ```js
   * xdccJS.on('ready', () => {
   *  xdccJS.download('XDCC|BLUE', '23-25, 102, 300')
   *  xdccJS.download('XDCC|RED', 1152)
   * })
   *
   * xdccJS.on('done', (job) => {
   *    console.log(job)
   *    console.log('-----')
   * })
   * ```
   * console output:
   * ```sh
   * {
   *   nick: 'XDCC|RED',
   *   success: [ 'file.txt' ],
   *   failures: [ ]
   * }
   * -----
   * {
   *   nick: 'XDCC|BLUE',
   *   success: [ 'file.pdf', 'video.mp4', 'audio.wav' ],
   *   failures: [ 24, 300 ]
   * }
   * ```
   */
  static EVENT_DONE: (failures: Job) => void
}

/**
 * Parameters for {@link XDCC.constructor}
 * @asMemberOf XDCC
 */
declare interface Params {
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
}

/**
 * File informations
 * @asMemberOf XDCC
 */
declare interface FileInfo {
  /** Type of transfert (send or resume) */
  type: string
  /** Filename */
  file: string
  /** Filename with absolute path, return false if using pipes */
  filePath: string
  /** Transfert IP */
  ip: string
  /** Transfert PORT  */
  port: number
  /** File length in bytes */
  length: number
  /** Token (passive DCC) */
  token: number
  /** Resume Position */
  position?: number
}
/**
 * @description Information after .download() is done
 * @asMemberOf XDCC
 * @example
 * ```sh
 * {
 *    nick: 'xdcc-bot',
 *    success: ['file.pdf', 'video.mp4']
 *    failures: [1, 200]
 * }
 */
declare interface Job {
  /**
   * @description Nick of the xdcc bot
   */
  nick: string
  /**
   * @description Array of filenames
   */
  success: string[]
  /**
   * @description Array of pack numbers
   */
  failures: number[]
}
/**
 * Accumulated lenght of data received*
 * @asMemberOf XDCC
 */
declare type received = number
/**
 * @private
 */
declare interface Candidate {
  nick: string
  pack: number[]
  ident?: string
  passive?: number
  retry: number
  timeout?: NodeJS.Timeout
  now: number
  failures: number[]
  success: string[]
}

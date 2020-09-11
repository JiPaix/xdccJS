import { CtcpParser, ParamsCTCP } from './ctcp_parser'
import { FileInfo } from './interfaces/fileinfo'
import { Job } from './interfaces/job'
import { PassThrough } from 'stream'
import * as net from 'net'
import * as fs from 'fs'
import * as ProgressBar from './lib/progress'
import { v4 } from 'public-ip'
import { Connect } from './connect'

export interface ParamsDL extends ParamsCTCP {
  /**
   * Array of ports for passive DCC
   * @default `5001`
   * @remark Some xdcc bots use passive dcc, this require to have these ports opened on your computer/router/firewall
   * @example
   * ```js
   * params.passivePort = [3213, 3214]
   */
  passivePort?: number[]
}

interface Pass {
  server?: net.Server
  client: net.Socket
  stream: fs.WriteStream | PassThrough
  candidate: Job
  fileInfo: FileInfo
  pick?: number
  bar: ProgressBar
}

export default class Downloader extends CtcpParser {
  passivePort: number[]
  ip: Promise<number>

  constructor(params: ParamsDL) {
    super(params)
    this.ip = this.getIp()
    this.passivePort = this._is('passivePort', params.passivePort, 'object', [5001])
    this.on('prepareDL', (downloadrequest: { fileInfo: FileInfo; candidate: Job }) => {
      this.prepareDL(downloadrequest)
    })
  }

  async getIp(): Promise<number> {
    const string = await v4()
    const d = string.split('.')
    return ((+d[0] * 256 + +d[1]) * 256 + +d[2]) * 256 + +d[3]
  }

  private setupStream(fileInfo: FileInfo): fs.WriteStream | PassThrough {
    if (this.path) {
      if (fileInfo.type === 'DCC ACCEPT') {
        return fs.createWriteStream(fileInfo.filePath, {
          flags: 'r+',
          start: fileInfo.position,
        })
      } else if (fileInfo.type === 'DCC SEND') {
        return fs.createWriteStream(fileInfo.filePath)
      } else {
        throw Error('Error in control flow: setupStream')
      }
    } else {
      return new PassThrough()
    }
  }

  private prepareDL(downloadrequest: { fileInfo: FileInfo; candidate: Job }): void {
    const fileInfo = downloadrequest.fileInfo
    const candidate = downloadrequest.candidate
    const stream = this.setupStream(fileInfo)
    if (fileInfo.port === 0) {
      const pick = this.portPicker()
      const server = net.createServer(client => {
        this.__SetupTimeout({
          candidate: candidate,
          eventType: 'error',
          message: '%danger% Timeout: no initial connnection',
          delay: this.timeout,
          disconnectAfter: {
            stream: stream,
            server: server,
            socket: client,
            pick: pick,
          },
          padding: 6,
          fileInfo: fileInfo,
        })
        this.processDL(server, client, stream, candidate, fileInfo, pick)
      })

      server.listen(pick, '0.0.0.0', () => {
        this.ip.then(ip => {
          this.raw(
            `PRIVMSG ${candidate.nick} ${String.fromCharCode(1)}DCC SEND ${fileInfo.file} ${ip} ${pick} ${
              fileInfo.length
            } ${fileInfo.token}${String.fromCharCode(1)}`
          )
        })
      })
    } else {
      const client = net.connect(fileInfo.port, fileInfo.ip)
      this.processDL(undefined, client, stream, candidate, fileInfo, undefined)
    }
  }

  private portPicker(): number | undefined {
    const available = this.passivePort.filter(ports => !this.portInUse.includes(ports))
    const pick = available[Math.floor(Math.random() * available.length)]
    this.portInUse.push(pick)
    return pick
  }

  private processDL(
    server: net.Server | undefined,
    client: net.Socket,
    stream: fs.WriteStream | PassThrough,
    candidate: Job,
    fileInfo: FileInfo,
    pick: number | undefined
  ): void {
    candidate.cancel = this.makeCancelable(candidate, client)
    this.print(`%info% downloading : %cyan%${fileInfo.file}`, 5)
    const bar = this.setupProgressBar(fileInfo.length)
    const pass: Pass = {
      server: server,
      client: client,
      stream: stream,
      candidate: candidate,
      fileInfo: fileInfo,
      pick: pick,
      bar: bar,
    }
    this.onData(pass)
    this.onEnd(pass)
    this.onError(pass)
  }

  private onError(args: Pass): void {
    args.client.on('error', (e: Error) => {
      this.__SetupTimeout({
        candidate: args.candidate,
        eventType: e.message === 'cancel' ? 'cancel' : 'error',
        message:
          e.message === 'cancel'
            ? 'Job cancelled: %cyan%' + args.candidate.nick
            : 'Connection error: %yellow%' + e.message,
        delay: 0,
        disconnectAfter: {
          stream: args.stream,
          server: args.server,
          socket: args.client,
          pick: args.pick,
          bar: args.bar,
        },
        padding: 6,
        fileInfo: args.fileInfo,
        executeLater: () => {
          if (e.message === 'cancel') {
            args.candidate.failures.push(args.candidate.now)
            args.candidate.queue = []
            if (fs.existsSync(args.fileInfo.filePath)) {
              fs.unlinkSync(args.fileInfo.filePath)
            }
            this.emit('next', args.candidate)
          } else {
            this.redownload(args.candidate, args.fileInfo)
          }
        },
      })
    })
  }

  private onEnd(args: Pass): void {
    args.client.on('end', () => {
      this.print('%success% done.', 6)
      args.candidate.timeout.clear()
      args.candidate.success.push(args.fileInfo.file)
      if (args.server && args.pick) {
        args.server.close(() => {
          this.portInUse = this.portInUse.filter(p => p !== args.pick)
        })
      }
      args.stream.end()
      args.client.end()
      this.emit('downloaded', args.fileInfo)
      args.candidate.emit('downloaded', args.fileInfo)
      this.emit('next', args.candidate)
    })
  }

  private onData(args: Pass): void {
    const sendBuffer = Buffer.alloc(8)
    let received = 0
    args.client.on('data', data => {
      if (received === 0 && !this.path) {
        args.candidate.emit('pipe', args.stream, args.fileInfo)
        this.emit('pipe', args.stream, args.fileInfo)
      }
      args.stream.write(data)
      received += data.length
      sendBuffer.writeBigInt64BE(BigInt(received), 0)
      args.client.write(sendBuffer)
      if (this.verbose && args.bar) {
        args.bar.tick(data.length)
      }
      if (received === args.fileInfo.length) {
        args.client.end()
      } else {
        this.__SetupTimeout({
          candidate: args.candidate,
          eventType: 'error',
          message: '%danger% Timeout: Not receiving data',
          padding: 6,
          disconnectAfter: {
            stream: args.stream,
            socket: args.client,
            server: args.server,
            bar: args.bar,
            pick: args.pick,
          },
          delay: 2,
          fileInfo: args.fileInfo,
        })
      }
    })
  }

  protected setupProgressBar(len: number): ProgressBar {
    return new ProgressBar(`\u2937 `.padStart(6) + Connect.replace('[:bar] ETA: :eta @ :rate - :percent'), {
      complete: '=',
      incomplete: ' ',
      width: 20,
      total: len,
      clear: true,
    })
  }
}

import { CtcpParser, ParamsCTCP } from './ctcp_parser'
import { FileInfo } from './interfaces/fileinfo'
import { Job } from './interfaces/job'
import { PassThrough } from 'stream'
import * as net from 'net'
import * as fs from 'fs'
import * as ProgressBar from '../lib/progress'
import * as colors from 'colors/safe'
import { v4 } from 'public-ip'

export interface ParamsDL extends ParamsCTCP {
  /**
   * @description Array of ports for passive DCC
   * @default `5001`
   * @remark Some xdcc bots use passive dcc, this require to have these ports opened on your computer/router/firewall
   * @example
   * ```js
   * params.passivePort = [3213, 3214]
   */
  passivePort?: number[]
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
        fileInfo.position = fileInfo.position ? fileInfo.position : 0
        fileInfo.length = fileInfo.length - fileInfo.position
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
        this.TOeventType(candidate, 'error')
          .TOeventMessage(candidate, '%danger% Timeout: no initial connnection', 6)
          .TOdisconnectAfter(candidate, stream, client, server, pick)
          .TOstart(candidate, this.timeout, fileInfo)
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
    const bar = this.setupProgressBar(fileInfo.length)
    const sendBuffer = Buffer.alloc(8)
    let received = 0
    client.on('data', data => {
      if (received === 0 && !this.path) {
        candidate.emit('pipe', stream, fileInfo)
        this.emit('pipe', stream, fileInfo)
      }
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
        this.TOeventType(candidate, 'error')
          .TOeventMessage(candidate, '%danger% Timeout: Not receiving data', 6)
          .TOdisconnectAfter(candidate, stream, client, server, pick)
          .TOstart(candidate, 2, fileInfo, bar)
      }
    })
    client.on('end', () => {
      candidate.timeout.clear()
      this.print('%success% done : %cyan%' + fileInfo.file, 8)
      candidate.success.push(fileInfo.file)
      if (server && pick) {
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
      candidate.timeout.clear()
      const msg =
        e.message === 'cancel' ? 'Job cancelled: %cyan%' + candidate.nick : 'Connection error: %yellow%' + e.message
      const event = e.message === 'cancel' ? 'cancel' : 'error'
      this.TOeventType(candidate, event)
        .TOeventMessage(candidate, msg, 6)
        .TOdisconnectAfter(candidate, stream, client, server, pick)
        .TOexecuteLater(candidate, () => {
          if (e.message === 'cancel') {
            candidate.failures.push(candidate.now)
            candidate.queue = []
            if (fs.existsSync(fileInfo.filePath)) {
              fs.unlinkSync(fileInfo.filePath)
            }
            this.emit('next', candidate)
          } else {
            this.redownload(candidate, fileInfo)
          }
        })
        .TOstart(candidate, 0, fileInfo, bar)
    })
  }

  private makeCancelable(candidate: Job, client: net.Socket): () => void {
    const fn = (): void => {
      candidate.timeout.clear()
      const cancel = new Error('cancel')
      client.destroy(cancel)
    }
    return fn
  }
  protected setupProgressBar(len: number): ProgressBar {
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
}

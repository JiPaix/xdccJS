import { CtcpParser, ParamsCTCP } from './ctcp_parser'
import { FileInfo } from './interfaces/fileinfo'
import { Job, displayedJob } from './interfaces/job'
import { PassThrough } from 'stream'
import * as net from 'net'
import * as fs from 'fs'
import * as ProgressBar from '../lib/progress'
import * as colors from 'colors/safe'

export interface Params extends ParamsCTCP {
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

export default class XDCC extends CtcpParser {
  passivePort: number[]

  constructor(params: Params) {
    super(params)
    this.passivePort = this._is('passivePort', params.passivePort, 'object', [5001])
    this.on('prepareDL', (downloadrequest: { fileInfo: FileInfo; candidate: Job }) => {
      this.__prepareDL(downloadrequest)
    })
  }

  private __prepareDL(downloadrequest: { fileInfo: FileInfo; candidate: Job }): void {
    const fileInfo = downloadrequest.fileInfo
    const candidate = downloadrequest.candidate
    let stream: fs.WriteStream | PassThrough | undefined = undefined
    if (this.path) {
      if (fileInfo.type === 'DCC ACCEPT') {
        fileInfo.position = fileInfo.position ? fileInfo.position : 0
        fileInfo.length = fileInfo.length - fileInfo.position
        stream = fs.createWriteStream(fileInfo.filePath, {
          flags: 'r+',
          start: fileInfo.position,
        })
      }
      if (fileInfo.type === 'DCC SEND') {
        stream = fs.createWriteStream(fileInfo.filePath)
      }
    } else {
      stream = new PassThrough()
    }
    if (fileInfo.port === 0) {
      const pick = this.portPicker()
      const server = net.createServer(client => {
        this.TOeventType(candidate, 'error')
          .TOeventMessage(candidate, '%danger% Timeout: no initial connnection', 6)
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          .TOdisconnectAfter(candidate, stream!, client, server, pick)
          .TOstart(candidate, 15, fileInfo)
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        this.__processDL(server, client, stream!, candidate, fileInfo, pick)
      })
    } else {
      const client = net.connect(fileInfo.port, fileInfo.ip)
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      this.__processDL(undefined, client, stream!, candidate, fileInfo, undefined)
    }
  }
  private portPicker(): number | undefined {
    const available = this.passivePort.filter(ports => !this.portInUse.includes(ports))
    const pick = available[Math.floor(Math.random() * available.length)]
    this.portInUse.push(pick)
    return pick
  }
  private __processDL(
    server: net.Server | undefined,
    client: net.Socket,
    stream: fs.WriteStream | PassThrough,
    candidate: Job,
    fileInfo: FileInfo,
    pick: number | undefined
  ): void {
    candidate.cancel = this.__makeCancelable(candidate, client)
    const bar = this.__setupProgressBar(fileInfo.length)
    const sendBuffer = Buffer.alloc(8)
    let received = 0
    client.on('connect', () => {
      if (!this.path) {
        candidate.emit('pipe', stream, fileInfo)
        this.emit('pipe', stream, fileInfo)
      }
    })
    client.on('data', data => {
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
        e.message === 'cancel'
          ? '%danger% Job cancelled: %cyan%' + candidate.nick
          : '%danger% Connection error: %yellow%' + e.message
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
            this.__redownload(candidate, fileInfo)
          }
        })
        .TOstart(candidate, 0, fileInfo, bar)
    })
  }

  private __makeCancelable(candidate: Job, client: net.Socket): () => void {
    const fn = (): void => {
      candidate.timeout.clear()
      const cancel = new Error('cancel')
      client.destroy(cancel)
    }
    return fn
  }
  protected __setupProgressBar(len: number): ProgressBar {
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
  /**
   * Search jobs
   * @param bot Bot Name
   */
  public jobs(bot?: string): displayedJob | displayedJob[] | void {
    if (bot) {
      return this.__getCandidate(bot).show()
    }
    const results = []
    for (const job of this.candidates) {
      results.push(job.show())
    }
    if (results.length) {
      return results
    }
  }
}

import { Connect, ParamsIRC } from './connect'
import { Job } from './interfaces/job'
import { PassThrough } from 'stream'
import * as fs from 'fs'
import * as net from 'net'
import { FileInfo } from './interfaces/fileinfo'

export interface ParamsTimeout extends ParamsIRC {
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

export class TimeOut extends Connect {
  protected portInUse: number[]
  retry: number
  constructor(params: ParamsTimeout) {
    super(params)
    this.portInUse = []
    this.retry = this._is('retry', params.retry, 'number', 1)
  }
  protected TOeventType(candidate: Job, eventType: 'error' | 'cancel'): this {
    candidate.timeout.eventType = eventType
    return this
  }
  protected TOeventMessage(candidate: Job, message: string, padding = 0): this {
    candidate.timeout.message = message
    candidate.timeout.padding = padding
    return this
  }
  protected TOexecuteLater(candidate: Job, fn: () => void, delay = 0): this {
    candidate.timeout.fn = fn
    candidate.timeout.delay = delay
    return this
  }
  /**
   * @ignore
   */
  protected TOdisconnectAfter(
    candidate: Job,
    stream: fs.WriteStream | PassThrough,
    socket: net.Socket,
    server?: net.Server,
    pick?: number | undefined
  ): this {
    candidate.timeout.stream = stream
    candidate.timeout.socket = socket
    candidate.timeout.server = server
    candidate.timeout.pick = pick
    return this
  }

  protected TOendStreams(candidate: Job): this {
    if (candidate.timeout.stream && candidate.timeout.socket) {
      candidate.timeout.stream.end()
      candidate.timeout.socket.end()
    }
    if (candidate.timeout.server && candidate.timeout.pick) {
      const pick = candidate.timeout.pick
      candidate.timeout.server.close(() => (this.portInUse = this.portInUse.filter(p => p !== pick)))
    }
    return this
  }

  protected TOstart(candidate: Job, delay: number, fileInfo?: FileInfo, bar?: ProgressBar): void {
    candidate.timeout.fileInfo = fileInfo
    candidate.timeout.bar = bar
    this.makeClearable(candidate)
    candidate.timeout.clear()
    candidate.timeout.to = setTimeout(() => {
      this.routine(candidate)
      this.TOendStreams(candidate)
      if (candidate.timeout.fn) {
        candidate.timeout.fn()
      } else {
        this.redownload(candidate)
      }
    }, delay * 1000)
  }

  private routine(candidate: Job): void {
    this.say(candidate.nick, 'XDCC CANCEL')
    if (typeof candidate.timeout.eventType === 'undefined') {
      throw Error('no event Type')
    }
    this.emit(candidate.timeout.eventType, new Error(candidate.timeout.message), candidate.timeout.fileInfo)
    candidate.emit(candidate.timeout.eventType, new Error(candidate.timeout.message), candidate.timeout.fileInfo)
    if (this.verbose) {
      const msg = '%danger% ' + candidate.timeout.message
      if (candidate.timeout.bar) {
        candidate.timeout.bar.interrupt(''.padStart(candidate.timeout.padding || 0) + Connect.replace(msg), false)
      } else {
        this.print(msg, candidate.timeout.padding)
      }
    }
  }

  protected removeNowFromQueue(candidate: Job): void {
    candidate.queue = candidate.queue.filter(pending => pending.toString() !== candidate.now.toString())
  }

  protected redownload(candidate: Job, fileInfo?: FileInfo): void {
    if (candidate.retry < this.retry) {
      candidate.retry++
      this.say(candidate.nick, `xdcc send ${candidate.now}`)
      this.print(`%info% retrying: ${candidate.retry}/${this.retry}`, 6)
      candidate.timeout.to = setTimeout(() => {
        this.routine(candidate)
        this.redownload(candidate, fileInfo)
      }, 15 * 1000)
    } else {
      candidate.timeout.clear()
      const pad = candidate.retry + 5
      this.print(`%danger% skipped pack: ${candidate.now}`, pad)
      candidate.emit('error', `skipped pack: ${candidate.now}`, fileInfo)
      this.emit('error', `skipped pack: ${candidate.now}`, fileInfo)
      candidate.failures.push(candidate.now)
      this.emit('next', candidate)
    }
  }

  private makeClearable(candidate: Job): void {
    candidate.timeout.clear = (): void => {
      candidate.timeout.to ? clearTimeout(candidate.timeout.to) : false
    }
  }
}

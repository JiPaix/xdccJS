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
    candidate.timeout.to ? clearTimeout(candidate.timeout.to) : false
    candidate.timeout.to = setTimeout(() => {
      this.routine(candidate)
      this.TOendStreams(candidate)
      if (candidate.timeout.fn) {
        candidate.timeout.fn()
      } else {
        this.__redownload(candidate)
      }
    }, delay * 1000)
  }

  private routine(candidate: Job): void {
    this.say(candidate.nick, 'XDCC CANCEL')
    if (typeof candidate.timeout.eventType === 'undefined') {
      throw Error('no event Type')
    } else {
      this.emit(candidate.timeout.eventType, new Error(candidate.timeout.message), candidate.timeout.fileInfo)
      candidate.emit(candidate.timeout.eventType, new Error(candidate.timeout.message), candidate.timeout.fileInfo)
      if (this.verbose) {
        const msg = '%danger% ' + candidate.timeout.message
        if (candidate.timeout.bar) {
          candidate.timeout.bar.interrupt(msg, false)
        } else {
          this.print(msg, candidate.timeout.padding)
        }
      }
    }
  }

  protected __redownload(candidate: Job, fileInfo?: FileInfo): void {
    if (candidate.retry < this.retry) {
      this.say(candidate.nick, `xdcc send ${candidate.now}`)
      candidate.retry++
      this.print(`%info% retrying: ${candidate.retry}/${this.retry}`, 6)
    } else {
      candidate.timeout.to ? clearTimeout(candidate.timeout.to) : false
      const pad = this.retry > 0 ? 7 : 6
      this.print(`%danger% skipped pack: ${candidate.now}`, pad)
      candidate.emit('error', `skipped pack: ${candidate.now}`, fileInfo)
      this.emit('error', `skipped pack: ${candidate.now}`, fileInfo)
      candidate.failures.push(candidate.now)
      candidate.queue = candidate.queue.filter(pending => pending.toString() !== candidate.now.toString())
      this.emit('next', candidate)
    }
  }
}

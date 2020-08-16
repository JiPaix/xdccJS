import XDCC from '..'
import { Job } from '../interfaces/job'
import { FileInfo } from 'irc-framework'
import ePrint from './printer'
import { PassThrough } from 'stream'
import * as fs from 'fs'
import * as net from 'net'

export default class TimeoutError {
  private timeout: NodeJS.Timeout
  private xdcc: XDCC
  private delay: number | undefined
  private event: string
  private message: string | undefined
  private candidate: Job
  private padding: number | undefined
  private fileInfo: FileInfo | undefined
  private bar: ProgressBar | undefined
  private fn: (() => void) | undefined
  private stream: fs.WriteStream | PassThrough | undefined
  private socket: net.Socket | undefined
  private server: net.Server | undefined
  private pick: number | undefined

  constructor(xdcc: XDCC, candidate: Job, fileInfo?: FileInfo, bar?: ProgressBar) {
    this.timeout = setTimeout(() => undefined, 0)
    this.xdcc = xdcc
    this.candidate = candidate
    this.fileInfo = fileInfo
    this.bar = bar
    this.event = 'error'
  }
  public eventType(eventType: 'error' | 'cancel'): this {
    this.event = eventType
    return this
  }
  public eventMessage(message: string, padding = 0): this {
    this.message = message
    this.padding = padding
    return this
  }

  public executeLater(fn: () => void, delay = 0): this {
    this.fn = fn
    this.delay = delay
    return this
  }
  public disconnectAfter(
    stream: fs.WriteStream | PassThrough,
    socket: net.Socket,
    server?: net.Server,
    pick?: number | undefined
  ): this {
    this.stream = stream
    this.socket = socket
    this.server = server
    this.pick = pick
    return this
  }
  private endStreams(): void {
    if (this.stream && this.socket) {
      this.stream.end()
      this.socket.end()
    }
    if (this.server) {
      this.server.close(() => {
        this.xdcc.portInUse = this.xdcc.portInUse.filter(p => p !== this.pick)
      })
    }
  }
  public start(delay: number): void {
    this.candidate.timeout ? clearTimeout(this.candidate.timeout) : false
    this.candidate.timeout = setTimeout(() => {
      this.routine()
      this.endStreams()
      if (this.fn) {
        this.fn()
      } else {
        this.xdcc.__redownload(this.candidate)
      }
    }, delay * 1000)
  }

  private routine(): void {
    this.xdcc.say(this.candidate.nick, 'XDCC CANCEL')
    this.xdcc.emit(this.event, new Error(this.message), this.fileInfo)
    this.candidate.emit(this.event, new Error(this.message), this.fileInfo)
    if (this.xdcc.verbose) {
      const msg = '%danger% ' + this.message
      if (this.bar) {
        this.bar.interrupt(msg, false)
      } else {
        ePrint(msg, this.padding)
      }
    }
  }
}

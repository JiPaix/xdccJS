/* eslint-disable no-unused-vars */
import { EventEmitter } from 'eventemitter3';
import { clone } from 'lodash';
import { PassThrough } from 'stream';
import * as fs from 'fs';
import * as net from 'net';
import { Candidate } from './candidate';
import ProgressBar from '../lib/progress';
import { FileInfo } from './fileinfo';

  export default class Job extends EventEmitter {
    /**
     * Cancel Job
     * @example
     * ```js
     * xdccJS.on('ready', async () => {
     *  const job1 = xdccJS.download('bot', '20-30')
     *  job1.on('downloaded', info => {
     *    // stop half-way
     *    if(info.success.length === 5) job1.cancel()
     *  })
     * })
     * ```
     */
    cancel?: () => void

    /** @ignore */
    failures: number[]

    /** @ignore */
    nick: string

    /** @ignore */
    now: number

    /** @ignore */
    queue: number[]

    /** @ignore */
    retry: number

    /** @ignore */
    success: string[]

    /** @ignore */
    timeout: {
      bar?: ProgressBar
      fileInfo?: FileInfo
      to?: ReturnType<typeof setTimeout>
      eventType?: string
      message?: string
      padding?: number
      delay?: number
      fn?: () => void
      stream?: fs.WriteStream | PassThrough
      server?: net.Server
      socket?: net.Socket
      pick?: number
      clear: () => void
    }

    constructor(candidate: Candidate) {
      super();
      this.cancel = candidate.cancel;
      this.failures = candidate.failures;
      this.nick = candidate.nick;
      this.now = candidate.now;
      this.queue = candidate.queue;
      this.retry = candidate.retry;
      this.success = candidate.success;
      this.timeout = candidate.timeout;
    }

    /**
     * return current job
     * @example
     * ```js
     * const job = await xdccJS.download('bot', '1-5')
     * console.log(job.show().nick) //=> 'bot'
     * console.log(job.show().queue) //=> [2, 3, 4, 5]
     * console.log(job.show().now) //=> 1
     * // etc...
     *
     * // both achieve same results:
     * job.cancel()
     * job.show().cancel()
     * ```
     */
    public show(): {
      nick: string
      queue: number[]
      now: number
      success: string[]
      failed: number[]
    } {
      const info = {
        nick: clone(this.nick),
        queue: clone(this.queue),
        now: clone(this.now),
        success: clone(this.success),
        failed: clone(this.failures),
        cancel: this.cancel,
      };
      return info;
    }

    /**
     * check if Job is done
     * const job = await xdccJS.download('bot', '1-5')
     * job.isDone() //=> false
     */
    public isDone(): boolean {
      if (this.queue.length) {
        return false;
      }
      return true;
    }

  /**
   * Event triggered when a file is downloaded
   * @category Download
   * @event downloaded
   * @example
   * ```js
   * job.on('downloaded', fileInfo => {
   *    console.log('file available @: ' + fileInfo.filePath)
   * })
   * ```
   */
  static 'downloaded': (info:FileInfo) => Job

  /**
   * Event triggered while a file is downloading
   * @category Download
   * @event downloading
   * @example
   * ```js
   * job.on('downloading', (fileInfo, received, percentage) => {
   *    console.log(`${fileInfo.file} @ ${received} of ${fileInfo.length} [${percentage}%]`)
   * })
   * ```
   */
   static 'downloading': (info:FileInfo, received:number, percentage: number) => Job

   /**
   * Event triggered when .download() has finished downloading all files
   * @category Download
   * @event done
   * @example
   * ```js
   * job.on('done', job => {
   *  console.log('Finished all jobs from :' + job.nick) //=> Finished all jobs from XDCC|BLUE
   * })
   * ```
   */
  static 'done': (job:Job) => Job

  /**
   * Event triggered when chunks of data are being received
   * @category Download
   * @event pipe
   * @remark only works if `xdccJS.path = false`
   * @example
   * ```js
   * job.on('pipe', (stream, fileInfo) => {
   *  console.log('starting download of: ' + fileInfo.file)
   *  stream.pipe(somerwhere)
   * })
   * ```
   */
    static 'pipe': (stream: PassThrough, info:FileInfo) => Job

    /**
     * Event triggered when job is canceled/interrupted
     * @event error
     * @example
     * ```js
     * job.on('error', (message, info) => {
     *  console.log(message) //=> Cannot connect to XDCC|Something@113.5.0.1:3550
     * })
     * ```
     */
    static 'error': (errorMessage:string, info:FileInfo) => Job
  }
  export default interface Job {
    /** @ignore */
    emit(eventType: string | symbol, ...args: unknown[]): boolean
    /** @ignore */
    emit(eventType: 'error', errorMessage: string, fileInfo: FileInfo|undefined): this
    /** @ignore */
    emit(
      eventType: 'done',
      endCandidate: {
        nick: string
        success: string[]
        failures: number[]
      }
    ): this
    /** @ignore */
    emit(eventType: 'downloaded', fileInfo: FileInfo): this
    /** @ignore */
    emit(eventType: 'downloading', fileInfo: FileInfo, received: number, percentage: number): this
    /** @ignore */
    on(eventType: 'downloading', cb: (fileInfo: FileInfo, received: number, percentage: number) => void): this
    /** @ignore */
    on(eventType: string | symbol, cb: (event?: unknown, ...args: unknown[]) => void): this
    /** @ignore */
    on(eventType: 'error', cb: (errorMessage: string, fileInfo: FileInfo) => void): this
    /** @ignore */
    on(eventType: 'done', cb: (endCandidate: { nick: string; success: string[]; failures: number[] }) => void): this
    /** @ignore */
    on(eventType: 'downloaded', cb: (fileInfo: FileInfo) => void): this
    /** @ignore */
    on(eventType: 'pipe', cb: (stream: PassThrough, fileInfo: FileInfo) => void): this
  }

  export type displayedJob = {
    /**
     * Bot nickname
     */
    nick: string
    /**
     * Package still in queue
     */
    queue: number[]
    /**
     * Package currently downloading
     */
    now: number
    /**
     * List of file names successfuly downloaded
     */
    success: string[]
    /**
     * List of packages number that failed
     */
    failed: number[]
  }

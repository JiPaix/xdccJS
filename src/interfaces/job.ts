/* eslint-disable no-unused-vars */
import { EventEmitter } from 'eventemitter3';
import type TypedEmitter from 'typed-emitter';
import { clone } from 'lodash';
import type { PassThrough } from 'stream';
import * as fs from 'fs';
import * as net from 'net';
import { Candidate } from './candidate';
import ProgressBar from '../lib/progress';
import { FileInfo } from './fileinfo';

export type JobMessageEvents = {
  /**
   * Event triggered when a download from the job fails
   * @example
   * ```js
   * job.on('error', (errorMessage, fileInfo) => {
   *   console.log(`${fileInfo.file} failed to download: ${errorMessage}`)
   * })
   * ```
   */
  error: (errorMessage:string, fileInfo?: FileInfo) => void,
  /**
   * Event triggered when all files from the job have been downloaded
   * @example
   * ```js
   * job.on('done', () => {
   *   console.log('done')
   * })
   * ```
   */
  done: (endCandidate: {nick:string, success: string[], failed: number[]}) => void,
  /**
   * Event triggered when a file from the job is downloaded
   * @example
   * ```js
   * job.on('downloaded', (fileInfo) => {
   *  console.log(`${fileInfo.file} saved to ${fileInfo.filePath}`)
   * })
   * ```
   */
  downloaded: (fileInfo: FileInfo) => void,
  /**
   * Event triggered while a file from the job is downloading
   * @example
   * ```js
   * job.on('downloading', (fileInfo, received, percentage) => {
   *  console.log(`${fileInfo.file} @ ${received} of ${fileInfo.length} [${percentage}%]`)
   * })
   * ```
   */
  downloading: (fileInfo: FileInfo, received: number, percentage: number) => void,
  /**
   * Event triggered when a download from the job starts and is ready to be piped
   * @example
   * ```js
   * job.on('data', (stream) => {
   *  stream.on('data', (chunk) => {
   *   console.log(chunk)
   * })
   * ```
   */
  pipe: (stream: PassThrough | fs.WriteStream, fileInfo: FileInfo) => void,
  /**
   * Event triggered when a job is cancelled
   * @example
   * ```js
   * job.on('cancel', (jobInfo) => {
   *  console.log('cancelled downloads from', jobInfo.nick)
   * })
   * ```
   */
  cancel: (candidate: Candidate, errorMessage:string, fileInfo: FileInfo) => void,
}

export class Job extends (EventEmitter as new () => TypedEmitter<JobMessageEvents>) {
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
  cancel?: () => void;

  /** @ignore */
  failures: number[];

  /** @ignore */
  nick: string;

  /** @ignore */
  cancelNick: string;

  /** @ignore */
  now: number;

  /** @ignore */
  queue: number[];

  /** @ignore */
  retry: number;

  /** @ignore */
  success: string[];

  /** @ignore */
  timeout: {
      bar?: ProgressBar
      fileInfo?: FileInfo
      to?: ReturnType<typeof setTimeout>
      eventType?: 'error' | 'cancel'
      message?: string
      padding?: number
      delay?: number
      fn?: () => void
      stream?: fs.WriteStream | PassThrough
      server?: net.Server
      socket?: net.Socket
      pick?: number
      clear: () => void
    };

  constructor(candidate: Candidate) {
    // eslint-disable-next-line constructor-super
    super();
    this.cancel = candidate.cancel;
    this.failures = candidate.failures;
    this.nick = candidate.nick;
    this.cancelNick = candidate.cancelNick || candidate.nick;
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

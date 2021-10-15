/* eslint-disable no-unused-vars */
/* eslint-disable max-classes-per-file */
import { EventEmitter } from 'eventemitter3';
import { PassThrough } from 'stream';
import Downloader, { ParamsDL } from './downloader';
import { FileInfo } from './interfaces/fileinfo';
import Job from './interfaces/job';

/**
 * Constructor parameters
 */
export interface Params extends ParamsDL {
  encoding?: 'utf8'
}

export default class XDCC extends EventEmitter {
  irc: Downloader

  constructor(params: Params) {
    super();
    this.irc = new Downloader(params);
    this.listen();
  }

  private listen(): void {
    this.irc.on('ready', () => {
      this.emit('ready');
    });
    this.irc.on('can-quit', () => {
      this.emit('can-quit');
    });
    this.irc.on('downloaded', (f) => {
      this.emit('downloaded', f);
    });
    this.irc.on('done', (job) => {
      this.emit('done', job);
    });
    this.irc.on('pipe', (stream, f) => {
      this.emit('pipe', stream, f);
    });
    this.irc.on('error', (err) => {
      this.emit('error', err);
    });
    this.irc.on('downloading', (fileInfo, received, percentage) => {
      this.emit('downloading', fileInfo, received, percentage);
    });
  }

  /**
   * start jobs and download files
   * @param target bot name
   * @param packets pack number(s)
   * @example
   * ```js
   * xdccJS.on('ready', () => {
   *  xdccJS.download('XDCC|BLUE', '1-3, 8, 55')
   *  xdccJS.download('XDCC|RED', [1, 3, 10, 20])
   *  xdccJS.download('XDCC|YELLOW', 4)
   * })
   */
  download(target: string, packets: string | number | string[] | number[]):Promise<Job> {
    return this.irc.download(target, packets);
  }

  /**
   * Quit IRC
   */
  quit(): void {
    this.irc.quit();
  }

  /**
   * Search jobs
   * @param bot Bot Name
   */
  public async jobs(bot?: string) {
    if (bot) {
      return this.irc.getCandidate(bot);
    }
    const results:Job[] = [];
    const promises = this.irc.candidates.map(async (job) => {
      results.push(job);
    });
    await Promise.all(promises);
    if (results.length) return results;
    return undefined;
  }

  /**
   * Event triggered when xdccJS is ready to download
   * @category Connection
   * @event ready
   * @example
   * ```js
   * xdccJS.on('ready', () => {
   *  xdccJS.download('XDCC|BOT', 23)
   * })
   * ```
   */
  static 'ready': () => XDCC

  /**
   * Event triggered when all jobs are done
   * @category Connection
   * @event can-quit
   * @example
   * ```js
   * xdccJS.on('can-quit', () => {
   *  xdccJS.quit()
   * })
   * ```
   */
  static 'can-quit': () => XDCC

  /**
   * Event triggered when a file is downloaded
   * @category Download
   * @event downloaded
   * @example
   * ```js
   * xdccJS.on('downloaded', fileInfo => {
   *    console.log('file available @: ' + fileInfo.filePath)
   * })
   * ```
   */
  static 'downloaded': (info:FileInfo) => XDCC

  /**
   * Event triggered while a file is downloading
   * @category Download
   * @event downloading
   * @example
   * ```js
   * xdccJS.on('downloading', (fileInfo, received, percentage) => {
   *    console.log(`${fileInfo.file} @ ${received} of ${fileInfo.length} [${percentage}%]`)
   * })
   * ```
   */
   static 'downloading': (info:FileInfo, received: number, percentage: number) => XDCC

  /**
   * Event triggered when .download() has finished downloading all files
   * @category Download
   * @event done
   * @example
   * ```js
   * xdccJS.on('ready', () => {
   *    xdccJS.download('XDCC|BLUE', '23-25, 102, 300')
   *    xdccJS.download('XDCC|RED', 1152)
   * })
   *
   * xdccJS.on('done', job => {
   *    console.log('Finished all jobs from :' + job.nick)
   *    //=> Finished all jobs from XDCC|BLUE
   *    //=> Finished all jobs from XDCC|RED
   * })
   * ```
   */
  static 'done': (job:Job) => XDCC

  /**
   * Event triggered when chunks of data are being received
   * @category Download
   * @event pipe
   * @remark only works if `xdccJS.path = false`
   * @example
   * ```js
   * xdccJS.on('pipe', (stream, fileInfo) => {
   *  console.log('starting download of: ' + fileInfo.file)
   *  stream.pipe(somerwhere)
   * })
   * ```
   */
  static 'pipe': (stream: PassThrough, info:FileInfo) => XDCC

  /**
   * Event triggered when a download fails.
   * @category Connection
   * @event error
   * @example
   * ```js
   * xdccJS.on('error', (e) => {
   *   throw e
   * })
   * ```
   */
  static 'error': (error:Error) => XDCC
}

export default interface XDCC {
  on(eventType: string | symbol, cb: (event?: any, another?: any) => void): this
  on(eventType: 'can-quit', cb: () => void): this
  on(eventType: 'done', cb: (info:Job) => void): this
  on(eventType: 'downloading', cb: (info:FileInfo, received: number, percentage: number) => void): this
  on(eventType: 'downloaded', cb: (info:FileInfo) => void): this
  on(eventType: 'error', cb: (err:Error) => void): this
  on(eventType: 'pipe', cb: (stream:PassThrough, info:FileInfo) => void): this
  on(eventType: 'ready', cb: () => void): this
}
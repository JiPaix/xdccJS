/* eslint-disable no-unused-vars */
/* eslint-disable max-classes-per-file */
import { EventEmitter } from 'eventemitter3';
import type { PassThrough } from 'stream';
import { Packets } from './addjob';
import Downloader, { ParamsDL } from './downloader';
import type { FileInfo } from './interfaces/fileinfo';
import type { Job } from './interfaces/job';

export type { Candidate } from './interfaces/candidate';
export type { FileInfo } from './interfaces/fileinfo';
export type { Job, JobMessageEvents } from './interfaces/job';
export type { Packets };

export type GlobalMessageEvents = {
  /**
   * Event triggered when all jobs are done
   * @example
   * ```js
   * xdccJS.on('can-quit', () => xdccJS.quit())
   * ```
   */
  'can-quit' : () => void,
  /**
   * Event triggered when .download() has finished downloading all files
   * @example
   * ```js
   * xdccJS.on('ready', () => {
   *   const job1 = xdccJS.download('bot-A', '20-30')
   *   const job2 = xdccJS.download('bot-B', 33)
   * })
   *
   * xdccJS.on('done', (job) => {
   *   if(job.nick === 'bot-A') console.log('done with bot-A')
   *   if(job.nick === 'bot-B') console.log('done with bot-B')
   * })
   * ```
   */
  done: (job:Job) => void,
  /**
   * Event triggered while a file is downloading
   * @example
   * ```js
   * xdccJS.on('downloading', (fileInfo, received, percentage) => {
   *   console.log(`${fileInfo.file} @ ${received} of ${fileInfo.length} [${percentage}%]`)
   * })
   * ```
   */
  downloading: (fileInfo:FileInfo, received: number, percentage: number) => void,
  /**
   * Event triggered when a file has been downloaded
   * @example
   * ```js
   * xdccJS.on('downloaded', (fileInfo) => {
   *   console.log(`${fileInfo.file} saved to ${fileInfo.filePath}`)
   * })
   * ```
   */
  downloaded: (info:FileInfo) => void,
  /**
   * Event triggered when a download fails
   * @example
   * ```js
   * xdccJS.on('error', (errorMessage, fileInfo) => {
   *  console.log(`${fileInfo.file} failed to download: ${errorMessage}`)
   * })
   * ```
   */
  error: (error:Error, fileInfo?:FileInfo) => void,
  /**
   * Event triggered when chunks of data are being received
   * @example
   * ```js
   * xdccJS.on('pipe', (stream, fileInfo) => {
   *  console.log('sarting download of', fileInfo.file)
   *  stream.pipe(somewhere)
   * })
   * ```
   */
  pipe: (stream: PassThrough, info:FileInfo) => void,
  /**
   * Event triggered when a download from the job starts and is ready to be piped
   * @example
   * ```js
   * xdccJS.on('ready', () => {
   *   console.log('xdccJS is ready to download')
   *   xdccJS.download('bot', '20-30')
   * })
   * ```
   */
  ready: () => void
  /**
   * debug messages
   */
  debug: (msg: string) => void
}

/**
 * Constructor parameters
 */
export interface Params extends ParamsDL {
  encoding?: 'utf8'
}

export default class XDCC extends EventEmitter<GlobalMessageEvents> {
  irc: Downloader;

  constructor(params: Params) {
    // eslint-disable-next-line constructor-super
    super();
    this.irc = new Downloader(params);
    this.listen();
  }

  private listen(): void {
    this.irc.on('debug', (msg) => this.emit('debug', msg));
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
      const safeJob = job as Job;
      this.emit('done', safeJob);
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
   * @param ipv6 use ipv6: only needed for passive bots
   * @example
   * ```js
   * xdccJS.on('ready', () => {
   *  xdccJS.download('XDCC|BLUE', '1-3, 8, 55')
   *  xdccJS.download('XDCC|RED', [1, 3, 10, 20])
   *  xdccJS.download('XDCC|YELLOW', 4)
   * })
   */
  download(target: string, packets: Packets, ipv6?:boolean):Promise<Job> {
    return this.irc.download(target, packets, ipv6);
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
}

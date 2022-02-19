/* eslint-disable no-unused-vars */
/* eslint-disable max-classes-per-file */
import { EventEmitter } from 'eventemitter3';
import type TypedEmitter from 'typed-emitter';
import type { PassThrough } from 'stream';
import Downloader, { ParamsDL } from './downloader';
import type { FileInfo } from './interfaces/fileinfo';
import type Job from './interfaces/job';

type MessageEvents = {
  'can-quit' : () => void,
  done: (job:Job) => void,
  downloading: (fileInfo:FileInfo, received: number, percentage: number) => void,
  downloaded: (info:FileInfo) => void,
  error: (error:Error, fileInfo?:FileInfo) => void,
  pipe: (stream: PassThrough, info:FileInfo) => void,
  ready: () => void
}

/**
 * Constructor parameters
 */
export interface Params extends ParamsDL {
  encoding?: 'utf8'
}

export default class XDCC extends (EventEmitter as new () => TypedEmitter<MessageEvents>) {
  irc: Downloader;

  constructor(params: Params) {
    // eslint-disable-next-line constructor-super
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
}

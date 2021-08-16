import { EventEmitter } from 'eventemitter3';
import Downloader, { ParamsDL } from './downloader';
import Job from './interfaces/job';
/**
 * File informations
 * @asMemberOf XDCC
 */
export interface FileInfo {
  /** Type of transfert (send or resume) */
  type: string
  /** Filename */
  file: string
  /** Filename with absolute path, return false if using pipes */
  filePath: string
  /** Transfert IP */
  ip: string
  /** Transfert PORT  */
  port: number
  /** File length in bytes */
  length: number
  /** Token (passive DCC) */
  token: number
  /** Resume Position */
  position?: number
}
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
    this.irc.on('error', (err, f) => {
      this.emit('error', err, f);
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
  download(target: string, packets: string | number | string[] | number[]): Promise<Job> {
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
   * @event ready
   * @example
   * ```js
   * xdccJS.on('xdcc-ready', () => {
   *  xdccJS.download('XDCC|BOT', 23)
   * })
   * ```
   */
  static EVENT_XDCC_READY: () => void

  /**
   * Event triggered when all jobs are done
   * @event can-quit
   * @example
   * ```js
   * xdccJS.on('can-quit', () => {
   *  xdccJS.quit()
   * })
   */
  static EVENT_QUIT: () => void

  /**
   * Event triggered when a file is downloaded
   * @event downloaded
   * @example
   * xdccJS.on('downloaded', fileInfo => {
   *    console.log('file available @: ' + fileInfo.filePath)
   * })
   */
  static EVENT_DOWNLOADING: () => void

  /**
   * Event triggered while a file is downloading
   * @event downloading
   * @example
   * xdccJS.on('downloading', (fileInfo, received, percentage) => {
   *    console.log(`${fileInfo.file} @ ${received} of ${fileInfo.length} [${percentage}%]`)
   * })
   */
  static EVENT_DOWNLOADED: () => void

  /**
   * Event triggered when .download() has finished downloading all files
   * @event done
   * @example
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
   */
  static EVENT_DONE: () => void

  /**
   * Event triggered when chunks of data are being received
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
  static EVENT_PIPE: () => void

  /**
   * Event triggered when a download fails.
   * @category Download
   * @event error
   * @example
   * ```js
   * xdccJS.on('error', (e, f) => {
   *   console.log(`failed to download ${f.file}`)
   *   console.log(e)
   * })
   * ```
   */
  static EVENT_ERROR: () => void
}

/* eslint-disable no-unused-vars */
/* eslint-disable max-classes-per-file */
import { EventEmitter } from 'eventemitter3';
import type { PassThrough } from 'stream';
import { Packets } from './addjob';
import Bridge from './bridge';
import { ParamsDL } from './downloader';
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
   * xdccJS.on('downloading', (fileInfo, received, percentage, eta) => {
   *   console.log(`${fileInfo.file} @ ${received} of ${fileInfo.length} [${percentage}%] - ${eta} ms remaining`)
   * })
   * ```
   */
  downloading: (fileInfo:FileInfo, received: number, percentage: number, eta: number) => void,
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

  'irc error': (IrcErrorEventArgs: import('irc-framework').IrcErrorEventArgs) => void
  join: (JoinEventArgs: import('irc-framework').JoinEventArgs) => void
  kick: (QuitEventArgs: import('irc-framework').QuitEventArgs) => void
  message: (MessageEventArgs: import('irc-framework').MessageEventArgs) => void
  mode: (ModeEventArgs: import('irc-framework').ModeEventArgs) => void
  'nick in use': (NickInUseEventArgs: import('irc-framework').NickInUseEventArgs) => void
  'nick invalid': (NickInvalidEventArgs: import('irc-framework').NickInvalidEventArgs) => void
  notice: (MessageEventArgs: import('irc-framework').MessageEventArgs) => void
  part: (QuitEventArgs: import('irc-framework').QuitEventArgs) => void
  quit: (QuitEventArgs: import('irc-framework').QuitEventArgs) => void
  raw: (RawEventArgs: import('irc-framework').RawEventArgs) => void
  'raw socket connected': (event: {}) => void;
  registered: (RegisteredEventArgs: import('irc-framework').RegisteredEventArgs) => void
  'server options': (ServerOptionsEventArgs: import('irc-framework').ServerOptionsEventArgs) => void
  'socket close': (event: {}) => void;
  'socket connected': (event: {}) => void;
}

/**
 * Constructor parameters
 */
export interface Params extends ParamsDL {
  encoding?: 'utf8'
}

export default class XDCC extends EventEmitter<GlobalMessageEvents> {
  private irc: Bridge;

  /**
   * Change config
   */
  config: (
    params: Partial<
    {
      passivePort: number[],
      throttle: number,
      nickname: string,
      chan: string[],
      path: string | null,
      botNameMatch: boolean,
      retry: number,
      timeout: number,
      verbose: boolean,
      randomizeNick: boolean,
    }>) => {
      passivePort: number[],
      throttle: number | undefined,
      nickname: string,
      chan: string[],
      path: string | boolean,
      botNameMatch: boolean,
      retry: number,
      timeout: number,
      verbose: boolean,
      randomizeNick: boolean | undefined,
    };

  action: (target: string, message: string) => string[];

  ban: (channel: string, mask: string) => void;

  banlist: (channel: string, cb: (e: Event) => any) => void;

  changeNick: (nick: string) => void;

  channel: (channel_name: string) => import('irc-framework').IrcChannel;

  ctcpRequest: (target: string, type: string, ...params: any[]) => void;

  ctcpResponse: (target: string, type: string) => void;

  invite: (channel: string, nick: string) => void;

  join: (channel: string, key?: string | undefined) => void;

  mode: (channel: string, mode: string, extra_args?: string[] | undefined) => void;

  notice: (target: string, message: string) => string[];

  part: (channel: string, message?: string | undefined) => void;

  ping: (message?: string | undefined) => void;

  raw: (raw_data_line: string) => void;

  rawString: { (...parameters: string[]): string; (parameters: string[]): string; };

  say: (target: string, message: string) => string[];

  sendMessage: (commandName: string, target: string, message: string) => string[];

  setTopic: (channel: string, newTopic: string) => void;

  unban: (channel: string, mask: string) => void;

  who: (target: string, cb: (event: any) => void) => void;

  whois: (nick: string, cb: (event: any) => void) => void;

  whowas: (target: string, cb: (event: Event) => any) => void;

  constructor(params: Params) {
    // eslint-disable-next-line constructor-super
    super();
    this.irc = new Bridge(params);
    this.listenCustomEvents();
    this.listenNativeEvents();
    this.config = this.irc.config.bind(this.irc);
    this.action = this.irc.action.bind(this.irc);
    this.ban = this.irc.ban.bind(this.irc);
    this.banlist = this.irc.banlist.bind(this.irc);
    this.changeNick = this.irc.changeNick.bind(this.irc);
    this.channel = this.irc.channel.bind(this.irc);
    this.ctcpRequest = this.irc.ctcpRequest.bind(this.irc);
    this.ctcpResponse = this.irc.ctcpResponse.bind(this.irc);
    this.invite = this.irc.invite.bind(this.irc);
    this.join = this.irc.join.bind(this.irc);
    this.mode = this.irc.mode.bind(this.irc);
    this.notice = this.irc.notice.bind(this.irc);
    this.part = this.irc.part.bind(this.irc);
    this.ping = this.irc.ping.bind(this.irc);
    this.quit = this.irc.quit.bind(this.irc);
    this.raw = this.irc.raw.bind(this.irc);
    this.rawString = this.irc.rawString.bind(this.irc);
    this.say = this.irc.say.bind(this.irc);
    this.sendMessage = this.irc.sendMessage.bind(this.irc);
    this.setTopic = this.irc.setTopic.bind(this.irc);
    this.unban = this.irc.unban.bind(this.irc);
    this.who = this.irc.who.bind(this.irc);
    this.whois = this.irc.whois.bind(this.irc);
    this.whowas = this.irc.whowas.bind(this.irc);
  }

  public get user() {
    return this.irc.user;
  }

  public get connected() {
    return this.irc.connected;
  }

  private get candidates() {
    return Object.freeze(this.irc.candidates);
  }

  private listenNativeEvents(): void {
    this.irc.on('irc error', (event) => this.emit('irc error', event));
    this.irc.on('join', (event) => this.emit('join', event));
    this.irc.on('kick', (event) => this.emit('kick', event));
    this.irc.on('message', (event) => this.emit('message', event));
    this.irc.on('mode', (event) => this.emit('mode', event));
    this.irc.on('nick in use', (event) => this.emit('nick in use', event));
    this.irc.on('nick invalid', (event) => this.emit('nick invalid', event));
    this.irc.on('notice', (event) => this.emit('notice', event));
    this.irc.on('part', (event) => this.emit('part', event));
    this.irc.on('quit', (event) => this.emit('quit', event));
    this.irc.on('raw', (event) => this.emit('raw', event));
    this.irc.on('raw socket connected', (event) => this.emit('raw socket connected', event));
    this.irc.on('registered', (event) => this.emit('registered', event));
    this.irc.on('server options', (event) => this.emit('server options', event));
    this.irc.on('socket close', (event) => this.emit('socket close', event));
    this.irc.on('socket connected', (event) => this.emit('socket connected', event));
  }

  private listenCustomEvents(): void {
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
    this.irc.on('downloading', (fileInfo, received, percentage, eta) => {
      this.emit('downloading', fileInfo, received, percentage, eta);
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
  download(
    target: string,
    packets: Packets,
    opts?: Partial<{ ipv6:boolean, throttle: number }>,
  ):Promise<Job> {
    return this.irc.download(target, packets, opts);
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
    if (!bot) return this.candidates;
    return Object.freeze(this.candidates.find((b) => b.nick.localeCompare(bot, 'en', { sensitivity: 'base' }) === 0));
  }
}

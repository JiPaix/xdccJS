/* eslint-disable no-param-reassign */
import type * as fs from 'fs';
import type * as net from 'net';
import type { PassThrough } from 'stream';
import type { ParamsIRC } from './connect';
import Connect from './connect';
import type { FileInfo } from './interfaces/fileinfo';
import type { Job } from './interfaces/job';
import ProgressBar from './lib/progress';

export type ParamsTimeout = ParamsIRC & {
  /**
   * Number of retries when a download fails
   * @default `1`
   * @example
   * ```js
   * // we've set params.retry = 2
   * xdccJS.download('xdcc|bot', '20, 25')
   * // if download of pack '20' fails it will retry twice before skipping to pack '25'
   */
  retry: number
  /**
   * Queue Regex
   */
  queue?: RegExp
}
interface TimeoutSetup {
  candidate: Job
  eventType: 'error' | 'cancel'
  message: string
  padding?: number
  executeLater?: () => void
  disconnectAfter?: {
    stream: fs.WriteStream | PassThrough
    socket?: net.Socket
    server?: net.Server
    pick?: number | undefined
    bar?: ProgressBar
  }
  delay: number
  fileInfo?: FileInfo
}
export class TimeOut extends Connect {
  protected portInUse: number[];

  protected retry: number;

  protected queue?: RegExp;

  constructor(params: ParamsTimeout) {
    super(params);
    this.portInUse = [];
    this.retry = params.retry;
    this.queue = params.queue;
  }

  protected SetupTimeout(obj: TimeoutSetup): void {
    obj.candidate.timeout.eventType = obj.eventType;
    obj.candidate.timeout.message = obj.message;
    obj.candidate.timeout.padding = obj.padding;
    obj.candidate.timeout.fn = obj.executeLater;
    obj.candidate.timeout.fileInfo = obj.fileInfo;
    if (obj.disconnectAfter) {
      obj.candidate.timeout.stream = obj.disconnectAfter.stream;
      obj.candidate.timeout.socket = obj.disconnectAfter.socket;
      obj.candidate.timeout.server = obj.disconnectAfter.server;
      obj.candidate.timeout.pick = obj.disconnectAfter.pick;
      obj.candidate.timeout.bar = obj.disconnectAfter.bar;
    }
    this.TOstart(obj.candidate, obj.delay);
  }

  protected DisableTimeOutOnQueue(job: Job, regex: RegExp) {
    const listener = (ev: {
      nick: string;
      type: string;
      message: string;
    }) => {
      const regexp = new RegExp(regex);
      if (regexp.test(ev.message)) {
        this.emit('debug', 'xdccJSS:: DOWNLOAD_QUEUED');
        this.print(
          `%info% You have been %cyan%queued%reset% by %yellow%${job.nick}%reset%, please wait.`,
          6,
        );
        job.timeout.clear();
        job.removeListener('message', listener);
      }
    };
    job.on('message', listener);
  }

  private TOendStreams(candidate: Job): this {
    if (candidate.timeout.stream && candidate.timeout.socket) {
      candidate.timeout.stream.end();
      candidate.timeout.socket.end();
    }
    if (candidate.timeout.server && candidate.timeout.pick) {
      const { pick } = candidate.timeout;
      candidate.timeout.server.close(() => {
        this.portInUse = this.portInUse.filter((p) => p !== pick);
      });
    }
    return this;
  }

  private TOstart(candidate: Job, delay: number): void {
    TimeOut.makeClearable(candidate);
    candidate.timeout.clear();
    candidate.timeout.to = setTimeout(() => {
      this.routine(candidate);
      this.TOendStreams(candidate);
      if (candidate.timeout.fn) {
        candidate.timeout.fn();
      } else {
        this.redownload(candidate);
      }
    }, delay);
  }

  private routine(candidate: Job): void {
    if (!candidate.timeout.eventType) {
      throw Error('no event Type');
    }
    this.say(candidate.cancelNick, 'XDCC CANCEL');
    const error = new Error(candidate.timeout.message);
    this.emit(candidate.timeout.eventType, error, candidate.timeout.fileInfo);
    this.emit('debug', `xdccJS:: EVENT_${candidate.timeout.eventType.toLocaleUpperCase()}_ERROR @ ${error.message}`);
    candidate.emit(candidate.timeout.eventType, error.message, candidate.timeout.fileInfo);
    if (this.verbose) {
      const msg = `%danger% ${candidate.timeout.message}`;
      if (candidate.timeout.bar) {
        candidate.timeout.bar.interrupt(' ', false);
      }
      this.print(`${msg}`, candidate.timeout.padding);
    }
  }

  protected redownload(candidate: Job, fileInfo?: FileInfo): void {
    if (candidate.retry < this.retry) {
      candidate.retry += 1;
      this.say(candidate.nick, `xdcc send ${candidate.now}`);
      this.emit('debug', 'xdccJSS:: DOWNLOAD_RETRY');
      this.print(`%info% retrying: ${candidate.retry}/${this.retry}`, 6);
      candidate.timeout.to = setTimeout(() => {
        this.routine(candidate);
        this.redownload(candidate, fileInfo);
      }, this.timeout);
    } else {
      candidate.timeout.clear();
      const pad = candidate.retry + 5;
      const message = `%danger% skipped pack: ${candidate.now}`;
      this.emit('debug', 'xdccJSS:: DOWNLOAD_SKIPPED');
      this.print(message, pad);
      candidate.emit('error', message, fileInfo);
      candidate.failures.push(candidate.now);
      this.emit('next', candidate, this.verbose);
    }
  }

  protected static makeClearable(candidate: Job): void {
    candidate.timeout.clear = (): void => {
      if (candidate.timeout.to) clearTimeout(candidate.timeout.to);
    };
  }
}

/* eslint-disable prefer-destructuring */
/* eslint-disable no-param-reassign */
import type { MessageEventArgs } from 'irc-framework';
import * as net from 'net';
import type { Candidate } from './interfaces/candidate';
import { Job } from './interfaces/job';
import type { ParamsTimeout } from './timeouthandler';
import { TimeOut } from './timeouthandler';

export type Packets = string | string[] | number | number[]

export default class AddJob extends TimeOut {
  candidates: Job[];

  constructor(params: ParamsTimeout) {
    super(params);
    this.candidates = [];
    this.onRequest();
    this.onNext();
  }

  protected onRequest(): void {
    this.on('request', (args: { target: string; packets: number[] }) => {
      this.emit('debug', 'xdccJS:: DOWNLOAD_REGISTERED');
      const candidate = this.getCandidate(args.target);
      this.prepareCandidate(candidate);
    });
  }

  private static constructCandidate(target: string, range: number[], ipv6?:boolean): Candidate {
    return {
      nick: target,
      cancelNick: target,
      queue: range,
      retry: 0,
      now: 0,
      failures: [],
      success: [],
      ipv6,
      timeout: {
        clear: (): void => {
          throw Error('calling clear too soon');
        },
      },
    };
  }

  protected makeCancelable(candidate: Candidate, client?: net.Socket): () => void {
    const fn = (): void => {
      candidate.timeout.clear();
      this.say(candidate.cancelNick, 'XDCC CANCEL');
      if (client) {
        const cancel = new Error('cancel');
        client.destroy(cancel);
      } else {
        this.print('Cancelled by user', 4);
        this.candidates = this.candidates.filter((x) => x.nick !== candidate.nick);
      }
    };
    return fn;
  }

  public async download(target: string, packets: Packets, ipv6?: boolean): Promise<Job> {
    const range = await AddJob.parsePackets(packets);
    let candidate = this.getCandidate(target);
    if (!candidate) {
      const base = AddJob.constructCandidate(target, range, ipv6);
      const cancelFn = this.makeCancelable(base);
      const newCand = new Job(base, cancelFn);
      AddJob.makeClearable(newCand);
      this.candidates.push(newCand);
      candidate = this.getCandidate(target);
    } else {
      const tmp: Job['queue'] = candidate.queue.concat(range);
      candidate.queue = tmp.sort((a, b) => a - b);
    }
    if (this.candidates.length === 1 && candidate.now === 0) {
      this.passMessage(candidate);
      this.emit('request', { target, packets: candidate.queue });
    }
    return candidate;
  }

  private passMessage(job:Job) {
    const listener = (event: MessageEventArgs) => {
      if (typeof event.type === 'undefined') return;
      const regexp = this.queue ? new RegExp(this.queue) : undefined;
      const regex = regexp && regexp.test(event.message);
      const toMe = event.target.toLocaleLowerCase() === this.nickname.toLocaleLowerCase();
      if (event.nick === job.nick || event.nick === job.cancelNick) {
        job.emit('message', { nick: event.nick, type: event.type, message: event.message });
        if (!regex && toMe) {
          this.print(
            `%yellow%@${job.nick}%reset%: %cyan%${event.message}%reset%`,
            8,
          );
        }
      }
    };
    this.on('message', listener);
    this.on('notice', listener);
    job.on('done', () => {
      this.removeListener('message', listener);
      this.removeListener('notice', listener);
      job.removeAllListeners();
    });
  }

  private static async parsePackets(packets: string | string[] | number | number[])
  : Promise<number[]> {
    if (typeof packets === 'string') {
      return AddJob.parsePacketString(packets);
    } if (Array.isArray(packets)) {
      return AddJob.parsePacketArray(packets);
    } if (typeof packets === 'number') {
      return [packets];
    }
    return [0];
  }

  private static async parsePacketArray(packets: string[] | number[]): Promise<number[]> {
    const range: number[] = [];

    const promises = packets.map(async (pack) => {
      if (typeof pack === 'number') {
        range.push(pack);
      } else {
        range.push(parseInt(pack, 10));
      }
    });
    await Promise.all(promises);
    return AddJob.sortPackets(range);
  }

  private static async parsePacketString(packet: string): Promise<number[]> {
    const newPacket = packet.replace(/#/gi, '');
    const splittedPackets = newPacket.split(',');
    let range: number[] = [];
    const promises = splittedPackets.map(async (p) => {
      if (p.includes('-')) {
        range = range.concat(AddJob.decomposeRange(p));
      } else {
        range.push(parseInt(p, 10));
      }
    });
    await Promise.all(promises);
    return AddJob.sortPackets(range);
  }

  private static decomposeRange(string: string): number[] {
    const minmax = string.split('-');
    const start = parseInt(minmax[0], 10);
    const end = parseInt(minmax[1], 10);
    return AddJob.range(start, end);
  }

  private static range(start: number, end: number): number[] {
    return Array.from(Array(end + 1).keys()).slice(start);
  }

  private static sortPackets(range: number[]): number[] {
    return range
      .sort((a, b) => a - b)
      .filter((item, pos, ary) => !pos || item !== ary[pos - 1]);
  }

  protected prepareCandidate(candidate: Job): void {
    candidate.retry = 0;
    candidate.now = candidate.queue[0];
    candidate.queue = candidate.queue.filter(
      (pending) => pending.toString() !== candidate.now.toString(),
    );
    if (this.queue) {
      const regex = this.queue;
      this.DisableTimeOutOnQueue(candidate, regex);
    }
    this.SetupTimeout({
      candidate,
      eventType: 'error',
      message: `timeout: no response from %yellow%${candidate.nick}`,
      padding: 6,
      delay: this.timeout,
    });
    this.emit('debug', 'xdccJS:: DOWNLOAD_REQUESTING');
    this.print(
      `%success% sending command: /MSG %yellow%${candidate.nick}%reset% xdcc send %yellow%${candidate.now}`,
      4,
    );
    this.say(candidate.nick, `xdcc send ${candidate.now}`);
  }

  public getCandidate(target: string): Job {
    return this.candidates.filter(
      (candidates) => candidates.nick.localeCompare(target, 'en', { sensitivity: 'base' }) === 0,
    )[0];
  }

  protected onNext(): void {
    this.on('next', (candidate: Job, verbose:boolean) => {
      this.emit('debug', 'xdccJS:: DOWNLOAD_NEXT');
      if (candidate.queue.length) {
        this.prepareCandidate(candidate);
      } else {
        this.candidates = this.candidates.filter((c) => c.nick !== candidate.nick);
        candidate.emit('done', candidate.show());
        this.emit('done', candidate.show());
        if (verbose && candidate.failures.length) {
          let message = `%danger% couldn't download pack: %yellow%${candidate.failures}%reset% from %yellow%${candidate.nick}%reset%`;
          if (candidate.failures.length > 1) {
          /**
           * Credit to CertainPerformance on stackoverflow
           * - Profile https://stackoverflow.com/users/9515207/certainperformance
           * - Post: https://stackoverflow.com/questions/53879088/join-an-array-by-commas-and-and/53879103#53879103
           * - Answer: https://stackoverflow.com/a/53879103
           */
            const firsts = candidate.failures.slice(0, candidate.failures.length - 1);
            const last = candidate.failures[candidate.failures.length - 1];
            message = `%danger% couldn't download packs: %yellow%${`${firsts.join(', ')} and ${last}`}%reset% from %yellow%${candidate.nick}%reset%`;
          }
          this.print(message, 6);
        }
        if (!this.candidates.length) {
          this.emit('debug', 'xdccJS:: EVENT_CAN_QUIT');
          this.emit('can-quit');
        } else {
          const newcandidate = this.candidates[0];
          this.emit('request', { target: newcandidate.nick, packets: newcandidate.queue });
        }
      }
    });
  }
}

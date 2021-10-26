/* eslint-disable prefer-destructuring */
/* eslint-disable no-param-reassign */
import * as net from 'net';
import Job from './interfaces/job';
import { Candidate } from './interfaces/candidate';
import { TimeOut, ParamsTimeout } from './timeouthandler';

export default class AddJob extends TimeOut {
  candidates: Job[]

  constructor(params: ParamsTimeout) {
    super(params);
    this.candidates = [];
    this.onRequest();
    this.onNext();
  }

  protected onRequest(): void {
    this.on('request', (args: { target: string; packets: number[] }) => {
      const candidate = this.getCandidate(args.target);
      this.prepareCandidate(candidate);
    });
  }

  private static constructCandidate(target: string, range: number[]): Candidate {
    return {
      nick: target,
      cancelNick: target,
      queue: range,
      retry: 0,
      now: 0,
      failures: [],
      success: [],
      timeout: {
        clear: (): void => {
          throw Error('calling clear too soon');
        },
      },
    };
  }

  protected makeCancelable(candidate: Job, client?: net.Socket): () => void {
    const fn = (): void => {
      candidate.timeout.clear();
      if (client) {
        const cancel = new Error('cancel');
        client.destroy(cancel);
      } else {
        this.candidates = this.candidates.filter((x) => x.nick !== candidate.nick);
      }
    };
    return fn;
  }

  public async download(target: string, packets: string | string[] | number | number[])
  : Promise<Job> {
    const range = await AddJob.parsePackets(packets);
    let candidate = this.getCandidate(target);
    if (!candidate) {
      const base = AddJob.constructCandidate(target, range);
      const newCand = new Job(base);
      AddJob.makeClearable(newCand);
      newCand.cancel = this.makeCancelable(newCand);
      this.candidates.push(newCand);
      candidate = this.getCandidate(target);
    } else {
      const tmp: Job['queue'] = candidate.queue.concat(range);
      candidate.queue = tmp.sort((a, b) => a - b);
    }
    if (this.candidates.length === 1 && candidate.now === 0) {
      this.emit('request', { target, packets: candidate.queue });
    }
    return candidate;
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
    this.say(candidate.nick, `xdcc send ${candidate.now}`);
    this.SetupTimeout({
      candidate,
      eventType: 'error',
      message: `timeout: no response from %yellow%${candidate.nick}`,
      padding: 6,
      delay: this.timeout,
    });
    this.print(
      `%success% sending command: /MSG %yellow%${candidate.nick}%reset% xdcc send %yellow%${candidate.now.toString()}`,
      4,
    );
  }

  public getCandidate(target: string): Job {
    return this.candidates.filter(
      (candidates) => candidates.nick.localeCompare(target, 'en', { sensitivity: 'base' }) === 0,
    )[0];
  }

  protected onNext(): void {
    this.on('next', (candidate: Job, verbose:boolean) => {
      if (candidate.queue.length) {
        this.prepareCandidate(candidate);
      } else {
        this.candidates = this.candidates.filter((c) => c.nick !== candidate.nick);
        candidate.emit('done', candidate.show());
        this.emit('done', candidate.show());
        if (verbose && candidate.failures.length) {
          if (candidate.failures.length > 1) {
          /**
           * Credit to CertainPerformance on stackoverflow
           * - Profile https://stackoverflow.com/users/9515207/certainperformance
           * - Post: https://stackoverflow.com/questions/53879088/join-an-array-by-commas-and-and/53879103#53879103
           * - Answer: https://stackoverflow.com/a/53879103
           */
            const firsts = candidate.failures.slice(0, candidate.failures.length - 1);
            const last = candidate.failures[candidate.failures.length - 1];
            this.print(`%danger% couldn't download packs: %yellow%${`${firsts.join(', ')} and ${last}`}%reset% from %yellow%${candidate.nick}%reset%`, 4);
          } else {
            this.print(`%danger% couldn't download pack: %yellow%${candidate.failures}%reset% from %yellow%${candidate.nick}%reset%`, 4);
          }
        }
        if (!this.candidates.length) {
          this.emit('can-quit');
        } else {
          const newcandidate = this.candidates[0];
          this.emit('request', { target: newcandidate.nick, packets: newcandidate.queue });
        }
      }
    });
  }
}

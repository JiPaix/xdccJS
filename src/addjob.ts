import { Job } from './interfaces/job'
import { Candidate } from './interfaces/candidate'
import { TimeOut, ParamsTimeout } from './timeouthandler'

export class AddJob extends TimeOut {
  candidates: Job[]
  constructor(params: ParamsTimeout) {
    super(params)
    this.candidates = []
    this.onRequest()
    this.onNext()
  }

  protected onRequest(): void {
    this.on('request', (args: { target: string; packets: number[] }) => {
      const candidate = this.getCandidate(args.target)
      this.prepareCandidate(candidate)
    })
  }

  private constructCandidate(target: string, range: number[]): Candidate {
    return {
      nick: target,
      queue: range,
      retry: 0,
      now: 0,
      failures: [],
      success: [],
      timeout: {
        clear: (): void => {
          throw Error('calling clear too soon')
        },
      },
    }
  }

  public download(target: string, packets: string | string[] | number | number[]): Job {
    const range = this.parsePackets(packets)
    let candidate = this.getCandidate(target)
    if (!candidate) {
      const base = this.constructCandidate(target, range)
      const newCand = new Job(base)
      this.candidates.push(newCand)
      candidate = this.getCandidate(target)
    } else {
      const tmp: Job['queue'] = candidate.queue.concat(range)
      candidate.queue = tmp.sort((a, b) => a - b)
    }
    if (this.candidates.length === 1 && candidate.now === 0) {
      this.emit('request', { target: target, packets: candidate.queue })
    }
    return candidate
  }

  private parsePackets(packets: string | string[] | number | number[]): number[] {
    if (typeof packets === 'string') {
      return this.parsePacketString(packets)
    } else if (Array.isArray(packets)) {
      return this.parsePacketArray(packets)
    } else if (typeof packets === 'number') {
      return [packets]
    } else {
      return [0]
    }
  }
  private parsePacketArray(packets: string[] | number[]): number[] {
    const range: number[] = []
    for (const pack of packets) {
      if (typeof pack === 'number') {
        range.push(pack)
      } else {
        range.push(parseInt(pack))
      }
    }
    return this.sortPackets(range)
  }
  private parsePacketString(packet: string): number[] {
    packet = packet.replace(/#/gi, '')
    const splittedPackets = packet.split(',')
    let range: number[] = []
    for (const packet of splittedPackets) {
      if (packet.includes('-')) {
        range = range.concat(this.decomposeRange(packet))
      } else {
        range.push(parseInt(packet))
      }
    }
    return this.sortPackets(range)
  }
  private decomposeRange(string: string): number[] {
    const minmax = string.split('-')
    const start = parseInt(minmax[0])
    const end = parseInt(minmax[1])
    return this.range(start, end)
  }
  private range(start: number, end: number): number[] {
    return Array.from(Array(end + 1).keys()).slice(start)
  }
  private sortPackets(range: number[]): number[] {
    return range
      .sort((a, b) => a - b)
      .filter((item, pos, ary) => {
        return !pos || item != ary[pos - 1]
      })
  }

  protected prepareCandidate(candidate: Job): void {
    candidate.retry = 0
    candidate.now = candidate.queue[0]
    candidate.queue = candidate.queue.filter(pending => pending.toString() !== candidate.now.toString())
    this.say(candidate.nick, `xdcc send ${candidate.now}`)
    this.TOeventType(candidate, 'error')
      .TOeventMessage(candidate, `timeout: no response from %yellow%${candidate.nick}`, 6)
      .TOstart(candidate, this.timeout)
    this.print(
      `%success% sending command: /MSG %yellow%${candidate.nick}%reset% xdcc send %yellow%${candidate.now.toString()}`,
      4
    )
  }

  public getCandidate(target: string): Job {
    return this.candidates.filter(
      candidates => candidates.nick.localeCompare(target, 'en', { sensitivity: 'base' }) === 0
    )[0]
  }
  
  protected onNext(): void {
    this.on('next', (candidate: Job) => {
      if (candidate.queue.length) {
        this.prepareCandidate(candidate)
      } else {
        this.candidates = this.candidates.filter(c => c.nick !== candidate.nick)
        candidate.emit('done', candidate.show())
        this.emit('done', candidate.show())
        if (!this.candidates.length) {
          this.emit('can-quit')
        } else {
          const newcandidate = this.candidates[0]
          this.emit('request', { target: newcandidate.nick, packets: newcandidate.queue })
        }
      }
    })
  }
}

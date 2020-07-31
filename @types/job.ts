import { EventEmitter } from 'eventemitter3'
import * as _ from 'lodash'
import { PassThrough } from 'stream'

export class Job extends EventEmitter {
  cancel?: () => void
  failures: number[]
  nick: string
  now: number
  queue: number[]
  retry: number
  success: string[]
  timeout?: NodeJS.Timeout | undefined
  constructor(candidate: Candidate) {
    super()
    this.cancel = candidate.cancel
    this.failures = candidate.failures
    this.nick = candidate.nick
    this.now = candidate.now
    this.queue = candidate.queue
    this.retry = candidate.retry
    this.success = candidate.success
    this.timeout = candidate.timeout
  }
  public show(): { nick: string; queue: number[]; now: number; success: string[]; failed: number[] } {
    const info = {
      nick: _.clone(this.nick),
      queue: _.clone(this.queue),
      now: _.clone(this.now),
      success: _.clone(this.success),
      failed: _.clone(this.failures),
    }
    return info
  }
  public isDone(): boolean {
    if (this.queue.length) {
      return false
    } else {
      return true
    }
  }
}
export interface Job {
  emit(eventType: string | symbol, ...args: unknown[]): boolean
  emit(eventType: 'error', msg: string, fileInfo: FileInfo): this
  emit(
    eventType: 'done',
    endCandidate: {
      nick: string
      success: string[]
      failures: number[]
    }
  ): this
  emit(eventType: 'downloaded', fileInfo: FileInfo): this
  on(eventType: string | symbol, cb: (event?: unknown, ...args: unknown[]) => void): this
  on(eventType: 'error', msg: string, cb: (fileInfo: FileInfo) => void): this
  on(eventType: 'done', cb: (endCandidate: { nick: string; success: string[]; failures: number[] }) => void): this
  on(eventType: 'downloaded', cb: (fileInfo: FileInfo) => void): this
  on(eventType: 'pipe', cb: (stream: PassThrough, fileInfo: FileInfo) => void): this
}

/**
 * File informations
 * @asMemberOf XDCC
 */
declare interface FileInfo {
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
/**
 * @ignore
 */
declare interface Candidate {
  /**
   * @ignore
   */
  cancel?: () => void
  /**
   * @description Nickname of the bot
   */
  nick: string
  /**
   * @description Pack number in queue
   */
  queue: number[]
  /**
   * @ignore
   */
  timeout?: NodeJS.Timeout
  /**
   * @description Package number currently downloading
   */
  now: number
  /**
   * @description Nb of retries on `now`
   */
  retry: number
  /**
   * @description Array with pack number that failed after x `retry`
   */
  failures: number[]
  /**
   * @description Array of file (filenames) that successfully downloaded
   */
  success: string[]
}

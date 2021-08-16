/* eslint-disable no-unused-vars */
import { EventEmitter } from 'eventemitter3';
import { clone } from 'lodash';
import { PassThrough } from 'stream';
import * as fs from 'fs';
import * as net from 'net';
import { Candidate } from './candidate';
import ProgressBar from '../lib/progress';
import { FileInfo } from './fileinfo';

namespace Jobs {
  export type displayedJob = {
    nick: string
    queue: number[]
    now: number
    success: string[]
    failed: number[]
  }
  export class Job extends EventEmitter {
    cancel?: () => void

    failures: number[]

    nick: string

    now: number

    queue: number[]

    retry: number

    success: string[]

    timeout: {
      bar?: ProgressBar
      fileInfo?: FileInfo
      to?: ReturnType<typeof setTimeout>
      eventType?: string
      message?: string
      padding?: number
      delay?: number
      fn?: () => void
      stream?: fs.WriteStream | PassThrough
      server?: net.Server
      socket?: net.Socket
      pick?: number
      clear: () => void
    }

    constructor(candidate: Candidate) {
      super();
      this.cancel = candidate.cancel;
      this.failures = candidate.failures;
      this.nick = candidate.nick;
      this.now = candidate.now;
      this.queue = candidate.queue;
      this.retry = candidate.retry;
      this.success = candidate.success;
      this.timeout = candidate.timeout;
    }

    public show(): displayedJob {
      const info = {
        nick: clone(this.nick),
        queue: clone(this.queue),
        now: clone(this.now),
        success: clone(this.success),
        failed: clone(this.failures),
        cancel: this.cancel,
      };
      return info;
    }

    public isDone(): boolean {
      if (this.queue.length) {
        return false;
      }
      return true;
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
    emit(eventType: 'downloading', fileInfo: FileInfo, received: number, percentage: number): this
    on(eventType: 'downloading', cb: (fileInfo: FileInfo, received: number, percentage: number) => void): this
    on(eventType: string | symbol, cb: (event?: unknown, ...args: unknown[]) => void): this
    on(eventType: 'error', msg: string, cb: (fileInfo: FileInfo) => void): this
    on(eventType: 'done', cb: (endCandidate: { nick: string; success: string[]; failures: number[] }) => void): this
    on(eventType: 'downloaded', cb: (fileInfo: FileInfo) => void): this
    on(eventType: 'pipe', cb: (stream: PassThrough, fileInfo: FileInfo) => void): this
  }
}

export default Jobs.Job;

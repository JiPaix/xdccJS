/* eslint-disable max-len */
/* eslint-disable no-param-reassign */
import { PassThrough } from 'stream';
import * as net from 'net';
import * as fs from 'fs';
import { CtcpParser, ParamsCTCP } from './ctcp_parser';
import * as ProgressBar from './lib/progress';
import Connect from './connect';
import type { FileInfo } from './interfaces/fileinfo';
import type { Job } from './interfaces/job';
import getIp from './lib/get-ip';

export type ParamsDL = ParamsCTCP & {
  /**
   * Array of ports for passive DCC
   * @default `5001`
   * @remark Some xdcc bots use passive dcc, this require to have these ports opened on your computer/router/firewall
   * @example
   * ```js
   * params.passivePort = [3213, 3214]
   */
  passivePort?: number[]
}

interface Pass {
  server?: net.Server
  client: net.Socket
  stream: fs.WriteStream | PassThrough
  candidate: Job
  fileInfo: FileInfo
  pick?: number
  bar: ProgressBar
}

export default class Downloader extends CtcpParser {
  passivePort: number[];

  ip: Promise<number>;

  constructor(params: ParamsDL) {
    super(params);
    this.ip = Downloader.getIp();
    this.passivePort = Downloader.is('passivePort', params.passivePort, 'object', [5001]);
    this.on('prepareDL', (downloadrequest: { fileInfo: FileInfo; candidate: Job }) => {
      this.prepareDL(downloadrequest);
    });
  }

  static async getIp() {
    const ip = await getIp();
    const d = ip.split('.');
    const results = ((+d[0] * 256 + +d[1]) * 256 + +d[2]) * 256 + +d[3];
    return results;
  }

  private setupStream(fileInfo: FileInfo): fs.WriteStream | PassThrough {
    if (this.path) {
      if (fileInfo.type === 'DCC ACCEPT') {
        return fs.createWriteStream(fileInfo.filePath, {
          flags: 'r+',
          start: fileInfo.position,
        });
      } if (fileInfo.type === 'DCC SEND') {
        return fs.createWriteStream(fileInfo.filePath);
      }
      throw Error('Error in control flow: setupStream');
    } else {
      return new PassThrough();
    }
  }

  private prepareDL(downloadrequest: { fileInfo: FileInfo; candidate: Job }): void {
    const { fileInfo } = downloadrequest;
    const { candidate } = downloadrequest;
    const stream = this.setupStream(fileInfo);
    if (fileInfo.port === 0) {
      const pick = this.portPicker();
      const server = net.createServer((client) => {
        this.SetupTimeout({
          candidate,
          eventType: 'error',
          message: '%danger% Timeout: no initial connnection',
          delay: this.timeout,
          disconnectAfter: {
            stream,
            server,
            socket: client,
            pick,
          },
          padding: 6,
          fileInfo,
        });
        this.processDL(server, client, stream, candidate, fileInfo, pick);
      });

      server.listen(pick, '0.0.0.0', () => {
        this.ip.then((ip) => {
          this.raw(
            `PRIVMSG ${candidate.nick} ${String.fromCharCode(1)}DCC SEND ${fileInfo.file} ${ip} ${pick} ${
              fileInfo.length
            } ${fileInfo.token}${String.fromCharCode(1)}`,
          );
        });
      });
    } else {
      const client = net.connect(fileInfo.port, fileInfo.ip);
      this.processDL(undefined, client, stream, candidate, fileInfo, undefined);
    }
  }

  private portPicker(): number | undefined {
    const available = this.passivePort.filter((ports) => !this.portInUse.includes(ports));
    const pick = available[Math.floor(Math.random() * available.length)];
    this.portInUse.push(pick);
    return pick;
  }

  private processDL(
    server: net.Server | undefined,
    client: net.Socket,
    stream: fs.WriteStream | PassThrough,
    candidate: Job,
    fileInfo: FileInfo,
    pick: number | undefined,
  ): void {
    candidate.cancel = this.makeCancelable(candidate, client);
    this.print(`%info% downloading : %cyan%${fileInfo.file}`, 5);
    const bar = Downloader.setupProgressBar(fileInfo.length);
    const pass: Pass = {
      server,
      client,
      stream,
      candidate,
      fileInfo,
      pick,
      bar,
    };
    client.setTimeout(10000);
    this.onTimeOut(pass);
    this.onData(pass);
    this.onEnd(pass);
    this.onError(pass);
  }

  private onTimeOut(args: Pass): void {
    args.client.on('timeout', () => {
      this.SetupTimeout({
        candidate: args.candidate,
        eventType: 'error',
        message: 'Timeout',
        delay: 0,
        disconnectAfter: {
          stream: args.stream,
          server: args.server,
          socket: args.client,
          pick: args.pick,
          bar: args.bar,
        },
        padding: 6,
        fileInfo: args.fileInfo,
        executeLater: () => {
          this.redownload(args.candidate, args.fileInfo);
        },
      });
    });
  }

  private onError(args: Pass): void {
    args.client.on('error', (e: Error) => {
      this.SetupTimeout({
        candidate: args.candidate,
        eventType: e.message === 'cancel' ? 'cancel' : 'error',
        message:
          e.message === 'cancel'
            ? 'Cancelled by user'
            : `Connection error: %yellow%${e.message}`,
        delay: 0,
        disconnectAfter: {
          stream: args.stream,
          server: args.server,
          socket: args.client,
          pick: args.pick,
          bar: args.bar,
        },
        padding: 4,
        fileInfo: args.fileInfo,
        executeLater: () => {
          if (e.message === 'cancel') {
            args.candidate.failures.push(args.candidate.now);
            args.candidate.queue = [];
            if (fs.existsSync(args.fileInfo.filePath)) {
              fs.unlinkSync(args.fileInfo.filePath);
            }
            this.emit('next', args.candidate, this.verbose);
          } else {
            this.redownload(args.candidate, args.fileInfo);
          }
        },
      });
    });
  }

  private onEnd(args: Pass): void {
    args.client.on('close', (e) => {
      if (e) return;
      this.print('%success% done.', 6);
      args.candidate.timeout.clear();
      args.candidate.success.push(args.fileInfo.file);
      if (args.server && args.pick) {
        args.server.close(() => {
          this.portInUse = this.portInUse.filter((p) => p !== args.pick);
        });
      }
      args.stream.end();
      this.emit('downloaded', args.fileInfo);
      args.candidate.emit('downloaded', args.fileInfo);
      this.emit('next', args.candidate, this.verbose);
    });
  }

  private onData(args: Pass): void {
    const sendBuffer = Buffer.alloc(8);
    let received = 0;
    args.client.on('data', (data) => {
      if (received === 0) {
        args.candidate.timeout.clear();
        if (!this.path) {
          args.candidate.emit('pipe', args.stream, args.fileInfo);
          this.emit('pipe', args.stream, args.fileInfo);
        }
      }
      args.stream.write(data);
      received += data.length;
      sendBuffer.writeBigInt64BE(BigInt(received), 0);
      args.client.write(sendBuffer);
      if (this.verbose && args.bar) args.bar.tick(data.length);
      if (received < args.fileInfo.length) {
        args.candidate.emit('downloading', args.fileInfo, received, (received / args.fileInfo.length) * 100);
        this.emit('downloading', args.fileInfo, received, (received / args.fileInfo.length) * 100);
      } else {
        args.client.end();
      }
    });
  }

  protected static setupProgressBar(len: number): ProgressBar {
    return new ProgressBar(''.padStart(6) + Connect.replace(':roll [:bar] ETA: :eta @ :rate - :percent'), {
      complete: '=',
      incomplete: ' ',
      width: 20,
      total: len,
      clear: true,
      renderThrottle: 100,
    });
  }
}

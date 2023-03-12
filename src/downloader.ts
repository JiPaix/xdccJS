/* eslint-disable max-len */
/* eslint-disable no-param-reassign */
import * as fs from 'fs';
import * as net from 'net';
import { PassThrough } from 'stream';
import { CtcpParser, ParamsCTCP } from './ctcp_parser';
import type { FileInfo } from './interfaces/fileinfo';
import type { Job } from './interfaces/job';
import getIp from './lib/get-ip';
import * as ProgressBar from './lib/progress';

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
  client?: net.Socket
  stream: fs.WriteStream | PassThrough
  candidate: Job
  fileInfo: FileInfo
  pick?: number
  bar?: ProgressBar
  received: number,
  bufferType: '64bit' | '32bit'
}

export default class Downloader extends CtcpParser {
  passivePort: number[];

  ip: Promise<{
    v4: string | undefined;
    v6: string | undefined;
  }>;

  constructor(params: ParamsDL) {
    super(params);
    this.ip = Downloader.getIp();
    this.passivePort = CtcpParser.is({ name: 'passivePort', variable: params.passivePort, type: [5001] });
    this.on('prepareDL', (downloadrequest: { fileInfo: FileInfo; candidate: Job }) => {
      this.prepareDL(downloadrequest);
    });
  }

  static async getIp() {
    const ip = await getIp();
    let v4:string|undefined;
    if (ip.v4) {
      const d = ip.v4.split('.');
      const results = ((+d[0] * 256 + +d[1]) * 256 + +d[2]) * 256 + +d[3];
      v4 = `${results}`;
    }
    return { v4, v6: ip.v6 };
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
      this.emit('debug', 'xdccJS:: TCP_INCOMING_READY');
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

      const listenIp = candidate.ipv6 ? '::' : '0.0.0.0';

      server.listen(pick, listenIp, () => {
        this.ip.then((ip) => {
          this.raw(
            `PRIVMSG ${candidate.nick} ${String.fromCharCode(1)}DCC SEND ${fileInfo.file} ${ip} ${pick} ${
              fileInfo.length
            } ${fileInfo.token}${String.fromCharCode(1)}`,
          );
        }).catch((e) => {
          const pass = {
            server,
            stream,
            candidate,
            fileInfo,
            pick,
            received: 0,
            bufferType: fileInfo.length > 4294967295 ? '64bit' : '32bit' as '64bit' | '32bit',
          };
          this.onError(pass, e);
        });
      });
    } else {
      this.emit('debug', 'xdccJS:: TCP_OUTGOING_READY');
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
      received: 0,
      bufferType: fileInfo.length > 4294967295 ? '64bit' : '32bit',
    };
    client.setTimeout(this.timeout);
    client.on('timeout', () => this.onTimeOut(pass));
    client.on('error', (e) => this.onError(pass, e));
    const sendBuffer = Buffer.alloc(pass.bufferType === '64bit' ? 8 : 4);
    client.on('data', (data) => this.onData(pass, data, sendBuffer));
    client.once('data', () => this.emit('debug', 'xdccJS:: TCP_DOWNLOADING'));
    client.on('close', (e) => this.onClose(pass, e));
  }

  private onTimeOut(args: Pass): void {
    if (args.received === args.fileInfo.length) return;
    this.emit('debug', 'xdccJS:: TCP_TIMEOUT');
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
  }

  private onError(args: Pass, e: Error): void {
    if (args.received === args.fileInfo.length) return;

    if (e.message === 'cancel') this.emit('debug', 'xdccJS:: TCP_CANCEL');
    else this.emit('debug', `xdccJS:: TCP_ERROR @ ${e.message}`);

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
  }

  private onClose(args: Pass, e: boolean): void {
    if (e && args.received !== args.fileInfo.length) {
      this.emit('debug', `xdccJS:: TCP_CLOSE_ERROR @ ${e}`);
      return;
    }
    this.print('%success% done.', 6);
    this.emit('debug', 'xdccJS:: TCP_CLOSE_SUCCESS');
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
  }

  private onData(args: Pass, data: Buffer, sendBuffer: Buffer): void {
    if (args.received === 0) {
      args.candidate.timeout.clear();
      if (!this.path) {
        args.candidate.emit('pipe', args.stream, args.fileInfo);
        this.emit('pipe', args.stream, args.fileInfo);
      }
    }
    args.stream.write(data);
    args.received += data.length;

    if (args.bufferType === '64bit') {
      sendBuffer.writeBigUInt64BE(BigInt(args.received), 0);
    }

    if (args.bufferType === '32bit') {
      sendBuffer.writeUInt32BE(args.received, 0);
    }

    if (this.verbose && args.bar) args.bar.tick(data.length);
    if (!args.client?.destroyed && args.client?.writable) {
      args.client.write(sendBuffer);
    }
    args.candidate.emit('downloading', args.fileInfo, args.received, (args.received / args.fileInfo.length) * 100);
    this.emit('downloading', args.fileInfo, args.received, (args.received / args.fileInfo.length) * 100);
  }

  protected static setupProgressBar(len: number): ProgressBar {
    return new ProgressBar(''.padStart(6) + CtcpParser.replace(':roll [:bar] ETA: :eta @ :rate - :percent'), {
      complete: '=',
      incomplete: ' ',
      width: 20,
      total: len,
      clear: true,
      renderThrottle: 100,
    });
  }
}

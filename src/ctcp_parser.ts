/* eslint-disable max-len */
/* eslint-disable no-bitwise */
/* eslint-disable no-param-reassign */
import * as fs from 'fs';
import * as path from 'path';
import AddJob from './addjob';
import type { FileInfo } from './interfaces/fileinfo';
import type { Job } from './interfaces/job';
import { ParamsTimeout } from './timeouthandler';

interface ResumeQueue extends FileInfo {
  nick: string
}

export type ParamsCTCP = ParamsTimeout & {
  /**
   * Download path
   * @default `false`
   * @remark `undefined` or `false` enables piping, see {@link XDCC.download} for example on how to use pipes.
   * @example
   * ```js
   * // absolute path
   * params.path = '/home/user/downloads
   * ```
   * @example
   * ```js
   * // relative path
   * params.path = 'downloads/xdcc' //=> /your/project/folder/downloads/xdcc
   * ```
   * @example
   * ```js
   * // explicitly enable piping
   * params.path = false
   * ```
   * */
  path?: string | false
  /**
   * Block downloads if the bot's name does not match the request
   * @example
   * ```js
   * // with botNameMatch = true
   * xdccJS.download('BOT-A', 1)
   * //=> Only accept files comming from 'BOT-A'
   * ```
   */
   botNameMatch?: boolean
}
export class CtcpParser extends AddJob {
  path: string | boolean;

  botNameMatch: boolean;

  protected resumequeue: ResumeQueue[] = [];

  constructor(params: ParamsCTCP) {
    super(params);
    this.botNameMatch = CtcpParser.is({ name: 'botNameMatch', variable: params.botNameMatch, type: true });
    this.path = CtcpParser.pathCheck(params.path);
    this.on('ctcp request', (resp: { [prop: string]: string }): void => {
      const isDownloadRequest = this.checkBeforeDL(resp, this.candidates[0]);
      if (isDownloadRequest) {
        this.emit('debug', 'xdccJS:: BEFORE_TCP_OK');
        this.emit('prepareDL', isDownloadRequest);
      }
    });
  }

  private static pathCheck(fpath?: ParamsCTCP['path']): string | false {
    if (typeof fpath === 'string') {
      const tmp = path.normalize(fpath);
      if (path.isAbsolute(tmp)) {
        CtcpParser.mkdir(tmp);
        return tmp;
      }
      CtcpParser.mkdir(path.join(path.resolve('./'), fpath));
      return path.join(path.resolve('./'), fpath);
    }
    return false;
  }

  private static mkdir(fpath: string): void {
    if (!fs.existsSync(fpath)) {
      fs.mkdirSync(fpath, {
        recursive: true,
      });
    }
  }

  private SecurityCheck(nick: string, candidate?: Job): boolean {
    if (candidate) {
      nick = nick.toLowerCase();
      candidate.nick = candidate.nick.toLowerCase();
      candidate.cancelNick = nick;
      if (this.botNameMatch) {
        if (nick === candidate.nick) {
          return true;
        }
        return false;
      }
      return true;
    }
    return false;
  }

  private checkBeforeDL(
    resp: { [prop: string]: string },
    candidate: Job,
  ): { fileInfo: FileInfo; candidate: Job } | undefined {
    const fileInfo = this.parseCtcp(resp.message, resp.nick);
    if (fileInfo && this.SecurityCheck(resp.nick, candidate)) {
      this.SetupTimeout({
        candidate,
        eventType: 'error',
        message: `couldn't connect to %yellow%${fileInfo.ip}:${fileInfo.port}`,
        padding: 6,
        delay: this.timeout,
        fileInfo,
      });
      if (fileInfo.type === 'DCC SEND') {
        const isResume = this.checkExistingFiles(fileInfo, candidate, resp);
        if (!isResume) return { fileInfo, candidate };
      }
    }
    return undefined;
  }

  private addToResumeQueue(fileInfo: FileInfo, nick: string): void {
    this.resumequeue.push({
      type: fileInfo.type,
      nick,
      ip: fileInfo.ip,
      length: fileInfo.length,
      token: fileInfo.token,
      position: fileInfo.position,
      port: fileInfo.port,
      filePath: fileInfo.filePath,
      file: fileInfo.file,
    });
  }

  private checkExistingFiles(fileInfo: FileInfo, candidate: Job, resp: { [prop: string]: string })
  : boolean {
    if (fs.existsSync(fileInfo.filePath) && this.path) {
      fileInfo.position = fs.statSync(fileInfo.filePath).size - 8192;
      if (fileInfo.position < 0) {
        fileInfo.position = 0;
      }
      fileInfo.length -= fileInfo.position;
      const quotedFilename = CtcpParser.fileNameWithQuotes(fileInfo.file);
      this.ctcpRequest(resp.nick, 'DCC RESUME', quotedFilename, fileInfo.port, fileInfo.position, fileInfo.token);
      this.addToResumeQueue(fileInfo, resp.nick);
      this.SetupTimeout({
        candidate,
        eventType: 'error',
        message: `couldn't resume download of %cyan%${fileInfo.file}`,
        padding: 6,
        delay: this.timeout,
        fileInfo,
      });
      return true;
    }
    return false;
  }

  private static fileNameWithQuotes(string: string): string {
    if (/\s/.test(string)) {
      return `"${string}"`;
    }
    return string;
  }

  private static ctcpMatch(text: string): RegExpMatchArray {
    const match = text.match(/(?:[^\s"]+|"[^"]*")+/g);
    if (match === null) {
      throw new TypeError(`CTCP : received unexpected msg : ${text}`);
    } else {
      return match;
    }
  }

  private fileInfoBuilder(parts: RegExpMatchArray, resume?: ResumeQueue): FileInfo {
    if (resume) {
      return {
        type: `${parts[0]} ${parts[1]}`,
        file: parts[2].replace(/"/g, ''),
        filePath: resume.filePath,
        ip: resume.ip,
        port: resume.port,
        position: resume.position,
        length: resume.length,
        token: resume.token,
      };
    }
    return {
      type: `${parts[0]} ${parts[1]}`,
      file: parts[2].replace(/"/g, ''),
      filePath: this.path ? path.normalize(`${this.path}/${parts[2].replace(/"/g, '')}`) : 'pipe',
      ip: CtcpParser.uint32ToIP(parts[3]),
      port: parseInt(parts[4], 10),
      position: 0,
      length: parseInt(parts[5], 10),
      token: parts[6],
    };
  }

  protected parseCtcp(text: string, nick: string): FileInfo | undefined {
    const parts = CtcpParser.ctcpMatch(text);
    const type = `${parts[0]} ${parts[1]}`;
    if (type === 'DCC ACCEPT') {
      const resume = this.resumequeue.filter((q) => q.nick === nick);
      this.resumequeue = this.resumequeue.filter((q) => q.nick !== nick);
      if (resume.length) {
        return this.fileInfoBuilder(parts, resume[0]);
      }
    }
    if (type === 'DCC SEND') {
      return this.fileInfoBuilder(parts);
    }
    return undefined;
  }

  protected static uint32ToIP(value: string): string {
    const n = parseInt(value, 10);
    if (Number.isNaN(n)) {
      return value;
    }
    const byte1 = n & 255;
    const byte2 = (n >> 8) & 255;
    const byte3 = (n >> 16) & 255;
    const byte4 = (n >> 24) & 255;
    return `${byte4}.${byte3}.${byte2}.${byte1}`;
  }
}

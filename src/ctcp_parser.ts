import { ParamsTimeout } from './timeouthandler'
import { AddJob } from './addjob'
import { FileInfo } from './interfaces/fileinfo'
import * as path from 'path'
import * as fs from 'fs'
import { Job } from './interfaces/job'

interface ResumeQueue extends FileInfo {
  nick: string
}

export interface ParamsCTCP extends ParamsTimeout {
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
   * Allow/Deny files sent by bot with different name than the one requested.
   * @example
   * ```js
   * // with secure = true
   * xdccJS.download('XDCC|SECURE', 1)
   * //=> Only accept files comming from 'XDCC|SECURE'
   * ```js
   *
   */
  secure?: boolean
}
export class CtcpParser extends AddJob {
  path: string | boolean
  secure: boolean
  protected resumequeue: ResumeQueue[] = []
  constructor(params: ParamsCTCP) {
    super(params)
    this.secure = this._is('secure', params.secure, 'boolean', true)
    this.path = this.pathCheck(params.path)
    this.on('ctcp request', (resp: { [prop: string]: string }): void => {
      const isDownloadRequest = this.checkBeforeDL(resp, this.candidates[0])
      if (isDownloadRequest) {
        this.emit('prepareDL', isDownloadRequest)
      }
    })
  }

  private pathCheck(fpath?: ParamsCTCP['path']): string | false {
    if (typeof fpath === 'string') {
      const tmp = path.normalize(fpath)
      if (path.isAbsolute(tmp)) {
        this.mkdir(tmp)
        return tmp
      } else {
        this.mkdir(path.join(path.resolve('./'), fpath))
        return path.join(path.resolve('./'), fpath)
      }
    } else {
      return false
    }
  }
  private mkdir(path: string): void {
    if (!fs.existsSync(path)) {
      fs.mkdirSync(path, {
        recursive: true,
      })
    }
  }

  private SecurityCheck(nick: string, candidateNick: string): boolean {
    nick = nick.toLowerCase()
    candidateNick = candidateNick.toLowerCase()
    if (this.secure) {
      if (nick === candidateNick) {
        return true
      } else {
        return false
      }
    } else {
      return true
    }
  }

  private checkBeforeDL(
    resp: { [prop: string]: string },
    candidate: Job
  ): { fileInfo: FileInfo; candidate: Job } | void {
    const fileInfo = this.parseCtcp(resp.message, resp.nick)
    let isResume = false
    if (fileInfo && this.SecurityCheck(resp.nick, candidate.nick)) {
      this.__SetupTimeout({
        candidate: candidate,
        eventType: 'error',
        message: `couldn't connect to %yellow%` + fileInfo.ip + ':' + fileInfo.port,
        padding: 6,
        delay: this.timeout,
        fileInfo: fileInfo,
      })
      if (fileInfo.type === 'DCC SEND') {
        isResume = this.checkExistingFiles(fileInfo, candidate, resp)
      }
      if (!isResume) {
        return { fileInfo: fileInfo, candidate: candidate }
      }
    }
  }
  
  private addToResumeQueue(fileInfo: FileInfo, nick: string): void {
    this.resumequeue.push({
      type: fileInfo.type,
      nick: nick,
      ip: fileInfo.ip,
      length: fileInfo.length,
      token: fileInfo.token,
      position: fileInfo.position,
      port: fileInfo.port,
      filePath: fileInfo.filePath,
      file: fileInfo.file,
    })
  }

  private checkExistingFiles(fileInfo: FileInfo, candidate: Job, resp: { [prop: string]: string }): boolean {
    if (fs.existsSync(fileInfo.filePath) && this.path) {
      fileInfo.position = fs.statSync(fileInfo.filePath).size - 8192
      if (fileInfo.position < 0) {
        fileInfo.position = 0
      }
      fileInfo.length = fileInfo.length - fileInfo.position
      const quotedFilename = this.fileNameWithQuotes(fileInfo.file)
      this.ctcpRequest(resp.nick, 'DCC RESUME', quotedFilename, fileInfo.port, fileInfo.position, fileInfo.token)
      this.addToResumeQueue(fileInfo, resp.nick)
      this.__SetupTimeout({
        candidate: candidate,
        eventType: 'error',
        message: `couldn't resume download of %cyan%` + fileInfo.file,
        padding: 6,
        delay: this.timeout,
        fileInfo: fileInfo,
      })
      return true
    } else {
      return false
    }
  }

  private fileNameWithQuotes(string: string): string {
    if (/\s/.test(string)) {
      return `"${string}"`
    } else {
      return string
    }
  }
  private ctcpMatch(text: string): RegExpMatchArray {
    const match = text.match(/(?:[^\s"]+|"[^"]*")+/g)
    if (match === null) {
      throw new TypeError(`CTCP : received unexpected msg : ${text}`)
    } else {
      return match
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
      }
    } else {
      return {
        type: `${parts[0]} ${parts[1]}`,
        file: parts[2].replace(/"/g, ''),
        filePath: this.path ? path.normalize(this.path + '/' + parts[2].replace(/"/g, '')) : 'pipe',
        ip: this.uint32ToIP(parseInt(parts[3], 10)),
        port: parseInt(parts[4], 10),
        position: 0,
        length: parseInt(parts[5], 10),
        token: parseInt(parts[6], 10),
      }
    }
  }

  protected parseCtcp(text: string, nick: string): FileInfo | void {
    const parts = this.ctcpMatch(text)
    const type = `${parts[0]} ${parts[1]}`
    if (type === 'DCC ACCEPT') {
      const resume = this.resumequeue.filter(q => q.nick == nick)
      this.resumequeue = this.resumequeue.filter(q => q.nick !== nick)
      if (resume.length) {
        return this.fileInfoBuilder(parts, resume[0])
      }
    }
    if (type === 'DCC SEND') {
      return this.fileInfoBuilder(parts)
    }
  }

  protected uint32ToIP(n: number): string {
    const byte1 = n & 255,
      byte2 = (n >> 8) & 255,
      byte3 = (n >> 16) & 255,
      byte4 = (n >> 24) & 255
    return byte4 + '.' + byte3 + '.' + byte2 + '.' + byte1
  }
}

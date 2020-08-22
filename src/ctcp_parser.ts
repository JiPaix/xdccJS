import { ParamsTimeout } from './timeouthandler'
import { AddJob } from './addjob'
import { FileInfo } from './interfaces/fileinfo'
import * as path from 'path'
import * as fs from 'fs'
import { Job } from './interfaces/job'

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
  protected resumequeue: {
    nick: string
    ip: string
    length: number
    token: number
  }[] = []
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
  private checkBeforeDL(
    resp: { [prop: string]: string },
    candidate: Job
  ): { fileInfo: FileInfo; candidate: Job } | void {
    const fileInfo = this.parseCtcp(resp.message, resp.nick)
    let canWe = true
    let isResume = false
    if (this.secure) {
      if (resp.nick.toLowerCase() === candidate.nick.toLowerCase()) {
        canWe = true
      } else {
        canWe = false
      }
    }
    if (fileInfo && canWe) {
      this.TOeventMessage(candidate, `couldn't connect to %yellow%` + fileInfo.ip + ':' + fileInfo.port, 6)
        .TOeventType(candidate, 'error')
        .TOstart(candidate, this.timeout, fileInfo)
      if (fileInfo.type === 'DCC SEND') {
        isResume = this.checkExistingFiles(fileInfo, candidate, resp)
      }
      if (!isResume) {
        return { fileInfo: fileInfo, candidate: candidate }
      }
    }
  }

  private checkExistingFiles(
    fileInfo: FileInfo,
    candidate: Job,
    resp: {
      [prop: string]: string
    }
  ): boolean {
    if (fs.existsSync(fileInfo.filePath) && this.path) {
      let position = fs.statSync(fileInfo.filePath).size - 8192
      if (position < 0) {
        position = 0
      }
      const quotedFilename = this.fileNameWithQuotes(fileInfo.file)
      this.ctcpRequest(resp.nick, 'DCC RESUME', quotedFilename, fileInfo.port, position, fileInfo.token)
      this.resumequeue.push({
        nick: resp.nick,
        ip: fileInfo.ip,
        length: fileInfo.length,
        token: fileInfo.token,
      })
      this.TOeventType(candidate, 'error')
        .TOeventMessage(candidate, `couldn't resume download of %cyan%` + fileInfo.file, 6)
        .TOstart(candidate, this.timeout, fileInfo)
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
  protected parseCtcp(text: string, nick: string): FileInfo | void {
    const parts = this.ctcpMatch(text)
    const fileInfo: FileInfo = {
      type: `${parts[0]} ${parts[1]}`,
      file: parts[2].replace(/"/g, ''),
      filePath: this.path ? path.normalize(this.path + '/' + parts[2].replace(/"/g, '')) : 'pipe',
      ip: this.uint32ToIP(parseInt(parts[3], 10)),
      port: parseInt(parts[4], 10),
      length: parseInt(parts[5], 10),
      token: parseInt(parts[6], 10),
    }
    if (parts[1] === 'SEND') {
      return fileInfo
    }
    if (parts[1] === 'ACCEPT') {
      const resume = this.resumequeue.filter(q => q.nick == nick)
      this.resumequeue = this.resumequeue.filter(q => q.nick !== nick)
      fileInfo.port = parseInt(parts[3])
      fileInfo.position = parseInt(parts[4])
      fileInfo.ip = resume[0].ip
      fileInfo.length = resume[0].length
      fileInfo.token = resume[0].token
      return fileInfo
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

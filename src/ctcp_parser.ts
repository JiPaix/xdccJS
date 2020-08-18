import { ParamsTimeout } from './timeouthandler'
import { AddJob } from './addjob'
import { FileInfo } from './interfaces/fileinfo'
import * as path from 'path'
import * as fs from 'fs'
import { Job } from './interfaces/job'

export interface ParamsCTCP extends ParamsTimeout {
  /**
   * @description Download path
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
  path?: string | boolean
}
export class CtcpParser extends AddJob {
  path: string | boolean
  protected resumequeue: {
    nick: string
    ip: string
    length: number
    token: number
  }[] = []
  constructor(params: ParamsCTCP) {
    super(params)
    this.path = this.__pathCheck(params.path)
    this.on('ctcp request', (resp: { [prop: string]: string }): void => {
      const isDownloadRequest = this.__checkBeforeDL(resp, this.candidates[0])
      if (isDownloadRequest) {
        this.emit('prepareDL', isDownloadRequest)
      }
    })
  }

  private __pathCheck(fpath?: ParamsCTCP['path']): string | false {
    if (typeof fpath === 'string') {
      const tmp = path.normalize(fpath)
      if (path.isAbsolute(tmp)) {
        this.__mkdir(tmp)
        return tmp
      } else {
        this.__mkdir(path.join(path.resolve('./'), fpath))
        return path.join(path.resolve('./'), fpath)
      }
    } else {
      return false
    }
  }
  private __mkdir(path: string): void {
    if (!fs.existsSync(path)) {
      fs.mkdirSync(path, {
        recursive: true,
      })
    }
  }
  private __checkBeforeDL(
    resp: { [prop: string]: string },
    candidate: Job
  ): { fileInfo: FileInfo; candidate: Job } | false {
    const fileInfo = this.__parseCtcp(resp.message, resp.nick)
    let isNotResume = true
    if (fileInfo) {
      this.TOeventType(candidate, 'error')
        .TOeventMessage(candidate, `couldn't connect to %yellow%` + fileInfo.ip + ':' + fileInfo.port, 6)
        .TOstart(candidate, 15, fileInfo)
      if (fileInfo.type === 'DCC SEND') {
        if (fs.existsSync(fileInfo.filePath) && this.path) {
          isNotResume = false
          let position = fs.statSync(fileInfo.filePath).size
          if (fileInfo.length === position) {
            position = position - 8192
          }
          const quotedFilename = /\s/.test(fileInfo.file) ? `"${fileInfo.file}"` : fileInfo.file
          this.ctcpRequest(resp.nick, 'DCC RESUME', quotedFilename, fileInfo.port, position, fileInfo.token)
          this.resumequeue.push({
            nick: resp.nick,
            ip: fileInfo.ip,
            length: fileInfo.length,
            token: fileInfo.token,
          })
          this.TOeventType(candidate, 'error')
            .TOeventMessage(candidate, `couldn't resume download of %cyan%` + fileInfo.file, 6)
            .TOstart(candidate, 30, fileInfo)
        }
      }
      if (isNotResume) {
        return { fileInfo: fileInfo, candidate: candidate }
      } else {
        return false
      }
    }
    return false
  }
  protected __parseCtcp(text: string, nick: string): FileInfo | void {
    const parts = text.match(/(?:[^\s"]+|"[^"]*")+/g)
    if (parts === null) {
      throw new TypeError(`CTCP : received unexpected msg : ${text}`)
    }
    const fileInfo: FileInfo = {
      type: `${parts[0]} ${parts[1]}`,
      file: parts[2].replace(/"/g, ''),
      filePath: this.path ? path.normalize(this.path + '/' + parts[2].replace(/"/g, '')) : 'pipe',
      ip: this.__uint32ToIP(parseInt(parts[3], 10)),
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
  protected __uint32ToIP(n: number): string {
    const byte1 = n & 255,
      byte2 = (n >> 8) & 255,
      byte3 = (n >> 16) & 255,
      byte4 = (n >> 24) & 255
    return byte4 + '.' + byte3 + '.' + byte2 + '.' + byte1
  }
}

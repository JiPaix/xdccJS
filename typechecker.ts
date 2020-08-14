import { Params } from './@types/params'
import { checkedParams } from './@types/paramsChecked'
import * as path from 'path'
import * as fs from 'fs'

class TypeChecker {
  paramChecker(params: Params, recheck?: boolean): checkedParams {
    let nick: string
    if (this._is('randomizeNick', params.randomizeNick, 'boolean', true)) {
      nick = this.__nickRandomizer(params.nick ? params.nick : 'xdccJS')
    } else {
      nick = params.nick ? params.nick : this.__nickRandomizer('xdccJS')
    }
    return {
      verbose: this._is('verbose', params.verbose, 'boolean', false),
      host: this._is('host', params.host, 'string'),
      port: this._is('port', params.port, 'number', 6667),
      path: this.__pathCheck(params.path),
      chan: this.__chanCheck(params.chan),
      retry: recheck ? this._is('retry', params.retry, 'number', 1) : params.retry,
      nick: nick,
      passivePort: this._is('passivePort', params.passivePort, 'object', [5001]),
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _is(name: string, variable: any, type: string, def?: any): any {
    if (typeof variable !== type) {
      if (typeof def === 'undefined') {
        const err = new TypeError()
        err.name = err.name + ' [ERR_INVALID_ARG_TYPE]'
        err.message = `unexpected type of '${name}': a ${type} was expected but got '${typeof variable}'`
        throw err
      } else {
        return def
      }
    } else {
      return variable
    }
  }

  private __pathCheck(fpath?: Params['path']): string | false {
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

  public chanHashtag(chan: string): string {
    if (chan.charAt(0) === '#') {
      return chan
    } else {
      return `#${chan}`
    }
  }

  private __chanCheck(chan?: string | string[]): string[] {
    if (typeof chan === 'string') {
      return [this.chanHashtag(chan)]
    } else if (Array.isArray(chan)) {
      return chan
    } else if (!chan) {
      return []
    } else {
      const err = new TypeError()
      err.name = err.name + ' [ERR_INVALID_ARG_TYPE]'
      err.message = `unexpected type of 'chan': 'string | string[] | false' was expected'`
      throw err
    }
  }

  private __nickRandomizer(nick: string): string {
    if (nick.length > 6) {
      nick = nick.substr(0, 6)
    }
    return nick + Math.floor(Math.random() * 999) + 1
  }
  public parsePackets(packets: string | string[] | number | number[]): number[] {
    const range = []
    if (typeof packets === 'string') {
      const packet = packets.replace(/#/gi, '').split(',')
      for (const s of packet) {
        const minmax = s.split('-')
        if (s.includes('-')) {
          for (let i = +minmax[0]; i <= +minmax[1]; i++) {
            range.push(i)
          }
        } else {
          range.push(parseInt(s))
        }
      }
    } else if (Array.isArray(packets)) {
      for (let pack of packets) {
        if (typeof pack === 'number') {
          range.push(pack)
        } else if (typeof pack === 'string') {
          pack = pack.replace(/#/gi, '')
          range.push(parseInt(pack))
        }
      }
    } else if (typeof packets === 'number') {
      range.push(packets)
    }
    return range
      .sort((a, b) => a - b)
      .filter((item, pos, ary) => {
        return !pos || item != ary[pos - 1]
      })
  }
}

export default new TypeChecker()

/* eslint-disable @typescript-eslint/member-delimiter-style */
/* eslint-disable @typescript-eslint/no-this-alias */
/* eslint-disable @typescript-eslint/triple-slash-reference */
/// <reference path="./@types/irc-framework.ts"/>
import { Client } from 'irc-framework'

export class Connect extends Client {
  chan: string[]
  verbose: boolean
  host: string
  connectionTimeout!: NodeJS.Timeout
  constructor(params: ParamsIRC) {
    super()
    let nick = params.nick || 'xdccJS'
    if (params.randomizeNick) {
      nick = this.nickRandomizer(nick)
    }
    this.host = this._is('host', params.host, 'string')
    this._is('port', params.port, 'number', 6667)
    this.chan = this.chanCheck(params.chan)
    this.verbose = this._is('verbose', params.verbose, 'boolean', false)
    this.connect({
      host: params.host,
      port: params.port,
      nick: nick,
    })
    this.onConnect()
  }
  private onConnect(): void {
    this.on('connected', () => {
      clearTimeout(this.connectionTimeout)
      for (const chan of this.chan) {
        this.join(chan)
      }
      this.print(`%success% connected to : %bold%%yellow%${this.host}`)
      this.print('%success% joined: [ %yellow%' + this.chan.join(' ') + '%reset% ]', 2)
      this.emit('ready')
    })
  }
  private nickRandomizer(nick: string): string {
    if (nick) {
      if (nick.length > 6) {
        nick = nick.substr(0, 6)
      } else {
        nick = 'xdccJS'
      }
    }
    return nick + Math.floor(Math.random() * 999) + 1
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected _is(name: string, variable: unknown, type: string, def?: unknown): any {
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
  private chanCheck(chan?: string | string[]): string[] {
    if (typeof chan === 'string') {
      return [this.chanHashtag(chan)]
    } else if (Array.isArray(chan)) {
      const newchan = []
      for (const channel of chan) {
        newchan.push(this.chanHashtag(channel))
      }
      return newchan
    } else if (!chan) {
      return []
    } else {
      const err = new TypeError()
      err.name = err.name + ' [ERR_INVALID_ARG_TYPE]'
      err.message = `unexpected type of 'chan': 'string | string[] | false' was expected'`
      throw err
    }
  }
  private chanHashtag(chan: string): string {
    if (chan.charAt(0) === '#') {
      return chan
    } else {
      return `#${chan}`
    }
  }
  static replace(string: string): string {
    return string
      .replace(/%bold%/g, '\x1b[1m')
      .replace(/%red%/g, '\x1b[31m')
      .replace(/%cyan%/g, '\x1b[36m')
      .replace(/%green%/g, '\x1b[32m')
      .replace(/%magenta%/g, '\x1B[35m')
      .replace(/%blue%/g, '\x1B[34m')
      .replace(/%reset%/g, '\x1b[0m')
      .replace(/%grey%/g, '\x1b[90m')
      .replace(/%yellow%/g, '\x1b[33m')
      .replace(/%RGB(\S*)%/g, '\x1B[38;2;$1m')
      .replace(/%danger%/g, '\x1b[1m\x1b[31m\u0058\x1b[0m')
      .replace(/%info%/g, '\x1b[1m\x1b[36m\u2139\x1b[0m')
      .replace(/%success%/g, '\x1b[1m\x1b[32m\u2713\x1b[0m')
  }
  protected print(string: string, padding = 0): void {
    string = Connect.replace(string) + '\x1b[0m'
    if (padding > 0) {
      string = '\u2937 '.padStart(padding) + string
    }
    if (this.verbose) {
      console.error(string)
    }
  }
}

export interface ParamsIRC {
  /**
   * @description IRC server's hostname
   * @example
   * ```js
   * params.host = 'irc.server.net'
   * ```
   */
  host: string
  /**
   * @description IRC server PORT
   * @default `6667`
   * @example
   * ```js
   * params.port = 6669
   * ```
   */
  port?: number
  /**
   * @description Nickname to use on IRC
   * @default `'xdccJS' + randomInt`
   * @example
   * ```js
   * params.nick = 'JiPaix'
   * ```
   */
  nick?: string
  /**
   * @description Channel(s) to join
   * @remark Hashtags are optional
   * @example
   * ```js
   * params.chan = '#wee'
   * // can also be an array
   * params.chan = ['#wee', '#happy']
   * // in both cases # are optional
   * params.chan = 'weee'
   * params.chan = ['#wee', 'happy']
   * ```
   */
  chan?: string[] | string
  /**
   * @description Add Random numbers to nickname
   * @default: `true`
   * @example
   * ```js
   * params.randomizeNick = false
   * ```
   */
  randomizeNick?: boolean
  /**
   * @description Display information regarding your download in console
   * @default `false`
   * @example
   * ```js
   * params.verbose = true
   * ```
   */
  verbose?: boolean
}

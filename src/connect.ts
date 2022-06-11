/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/member-delimiter-style */
/* eslint-disable @typescript-eslint/no-this-alias */
/* eslint-disable @typescript-eslint/triple-slash-reference */
/// <reference path="./@types/irc-framework.ts"/>
import { Client, MessageEventArgs } from 'irc-framework';

export type ParamsIRC = {
  /**
   * IRC server's hostname
   * @example
   * ```js
   * params.host = 'irc.server.net'
   * ```
   */
  host: string
  /**
   * IRC server PORT
   * @default `6667`
   * @example
   * ```js
   * params.port = 6669
   * ```
   */
  port?: number
  /**
   * Nickname to use on IRC
   * @default `'xdccJS' + randomInt`
   * @example
   * ```js
   * params.nickname = 'JiPaix'
   * ```
   */
  nickname?: string
  /**
   * Channel(s) to join
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
   * Add Random numbers to nickname
   * @default: `true`
   * @example
   * ```js
   * params.randomizeNick = false
   * ```
   */
  randomizeNick?: boolean
  /**
   * Display information regarding your download in console
   * @default `false`
   * @example
   * ```js
   * params.verbose = true
   * ```
   */
  verbose?: boolean
  /**
   * Time before a download is considered timed out
   * @default `30`
   */
  timeout?: number
  /**
   * TLS/SSL
   */
   tls?: {
     /**
      * Enable TLS/SSL
      * @default `false`
      * @example
      * ```js
      * params.tls = { enable: true }
      * ```
      */
     enable: boolean,
     /**
      * (optional) Reject self-signed certificates
      * @default `false`
      * @example
      * ```js
      * params.tls = { enable: true, rejectUnauthorized: true }
      * ```
      */
     rejectUnauthorized?: boolean
   }
   /** NickServ password */
   nickServ?: string
}

export default class Connect extends Client {
  protected chan: string[];

  protected verbose: boolean;

  protected host: string;

  protected nickname: string;

  protected port: number;

  protected connectionTimeout!:ReturnType<typeof setTimeout>;

  protected tls: {
    enable: boolean,
    rejectUnauthorized?: boolean
  };

  protected timeout: number;

  private nickservPassword?: string;

  constructor(params: ParamsIRC) {
    super();
    this.nickname = params.nickname || 'xdccJS';
    if (params.randomizeNick) {
      this.nickname = Connect.nickRandomizer(this.nickname);
    }
    this.host = Connect.is('host', params.host, 'string');
    this.port = Connect.is('port', params.port, 'number', 6667);
    this.verbose = Connect.is('verbose', params.verbose, 'boolean', false);
    this.chan = Connect.chanCheck(params.chan);
    if (params.tls) {
      params.tls.enable = Connect.is('tls.enable', params.tls.enable, 'boolean', false);
      params.tls.rejectUnauthorized = Connect.is('tls.rejectUnauthorized', params.tls.rejectUnauthorized, 'boolean', true);
    } else {
      params.tls = { enable: false, rejectUnauthorized: true };
    }
    this.tls = params.tls;
    this.nickservPassword = params.nickServ;
    this.timeout = Connect.is('timeout', params.timeout, 'number', 30);
    this.onConnect();
    this.connect({
      host: this.host,
      port: this.port,
      nick: this.nickname,
      username: params.nickname || 'xdccJS',
      auto_reconnect_max_wait: 0,
      auto_reconnect_max_retries: 0,
      ssl: this.tls.enable,
      rejectUnauthorized: this.tls.rejectUnauthorized,
      debug: true,
    });
    this.on('debug', (msg) => {
      const lookout = ['socketError() ', 'socketTimeout() '];
      lookout.forEach((err) => {
        if (msg.includes(err)) {
          const index = msg.indexOf(err);
          const { length } = err;
          this.emit('error', new Error(msg.substring(index + length)));
        }
      });
    });
  }

  private onConnect(): void {
    this.on('connected', async () => {
      clearTimeout(this.connectionTimeout);
      this.chan.forEach((chan) => this.join(chan));
      this.print(`%success% connected to : %bold%%yellow%${this.host}`);
      if (this.nickservPassword) {
        try {
          this.print('%info% identifying to %yellow%NickServ', 2);
          await this.nickServAuth();
        } catch (e) {
          if (e instanceof Error) this.print(`%danger% failed: %red%${e.message}`, 2);
          this.quit();
          return;
        }
      }
      this.print(`%success% joined: [ %yellow%${this.chan.join(' ')}%reset% ]`, 2);
      this.emit('ready');
    });
  }

  private nickServAuth():Promise<void> {
    return new Promise((resolve, reject) => {
      let error = '';
      let timeout = setTimeout(() => {});

      const noticeListener = (ev: MessageEventArgs) => {
        if (ev.nick.toLocaleLowerCase() === 'nickserv') {
          if (ev.message.includes('isn\'t registered') || ev.message.includes('incorrect')) {
            // eslint-disable-next-line no-use-before-define
            this.turnOff(noticeListener, rawListener, timeout);
            reject(new Error(`${ev.message}`));
          }
          error = ev.message;
        }
      };

      const rawListener = (ev: { from_server: boolean, line: string}) => {
        if (ev.from_server) {
          const line = ev.line.toLocaleLowerCase();
          if (line.includes('logged in')) {
            this.turnOff(noticeListener, rawListener, timeout);
            resolve();
          }
        }
      };

      this.on('raw', rawListener);
      this.on('notice', noticeListener);

      timeout = setTimeout(() => {
        this.off('raw', rawListener);
        this.off('notice', noticeListener);
        reject(new Error(`%danger% NickServ authentication failed: ${error.length ? error : 'unknown error'}`));
      }, this.timeout * 1000);

      this.say('NickServ', `identify ${this.nickservPassword}`);
    });
  }

  static nickRandomizer(nick: string): string {
    let newNick = nick;
    if (nick) {
      if (nick.length > 6) {
        newNick = nick.substr(0, 6);
      }
    } else {
      newNick = 'xdccJS';
    }
    return newNick + Math.floor(Math.random() * 999) + 1;
  }

  private turnOff(
    // eslint-disable-next-line no-unused-vars
    rawListener: (arg:MessageEventArgs) => void,
    // eslint-disable-next-line no-unused-vars
    noticeListener: (arg: { from_server: boolean, line: string}) => void,
    timeout?: ReturnType<typeof setTimeout>,
  ): void {
    this.off('raw', rawListener);
    this.off('notice', noticeListener);
    if (timeout) clearTimeout(timeout);
  }

  protected static is<TypeOF extends string|number|boolean|object>(name: string, variable: unknown, type: 'string'|'number'|'boolean'|'object', def?: TypeOF): TypeOF {
    // eslint-disable-next-line valid-typeof
    if (typeof variable !== type) {
      if (typeof def === 'undefined') {
        const err = new TypeError();
        err.name += ' [ERR_INVALID_ARG_TYPE]';
        err.message = `unexpected type of '${name}': a ${type} was expected but got '${typeof variable}'`;
        throw err;
      } else {
        return def;
      }
    } else {
      return variable as TypeOF;
    }
  }

  static chanCheck(chan?: string | string[]): string[] {
    if (typeof chan === 'string') {
      return [Connect.chanHashtag(chan)];
    } if (Array.isArray(chan)) {
      return chan.map((ch) => Connect.chanHashtag(ch));
    } if (!chan) {
      return [];
    }
    const err = new TypeError();
    err.name = `${err.name} [ERR_INVALID_ARG_TYPE]`;
    err.message = 'unexpected type of \'chan\': \'string | string[] | false\' was expected\'';
    throw err;
  }

  private static chanHashtag(chan: string): string {
    if (chan.charAt(0) === '#') {
      return chan;
    }
    return `#${chan}`;
  }

  static replace(string: string): string {
    return (
      `${string
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
        .replace(/%danger%/g, '\x1b[1m\x1b[31m[X]\x1b[0m')
        .replace(/%info%/g, '\x1b[1m\x1b[36m[i]\x1b[0m')
        .replace(/%success%/g, '\x1b[1m\x1b[32m>\x1b[0m')}\x1b[0m`
    );
  }

  protected print(string: string, padding = 0): void {
    let newString = Connect.replace(string);
    if (padding > 0) {
      newString = ''.padStart(padding) + newString;
    }
    if (this.verbose) {
      console.error(newString);
    }
  }
}

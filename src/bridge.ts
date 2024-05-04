import Downloader, { ParamsDL } from './downloader';
import humanFileSize from './lib/progress/humanFileSize';
import {version} from '../package.json'

function arraysEqual(a: any[], b: any[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

export default class Bridge extends Downloader {
  constructor(params: Partial<ParamsDL>) {
    const testedParams = Bridge.checkParams(params);
    if(testedParams.randomizeNick) testedParams.nickname = Bridge.nickRandomizer(testedParams.nickname);
    super(testedParams);
    this.nickRandomized = testedParams.randomizeNick
  }

  static checkParams(params: Partial<ParamsDL>):ParamsDL {
    return {
      nickname: Bridge.is({ name: 'nickname', variable: params.nickname || 'xdccJS', type: 'string', condition: (params.nickname || 'xdccJS').length > 3, conditionError: 'nickname must contain at least 4 characters' }),
      username: Bridge.is({ name: 'username', variable: params.username || 'xdccJS', type: 'string', condition: (params.username || 'xdccJS').length > 3, conditionError: 'username must contain at least 4 characters' }),
      path: Bridge.pathCheck(params.path),
      botNameMatch:  Bridge.is({ name: 'botNameMatch', variable: params.botNameMatch, type: true }),
      chan: Bridge.chanCheck(params.chan),
      verbose: Bridge.is({ name: 'verbose', variable: params.verbose, type: false }),
      queue: params.queue,
      host: Bridge.is({ name: 'host', variable: params.host, type: 'string', condition: (typeof params.host !== 'undefined' && params.host.length > 0), conditionError: 'hostname cannot be an empty string' }),
      port: Bridge.is({ name: 'port', variable: params.port, type: 6667, condition: ((params.port || 6667) < 1025) || ((params.port || 6667) > 65535), conditionError: 'must be larger than 1024 and les than or equal 65536' }),
      passivePort: Downloader.is({
        name: 'passivePort',
        variable: params.passivePort,
        type: [5001],
        condition:!(params.passivePort || [5001]).some((number) => number < 1025 || number > 65535),
        conditionError: 'must be larger than 1024 and les than or equal 65536',
      }),
      randomizeNick: Bridge.is({ name: 'randomizeNick', variable: params.randomizeNick, type: false }),
      tls: {
        enable: Bridge.is({ name: 'tls.enable', variable: params.tls?.enable, type: false }),
        rejectUnauthorized: Bridge.is({ name: 'tls.rejectUnauthorized', variable: params.tls?.rejectUnauthorized, type: true }),
      },
      retry: Bridge.is({ name: 'retry', variable: params.retry, type: 1, condition: (params.retry || 1) < 0, conditionError: 'retry must be larger than 0' }),
      throttle: Bridge.is({ name: 'throttle', variable: params.throttle, type: 0, condition: (params.throttle || 1) < 0, conditionError: 'retry must be larger than 0' }),
      timeout: Bridge.is({ name: 'timeout', variable: params.timeout, type: 30, condition: (params.timeout || 1) < 0, conditionError: 'retry must be larger than 0' }),
      gecos: Bridge.is({ name: 'gecos', variable: params.gecos, type: 'xdccJS' }),
      version: Bridge.is({ name: 'version', variable: params.version, type: `xdccJS v${version}`})
    }
  }

  protected set parameters(params:Omit<ParamsDL, 'host'|'port'>) {
    if(this.nickname !== params.nickname) {
      if(params.randomizeNick) params.nickname = Bridge.nickRandomizer(params.nickname);
      this.nickname = params.nickname;
      this.nickRandomized = params.randomizeNick
      this.changeNick(this.nickname);
      this.print(`%success% renamed: [ %yellow%${this.nickname}%reset% ]`, 2);
    }

    if(this.path !== params.path) {
      this.path = params.path;
      this.print(`%success% new download path: %yellow%${this.path}%reset%`, 2);
    }
 
    if (this.parameters.botNameMatch !== params.botNameMatch) {
      this.botNameMatch = params.botNameMatch
      this.print(`%success% botNameMatch: %yellow%${this.botNameMatch ? 'on' : 'off'}%reset%`, 2);
    }

    if(!arraysEqual(params.chan, this.chan)) {
      if(this.chan.length) {
        this.chan.forEach((c) => this.part(c));
        this.print(`%success% parted from: [ %yellow%${this.chan.join(' - ')}%reset% ]`, 2);
      }
      this.chan = params.chan
      this.chan.forEach((chan) => this.join(chan));
      this.print(`%success% joined: [ %yellow%${this.chan.join(' - ')}%reset% ]`, 2);
    }

    if(params.verbose !== this.verbose) {
      this.verbose = params.verbose;
      this.print(`%success% verbose: %yellow%${this.verbose ? 'on' : 'off'}%reset%`, 2);
    }

    if(params.queue && this.queue) {
      if(params.queue.toString() !== this.queue.toString()) {
        this.queue = params.queue;
        this.print(`%success% queue regex: %yellow%${this.queue.toString()}%reset%`, 2);
      }
    } else {
      this.queue = params.queue;
    }

    if(!arraysEqual(params.passivePort, this.passivePort)) {
      this.passivePort = params.passivePort;
      this.print(`%success% passivePort: %yellow%${this.passivePort.join(' - ')}%reset%`, 2);
    }

    if(params.tls?.enable !== this.parameters.tls.enable) {
      this.tls.enable = params.tls.enable;
      this.print(`%success% tls.enable: %yellow%${this.tls.enable ? 'on' : 'off'}%reset%`, 2);
    }

    if(params.tls.rejectUnauthorized !== this.tls.rejectUnauthorized) {
      this.tls.rejectUnauthorized = params.tls.rejectUnauthorized;
      this.print(`%success% tls.rejectUnauthorized: %yellow%${this.tls.rejectUnauthorized ? 'on' : 'off'}%reset%`, 2);
    }

    if(params.retry !== this.retry) {
      this.retry = params.retry;
      this.print(`%success% retry: %yellow%${this.retry}%reset%`, 2);
    }

    if(params.timeout !== this.timeout) {
      this.timeout = params.timeout * 1000;
      this.print(`%success% timeout: %yellow%${this.timeout/1000}s%reset%`, 2);
    }

    if(params.throttle !== this.throttle) {
      this.throttle = params.throttle;
      this.print(`%success% throttle: %yellow%${this.throttle ? 'off' : this.throttle + 'KiB/s'}%reset%`, 2);
    }

    if(params.gecos !== this.gecos) {
      this.gecos = params.gecos;
      this.print(`%success% gecos: %yellow%${this.gecos}%reset%`, 2);
    }

    if(params.version !== this.version) {
      this.version = params.version;
      this.print(`%success% version: %yellow%${this.version}%reset%`, 2);
    }
  }
 

  protected get parameters(): ParamsDL {
      return {
        nickname: this.nickname,
        username: this.username,
        path: this.path,
        botNameMatch: this.botNameMatch,
        chan: this.chan,
        verbose: this.verbose,
        queue: this.queue,
        host: this.host,
        port: this.port,
        passivePort: this.passivePort,
        randomizeNick: this.nickRandomized,
        tls: this.tls,
        retry: this.retry,
        throttle: this.throttle,
        timeout: this.timeout/1000,
        gecos: this.gecos,
        version: this.version,
      }
    }

  config(params: Omit<Partial<ParamsDL>, 'host'|'port'>) {
    if (!params) return this.parameters;
    try {
      const testedParams = Bridge.checkParams({...this.parameters, ...params})
      this.parameters = testedParams;
      return this.parameters;
    } catch(e) {
      if(e instanceof Error) this.print(`%danger% failed to change config: ${e.message}`)
    } finally {
      return this.parameters;
    }
  }
}

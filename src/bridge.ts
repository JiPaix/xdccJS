import Downloader, { ParamsDL } from './downloader';
import humanFileSize from './lib/progress/humanFileSize';

export default class Bridge extends Downloader {
  constructor(params: Partial<ParamsDL>) {
    const testedParams = Bridge.checkParams(params);

    super(testedParams);
  }

  static checkParams(params: Partial<ParamsDL>):ParamsDL {
    const testedParams = params;

    testedParams.nickname = testedParams.nickname || 'xdccJS';
    testedParams.path = Bridge.pathCheck(params.path);
    testedParams.botNameMatch = Bridge.is({ name: 'botNameMatch', variable: params.botNameMatch, type: true });
    testedParams.chan = Bridge.chanCheck(params.chan);
    testedParams.verbose = Bridge.is({ name: 'verbose', variable: params.verbose, type: false });

    if (testedParams.queue && !(testedParams.queue instanceof RegExp)) {
      throw Error('queue must be a RegExp');
    }

    testedParams.host = Bridge.is({
      name: 'host',
      variable: params.host,
      type: 'string',
      condition: (typeof params.host !== 'undefined' && params.host.length > 0),
      conditionError: 'hostname cannot be an empty string',
    });

    testedParams.port = Bridge.is({
      name: 'port',
      variable: params.port,
      type: 6667,
      condition: (params.port || 6667) > 0,
      conditionError: 'port must be larger than 0',
    });

    testedParams.passivePort = testedParams.passivePort || [5001];
    testedParams.passivePort = Downloader.is({
      name: 'passivePort',
      variable: testedParams.passivePort,
      type: [5001],
      condition: !testedParams.passivePort.some((number) => number < 1025 || number > 65535),
      conditionError: 'must be larger than 1024 and les than or equal 65536',
    });

    if (testedParams.tls) {
      testedParams.tls.enable = Bridge.is({ name: 'tls.enable', variable: testedParams.tls.enable, type: false });
      testedParams.tls.rejectUnauthorized = Bridge.is({ name: 'tls.rejectUnauthorized', variable: testedParams.tls.rejectUnauthorized, type: true });
    } else {
      testedParams.tls = { enable: false, rejectUnauthorized: true };
    }

    testedParams.timeout = (Bridge.is({
      name: 'timeout',
      variable: params.timeout,
      type: 30,
      condition: (params.timeout || 30) > 0,
      conditionError: 'timeout must be larger than 0',
    })) * 1000;

    testedParams.retry = (Bridge.is({
      name: 'timeout',
      variable: params.retry || 1,
      type: 1,
      condition: (params.retry || 1) >= 0,
      conditionError: 'retry must be larger than 0',
    }));

    if (testedParams.throttle) {
      testedParams.throttle *= 1024;
      testedParams.throttle = Downloader.is({
        name: 'throttle',
        variable: params.throttle,
        type: 10,
        condition: testedParams.throttle > 0,
        conditionError: 'throttle cannot be equal or less than 0',
      });
    }

    if (typeof testedParams.host !== 'string') {
      const err = new TypeError('hostname is required\'');
      err.name += ' [ERR_INVALID_ARG_TYPE]';
      throw err;
    }
    return testedParams as ParamsDL;
  }

  protected get parameters() {
    const {
      passivePort,
      throttle,
      nickname,
      chan,
      path,
      botNameMatch,
      retry,
      timeout,
      verbose,
      nickRandomized,
      queue,
    } = this;
    return {
      passivePort,
      throttle,
      nickname,
      chan,
      path,
      botNameMatch,
      retry,
      timeout,
      verbose,
      randomizeNick: nickRandomized,
      queue,
    };
  }

  config(params: Partial<{
    passivePort: number[],
    throttle: number,
    nickname: string,
    chan: string[],
    path: string | null,
    botNameMatch: boolean,
    retry: number,
    timeout: number,
    verbose: boolean,
    randomizeNick: boolean,
    queue: RegExp,
  }>) {
    if (!params) return this.parameters;

    if (params.nickname || params.randomizeNick) {
      this.nickname = Bridge.is({
        name: params.nickname || 'xdccJS',
        variable: params.nickname || 'xdccJS',
        type: 'string',
        condition: (params.nickname || 'xdccJS').length > 3,
        conditionError: 'nickname must contain at least 4 characters',
      });
      this.originalNickname = this.nickname;
      this.nickRandomized = params.randomizeNick;

      if (this.nickRandomized) {
        this.nickname = Bridge.nickRandomizer(this.nickname);
      }

      this.changeNick(this.nickname);
      this.print(`%success% renamed: [ %yellow%${this.nickname}%reset% ]`, 2);
    }

    if (params.chan) {
      this.chan.forEach((c) => this.part(c));
      this.print(`%success% parted from: [ %yellow%${this.chan.join(' - ')}%reset% ]`, 2);
      this.chan = Downloader.chanCheck(params.chan);
      this.chan.forEach((chan) => this.join(chan));
      this.print(`%success% joined: [ %yellow%${this.chan.join(' - ')}%reset% ]`, 2);
    }

    if (params.path === null || typeof params.path === 'string') {
      this.path = Downloader.pathCheck(params.path || undefined);
      if (this.path) this.print(`%success% new download path: %yellow%${this.path}%reset%`, 2);
      else this.print('%success% download path: %red%%bold%removed%reset%', 2);
    }

    if (params.botNameMatch !== null) {
      this.botNameMatch = Downloader.is({ name: 'botNameMatch', variable: params.botNameMatch, type: true });
      this.print(`%success% botNameMatch: %yellow%${this.botNameMatch ? 'on' : 'off'}%reset%`, 2);
    }

    if (typeof params.retry === 'number') {
      this.retry = Downloader.is({
        name: 'retry',
        variable: params.retry,
        type: 1,
        condition: params.retry >= 0,
        conditionError: 'retry cannot be lesser than 0',
      });
    }

    if (typeof params.timeout === 'number') {
      this.timeout = Downloader.is({
        name: 'retry',
        variable: params.timeout,
        type: 1,
        condition: params.timeout > 2,
        conditionError: 'timeout cannot be lesser than 3',
      });
    }

    if (params.passivePort) {
      this.passivePort = Downloader.is({
        name: 'passivePort',
        variable: params.passivePort,
        type: [5001],
        condition: !params.passivePort.some((number) => number < 1025 || number > 65535),
        conditionError: 'must be larger than 1024 and les than or equal 65536',
      });
    }

    if (params.throttle && params.throttle > 0) {
      const throttle = params.throttle * 1024;
      this.throttle = Downloader.is({
        name: 'throttle',
        variable: throttle,
        type: 10,
        condition: throttle > 0,
        conditionError: 'throttle cannot be equal or less than 0',
      });
      const transfert = humanFileSize(this.throttle, 0);
      this.print(`%success% throttling at %yellow%${transfert}%reset%`, 2);
    }

    if (typeof params.verbose === 'boolean') {
      this.verbose = Downloader.is({ name: 'verbose', variable: params.verbose, type: 'boolean' });
    }

    if (params.queue) {
      if (params.queue instanceof RegExp) throw Error('queue must be a RegExp');
      this.queue = params.queue;
    }

    return this.parameters;
  }
}

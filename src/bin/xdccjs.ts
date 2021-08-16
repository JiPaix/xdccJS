/* eslint-disable no-param-reassign */
import XDCC, { Params } from '../index';
import BinError from './errorhandler';
import Profiles from './profiles';
import Connect from '../connect';
import { savedParams } from './commander';

export default class XdccJSbin extends Profiles {
  constructor() {
    super();
    const lazyArgs = XdccJSbin.isCopyPasteARGV();
    if (lazyArgs) {
      this.lazy(lazyArgs);
    } else {
      const profileAction = this.profileAction();
      if (!profileAction) this.main();
    }
  }

  private static isLazySyntaxCorrect(match: RegExpExecArray): boolean {
    if (match[1].toLowerCase() === 'msg' && match[3].toLowerCase() === 'xdcc' && match[4].toLowerCase() === 'send') {
      return true;
    }
    return false;
  }

  private lazy(match: RegExpExecArray): void {
    if (!this.defaultProfile) {
      throw new BinError('%info% You need to setup a profile first in order to use copy paste method');
    } else if (XdccJSbin.isLazySyntaxCorrect(match)) {
      const [, , bot, , , download] = match;
      this.program.bot = bot;
      this.program.download = [download];
      this.downloadWith(this.defaultProfile);
    } else {
      throw new BinError(
        '%danger% Wrong format, try (with double quotes): %grey%"/MSG My|BOT xdcc send 23, 25, 50-55"',
      );
    }
  }

  private static isCopyPasteARGV(): RegExpExecArray | void {
    const match = /\/(msg|MSG) (.*) (xdcc|XDCC) (send|SEND) (.*)$/
      .exec(process.argv.join(' '));
    if (match) {
      return match;
    }
    return undefined;
  }

  private main(): void {
    if (this.defaultProfile) return this.downloadWith(this.defaultProfile);
    return this.downloadWith(this.xdccBINOPTS());
  }

  private writeMSG(time: number): void {
    if (!this.program.quiet) {
      process.stderr.cursorTo(1);
      process.stderr.write(Connect.replace(`%info% waiting: ${time}`));
      process.stderr.clearLine(1);
    }
  }

  private clearMSG(): void {
    if (!this.program.quiet) {
      process.stderr.clearLine(0);
      process.stderr.cursorTo(0);
    }
  }

  private waitMessage(time: number, xdccJS: XDCC, bot: string, download: string): void {
    const start = time;
    const inter = setInterval(async () => {
      time -= 1;
      if (start > 0) {
        this.writeMSG(time);
      }
      if (time <= 0) {
        if (start > 0) {
          this.clearMSG();
        }
        const job = await xdccJS.download(bot, download);
        if (!this.program.path) {
          job.on('pipe', (stream) => {
            stream.pipe(process.stdout);
          });
        }
        clearInterval(inter);
      }
    }, 1000);
  }

  private downloadWith(opts: [Params, savedParams]): void {
    if (!this.hasProfileAction()) {
      if (!this.program.bot && !opts[1].bot) {
        throw new BinError('%danger% Missing bot name, eg. %grey%--bot "XDCC|BOT"');
      }
      if (!this.program.download) {
        throw new BinError('%danger% You must specify a packet number to download, eg. %grey%--download 1, 3, 55-60');
      }
      const download = this.program.download.join('');
      const bot = this.program.bot ? this.program.bot : opts[1].bot;
      const wait = opts[1].wait || 0;
      if (!bot) throw new Error('Control flow error: downloadwith()');
      const xdccJS = new XDCC(opts[0])
        .on('ready', () => {
          this.waitMessage(wait, xdccJS, bot, download);
        })
        .on('can-quit', () => {
          xdccJS.quit();
        })
        .on('error', (e) => {
          if (!e) {
            console.error(new BinError('%danger% Unknown error'));
            return;
          }
          // trick to avoid "hard" throws
          const error = new BinError(`%danger% ${e.message}`);
          console.error(error.message);
        });
    }
  }
}

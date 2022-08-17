import commander, { program } from 'commander';
import * as path from 'path';
import { version } from '../version.json';
import BinError from './errorhandler';
import { Params } from '..';
import Connect from '../connect';

export type savedParams = {
  wait?: number
  bot?: string
}
export interface InterfaceCLI extends commander.Command {

  host?: string
  port?: number
  tls?: boolean
  insecure?: boolean
  bot?: string
  download?: string[]
  path?: string
  nickname?: string
  channel?: string
  retry?: number
  passivePort?: number
  randomize?: boolean
  botNameMatch?: boolean
  queue?: RegExp
  timeout?: number
  wait?: number
  nickserv?: string
  quiet?: boolean
  saveProfile?: string
  deleteProfile?: string
  setProfile?: string
  listProfile?: string
}

export class BaseCommander {
  program: InterfaceCLI;

  constructor() {
    this.program = program;
    this.parseProgram();
  }

  private parseProgram(): void {
    this.program
      .storeOptionsAsProperties()
      .name('xdccJS')
      .version(version)
      .option('-h, --host <server>', 'IRC server hostname - \x1b[1mrequired\x1b[0m')
      .option('--port <number>', 'IRC server port - \x1b[1mdefault: 6667\x1b[0m', (k:string) => BaseCommander.parseIfNotInt(k, 'port'))
      .option('-n, --nickname <nickname>', 'Your nickname - \x1b[1mdefault: xdccJS\x1b[0m')
      .option('--no-randomize', 'Disable nickname randomization - \x1b[1mdefault: randomize\x1b[0m')
      .option('-c, --channel <chans...>', 'Channel(s) to join - \x1b[1moptional\x1b[0m')
      .option('-p, --path <path>', 'Download path - \x1b[1moptional\x1b[0m', path.normalize)
      .option('-b, --bot <botname>', 'XDCC bot nickname - \x1b[1mrequired\x1b[0m')
      .option('-d, --download <packs...>', 'Packs to download - \x1b[1mrequired\x1b[0m')
      .option('--nickserv <password>', 'Authenticate to NickServ - \x1b[1mdefault: disabled\x1b[0m')
      .option('--passive-port <number>', 'Port to use for passive dccs - \x1b[1moptional\x1b[0m', (k:string) => BaseCommander.parseIfNotInt(k, 'passive-port'))
      .option('-r, --retry <number>', 'Number of attempts before skipping pack - \x1b[1moptional\x1b[0m', (k:string) => BaseCommander.parseIfNotInt(k, 'retry'))
      .option('-t --timeout <number>', 'Time in seconds before a download is considered timed out - \x1b[1moptional\x1b[0m', (k:string) => BaseCommander.parseIfNotInt(k, 'timeout'))
      .option(
        '-w, --wait <number>',
        'Time to wait before sending download request - \x1b[1moptional\x1b[0m',
        (k:string) => BaseCommander.parseIfNotInt(k, 'wait'),
      )
      .option('--no-bot-name-match', 'Allow downloads from bot with nickname that doesn\'t match the request - \x1b[1moptional\x1b[0m')
      .option('--queue <RegExp>', 'Regex to determine if the bot queued the request - \x1b[1moptional\x1b[0m', BaseCommander.toRegex)
      .option('--tls', 'enable SSL/TLS - \x1b[1moptional\x1b[0m')
      .option('--no-insecure', 'Reject self-signed SSL/TLS certificates - \x1b[1moptional\x1b[0m')
      .option('--save-profile <string>', 'save current options as a profile - \x1b[1moptional\x1b[0m')
      .option('--delete-profile <string>', 'delete profile - \x1b[1moptional\x1b[0m')
      .option('--set-profile <string>', 'set profile as default - \x1b[1moptional\x1b[0m')
      .option('--list-profile', 'list all available profiles - \x1b[1moptional\x1b[0m')
      .option('-q, --quiet', 'Disable console output - \x1b[1moptional\x1b[0m')
      .parse();
  }

  private static parseIfNotInt(numstring: string, optName:string): number {
    const number = parseInt(numstring, 10);
    if (Number.isNaN(number)) throw new BinError(`%danger% option --${optName} must be a number`);
    return number;
  }

  private static toRegex(string: string): RegExp {
    // from https://stackoverflow.com/a/874742
    const flags = string.replace(/.*\/([gimy]*)$/, '$1');
    const pattern = string.replace(new RegExp(`^/(.*?)/${flags}$`), '$1');
    try {
      return new RegExp(pattern, flags);
    } catch (e) {
      throw new BinError('%danger% Invalid regex, eg. %grey%--queue /you\\shave\\sbeen\\squeued/gi');
    }
  }

  protected log(string: string, pad = 0): void {
    if (!this.program.quiet) console.error(''.padStart(pad) + Connect.replace(string));
  }

  protected xdccJSOPTS(): Params {
    if (!this.program.host) {
      if (this.program.saveProfile) throw new BinError('%danger% Saved profile must at least contain a host');
      throw new BinError('%danger% a hostname is required, eg. %grey%--host irc.server.net');
    }
    if (this.program.nickserv) {
      try {
        Connect.identifyCheck(this.program.nickserv);
      } catch (e) {
        if (e instanceof TypeError) {
          throw new BinError('%danger% option \'nickserv\' should only contain the password (no spaces), eg. %grey%--nickserv complex_password');
        }
      }
    }
    return {
      host: this.program.host,
      port: this.program.port,
      tls: {
        enable: this.program.tls || false,
        rejectUnauthorized: !this.program.insecure,
      },
      nickname: this.program.nickname,
      chan: this.program.channel,
      path: this.program.path,
      retry: this.program.retry,
      randomizeNick: this.program.randomize,
      passivePort: [this.program.passivePort || 5001],
      verbose: !this.program.quiet,
      botNameMatch: !this.program.botNameMatch,
      queue: this.program.queue,
      timeout: this.program.timeout,
      nickServ: this.program.nickserv,
    };
  }

  protected hasProfileAction():boolean {
    if (this.program.deleteProfile) return true;
    if (this.program.saveProfile) return true;
    if (this.program.deleteProfile) return true;
    if (this.program.listProfile) return true;
    return false;
  }

  protected xdccBINOPTS(isSaveProfile = false): [Params, savedParams] {
    if (isSaveProfile) {
      return [this.xdccJSOPTS(), { wait: this.program.wait, bot: this.program.bot }];
    }
    if (!this.program.bot && !this.hasProfileAction()) {
      throw new BinError('%danger% Missing bot name, eg. %grey%--bot "XDCC|BOT"');
    }
    return [this.xdccJSOPTS(), { wait: this.program.wait, bot: this.program.bot }];
  }
}

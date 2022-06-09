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
  noInsecure?: boolean
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
  wait?: number
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
      .option('-h, --host <server>', 'IRC server hostname')
      .option('--port <number>', 'IRC server port', BaseCommander.parseIfNotInt)
      .option('--tls', 'enable SSL/TLS')
      .option('--no-insecure', 'Reject self-signed SSL/TLS certificates')
      .option('-b, --bot <botname>', 'xdcc bot nickname')
      .option('-d, --download <packs...>', 'pack number(s) to download')
      .option('-p, --path <path>', 'download path', path.normalize)
      .option('-n, --nickname <nickname>', 'Your IRC nickname')
      .option('-c, --channel [chan...]', 'channel(s) to join (without #)')
      .option('-r, --retry <number>', 'number of attempts before skipping pack', BaseCommander.parseIfNotInt)
      .option('-q, --quiet', 'disable console output')
      .option('--passive-port <number>', 'port used for passive dccs', BaseCommander.parseIfNotInt)
      .option('--no-randomize', 'Disable nickname randomization')
      .option(
        '-w, --wait [number]',
        'wait time (in seconds) in channel(s) before sending download request',
        BaseCommander.parseIfNotInt,
        0,
      )
      .option('--bot-name-match', 'Block downloads if bot name does not match')
      .option('--queue <string>', 'Regex to determine if the bot queued the request', BaseCommander.toRegex)
      .option('--save-profile <string>', 'save current options as a profile')
      .option('--delete-profile <string>', 'delete profile')
      .option('--set-profile <string>', 'set profile as default')
      .option('--list-profile', 'list all available profiles')
      .parse();
  }

  private static parseIfNotInt(numstring: string): number {
    const number = parseInt(numstring, 10);
    if (Number.isNaN(number)) throw new BinError('%danger% option --port must be a number');
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
    return {
      host: this.program.host,
      port: this.program.port,
      tls: {
        enable: this.program.tls || false,
        rejectUnauthorized: this.program.noInsecure || false,
      },
      nickname: this.program.nickname,
      chan: this.program.channel,
      path: this.program.path,
      retry: this.program.retry,
      randomizeNick: this.program.randomize,
      passivePort: [this.program.passivePort || 5001],
      verbose: !this.program.quiet,
      botNameMatch: this.program.botNameMatch,
      queue: this.program.queue,
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

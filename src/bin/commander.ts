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
  bot?: string
  download?: string[]
  path?: string
  nickname?: string
  channel?: string
  retry?: number
  passivePort?: number
  randomize?: boolean
  secure?: boolean
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
      .option('--port <number>', 'IRC server port')
      .option('--tls', 'enable SSL/TLS')
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
      .option('--no-secure', 'Allow files sent by bot with different name than the one requested')
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
      tls: this.program.tls,
      nickname: this.program.nickname,
      chan: this.program.channel,
      path: this.program.path,
      retry: this.program.retry,
      randomizeNick: this.program.randomize,
      passivePort: [this.program.passivePort || 5001],
      verbose: !this.program.quiet,
      secure: this.program.secure,
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

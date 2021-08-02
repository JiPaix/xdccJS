import commander, { program } from 'commander'
import { version } from '../version.json'
import { BinError } from './errorhandler'
import * as path from 'path'
import { Params } from '..'
import { Connect } from '../connect'

export type savedParams = {
  wait?: number
  bot?: string
}
export interface InterfaceCLI extends commander.Command {

  host?: string
  port?: number
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
  program: InterfaceCLI
  constructor() {

    this.program = program
    this.parseProgram()
  }
  private parseProgram(): void {
    this.program
      .storeOptionsAsProperties()
      .name('xdccJS')
      .version(version)
      .option('-h, --host <server>', 'IRC server hostname')
      .option('--port <number>', 'IRC server port')
      .option('-b, --bot <botname>', 'xdcc bot nickname')
      .option('-d, --download <packs...>', 'pack number(s) to download')
      .option('-p, --path <path>', 'download path', path.normalize)
      .option('-n, --nickname <nickname>', 'Your IRC nickname')
      .option('-c, --channel [chan...]', 'channel(s) to join (without #)')
      .option('-r, --retry <number>', 'number of attempts before skipping pack', this.parseIfNotInt)
      .option('-q, --quiet', 'disable console output')
      .option('--passive-port <number>', 'port used for passive dccs', this.parseIfNotInt)
      .option('--no-randomize', 'Disable nickname randomization')
      .option(
        '-w, --wait [number]',
        'wait time (in seconds) in channel(s) before sending download request',
        this.parseIfNotInt,
        0
      )
      .option('--no-secure', 'Allow files sent by bot with different name than the one requested')
      .option('--save-profile [string]', 'save current options as a profile')
      .option('--delete-profile [string]', 'delete profile')
      .option('--set-profile [string]', 'set profile as default')
      .option('--list-profile', 'list all available profiles')
      .parse()
  }
  private parseIfNotInt(numstring: string): number {
    const number = parseInt(numstring)
    if(isNaN(number)) throw new BinError(`%danger% option --port must ne a number`)
    return number
  }
  protected log(string: string, pad = 0): void {
    console.error(''.padStart(pad) + Connect.replace(string))
  }
  protected xdccJSOPTS(): Params {
    if (typeof this.program.host === 'undefined') {
      throw new BinError('%danger% No server')
    }
    return {
      host: this.program.host,
      port: this.program.port,
      nickname: this.program.nickname,
      chan: this.program.channel,
      path: this.program.path,
      retry: this.program.retry,
      randomizeNick: this.program.randomize,
      passivePort: [this.program.passivePort || 5001],
      verbose: !this.program.quiet,
      secure: this.program.secure,
    }
  }

  protected xdccBINOPTS(isSaveProfile = false): [Params, savedParams] {
    if (isSaveProfile) {
      return [this.xdccJSOPTS(), { wait: this.program.wait, bot: this.program.bot }]
    }
    if (!this.program.bot && !this.program.saveProfile) {
      throw new BinError('%danger% Missing bot name, eg. %grey%--bot "XDCC|BOT"')
    }
    return [this.xdccJSOPTS(), { wait: this.program.wait, bot: this.program.bot }]
  }
}

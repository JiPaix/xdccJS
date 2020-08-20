import commander, { program } from 'commander'
import * as path from 'path'
import * as fs from 'fs'
import { version } from '../package.json'
import XDCC, { Params } from '../index'
import { BinError } from './errorhandler'
import { Connect } from '../connect'

type savedParams = {
  wait: number
  bot: string
}

interface InterfaceCLI extends commander.Command {
  server?: string
  port?: number
  bot?: string
  download?: string[]
  path?: string
  username?: string
  channel?: string
  retry?: number
  reversePort?: number
  noRandomize?: string
  saveProfile?: string
  deleteProfile?: string
  setProfile?: string
  listProfile?: string
}

class Startup {
  program: InterfaceCLI
  profilePath: string
  defaultProfile: string | undefined
  defaultProfilePath: string
  availableProfiles: string[]
  constructor() {
    this.program = program
    this.profilePath = path.join(__dirname, '/profiles/')
    this.defaultProfilePath = path.join(__dirname, '/default.json')
    this.availableProfiles = this.initFolder()
    this.defaultProfile = JSON.parse(fs.readFileSync(this.defaultProfilePath).toString()).profile
    if (this.defaultProfile) {
      console.error('loaded default profile ' + this.defaultProfile)
    }
  }

  private validateOpts(opts: [Params, savedParams]): [Params, savedParams] {
    if (typeof this.program.server !== 'undefined') {
      opts[0].host = this.program.server
    }
    if (typeof this.program.port !== 'undefined') {
      opts[0].port = this.program.port
    }
    if (typeof this.program.path !== 'undefined') {
      opts[0].path = this.program.path
    }
    if (typeof this.program.username !== 'undefined') {
      opts[0].nick = this.program.username
    }
    if (typeof this.program.channel !== 'undefined') {
      opts[0].chan = this.program.channel
    }
    if (typeof this.program.retry !== 'undefined') {
      opts[0].retry = this.program.retry
    }
    if (typeof this.program.reversePort !== 'undefined') {
      opts[0].passivePort = [this.program.reversePort]
    }
    if (typeof this.program.noRandomize !== 'undefined') {
      opts[0].randomizeNick = this.program.noRandomize ? false : true
    }
    if (typeof this.program.bot !== 'undefined') {
      opts[1].bot = this.program.bot
    }
    if (typeof this.program.wait !== 'undefined') {
      opts[1].wait = this.program.wait
    }
    if (typeof opts[1].wait === 'undefined') {
      opts[1].wait = 0
    }
    if (typeof opts[1].bot === 'undefined') {
      throw new BinError('need bot name')
    }
    return opts
  }

  public main(): void {
    this.parseProgram()
    if (this.isProfileSetting()) {
      this.checkProfile()
    } else {
      const opts = this.loadDefaultProfile()
      if (opts) {
        const validOpts = this.validateOpts(opts)
        const newOpts: Params = {
          host: validOpts[0].host,
          port: validOpts[0].port,
          nick: validOpts[0].nick,
          chan: validOpts[0].chan,
          path: validOpts[0].path,
          retry: validOpts[0].retry,
          randomizeNick: validOpts[0].randomizeNick,
          passivePort: validOpts[0].passivePort,
          verbose: true,
        }
        this.downloadWith([newOpts, validOpts[1]])
      } else {
        if (typeof this.program.server === 'undefined') {
          throw new BinError(`%danger% A server must be specified`)
        }
        const opts: Params = {
          host: this.program.server,
          port: this.program.port,
          nick: this.program.username,
          chan: this.program.channel,
          path: this.program.path,
          retry: this.program.retry,
          randomizeNick: this.program.noRandomize ? false : true,
          passivePort: [this.program.reversePort || 5001],
          verbose: true,
        }
        if (typeof this.program.bot === 'undefined') {
          throw new BinError('need a bot name')
        }
        const moreOpts: savedParams = {
          wait: this.program.wait,
          bot: this.program.bot,
        }
        this.downloadWith([opts, moreOpts])
      }
    }
  }
  private downloadWith(opts: [Params, savedParams]): void {
    if (typeof this.program.download === 'undefined') {
      throw new BinError('must specify a packet number to download')
    }
    const download = this.program.download.join('')
    console.log(download)
    const xdccJS = new XDCC(opts[0])
    if (typeof this.program.bot !== 'undefined' || typeof opts[1].bot !== 'undefined') {
      const bot: string = this.program.bot ? this.program.bot : opts[1].bot
      xdccJS.on('ready', () => {
        setTimeout(() => {
          xdccJS.download(bot, download)
        }, opts[1].wait || 0)
      })
      xdccJS.on('can-quit', () => {
        xdccJS.quit()
      })
    }
  }

  private loadDefaultProfile(): [Params, savedParams] | undefined {
    if (this.defaultProfile) {
      const lookup = path.join(this.profilePath, this.defaultProfile + '.json')
      if (fs.existsSync(lookup)) {
        const string = fs.readFileSync(lookup).toString()
        const json = JSON.parse(string)
        return json
      }
    }
  }

  private checkProfile(): void {
    if (this.program.saveProfile) {
      this.saveProfile()
    } else if (this.program.setProfile) {
      this.setProfile(this.program.setProfile)
    } else if (this.program.deleteProfile) {
      this.deleteProfile(this.program.deleteProfile)
    } else if (this.program.listProfile) {
      this.listProfile()
    }
  }

  private listProfile(): void {
    this.availableProfiles = this.initFolder()
    const msg = Connect.replace('%info% List of Profiles :')
    console.error(msg)
    for (let profile of this.availableProfiles) {
      profile = profile.replace('.json', '')
      if (profile == this.defaultProfile) {
        const pmsg = Connect.replace(`${profile} %grey%*default`)
        console.error(''.padStart(2) + pmsg)
      }
    }
  }

  private deleteProfile(profile: string): void {
    const search = profile + '.json'
    if (this.availableProfiles.includes(search)) {
      fs.unlinkSync(path.join(this.profilePath, search))
      this.availableProfiles = this.initFolder()
    } else {
      throw new BinError(`Profile ${profile} doesn't exist`)
    }
  }

  private setProfile(profile: string): void {
    const search = profile + '.json'
    if (this.availableProfiles.includes(search)) {
      fs.writeFileSync(this.defaultProfilePath, JSON.stringify({ profile: this.program.setProfile }))
      throw new BinError(`Set ${profile} as new default profile`)
    } else {
      throw new BinError(`Profile ${profile} doesn't exist`)
    }
  }
  private saveProfile(): void {
    if (typeof this.program.server === 'undefined') {
      throw new BinError('Profile needs servers')
    }
    const opts: Params = {
      host: this.program.server,
      port: this.program.port,
      nick: this.program.username,
      chan: this.program.channel,
      path: this.program.path,
      retry: this.program.retry,
      randomizeNick: this.program.noRandomize ? false : true,
      passivePort: [this.program.reversePort || 5001],
      verbose: true,
    }
    const xdccJS = new XDCC(opts)
    xdccJS.quit()
    const filePath = path.join(this.profilePath, this.program.saveProfile + '.json')
    fs.writeFileSync(filePath, JSON.stringify([opts, { wait: this.program.wait, bot: this.program.bot }]))
    fs.writeFileSync(this.defaultProfilePath, JSON.stringify({ profile: this.program.saveProfile }))
    this.availableProfiles = this.initFolder()
    throw new BinError(`set ${this.program.saveProfile} as new default profile`)
  }

  private initFolder(): string[] {
    if (!fs.existsSync(this.profilePath)) {
      fs.mkdirSync(this.profilePath, { recursive: true })
    }
    if (!fs.existsSync(this.defaultProfilePath)) {
      fs.writeFileSync(this.defaultProfilePath, JSON.stringify({ profile: undefined }))
    }
    return fs.readdirSync(this.profilePath).filter(file => file.endsWith('.json'))
  }
  private parseProgram(): void {
    this.program
      .name('xdccJS')
      .version(version)
      .option('-s, --server <server>', 'irc server address')
      .option('--port <number>', 'irc server port', this.parseIfNotInt)
      .option('-b, --bot <botname>', 'xdcc bot nickname')
      .option('-d, --download <packs...>', 'pack number(s) to download')
      .option('-p, --path <path>', 'download path', path.normalize)
      .option('-u, --username <username>', 'irc username', 'xdccJS')
      .option('-c, --channel [chan...]', 'channel to join (without #)')
      .option('-r, --retry <number>', 'number of attempts before skipping pack', this.parseIfNotInt)
      .option('--reverse-port <number>', 'port used for passive dccs', this.parseIfNotInt)
      .option('--no-randomize', 'removes random numbers to nickname')
      .option(
        '-w, --wait [number]',
        'wait time (in seconds) in channel(s) before sending download request',
        this.parseIfNotInt,
        0
      )
      .option('--save-profile [string]', 'save current options as a profile')
      .option('--delete-profile [string]', 'delete profile')
      .option('--set-profile [string]', 'set profile as default')
      .option('--list-profile', 'list all available profiles')
      .parse()
  }
  private parseIfNotInt(numstring: string | number): number {
    if (typeof numstring === 'string') {
      const res = parseInt(numstring)
      if (isNaN(res)) {
        throw new BinError('WRONG NUMBER')
      }
      return res
    }
    return numstring
  }
  private isProfileSetting(): boolean {
    const condition =
      this.program.saveProfile || this.program.deleteProfile || this.program.setProfile || this.program.listProfile
    if (condition) {
      return true
    } else {
      return false
    }
  }
}

if (typeof process.argv[2] !== 'undefined') {
  console.log(process.argv)
  if (process.argv[2].toLowerCase().includes('/msg')) {
    console.log('LAZY AS FUCK')
  }
}
process.argv[2] = '--server'
process.argv[3] = 'irc.rizon.net'
process.argv[4] = '--bot'
process.argv[5] = 'jipai'
process.argv[6] = '--download'
process.argv[7] = '1'

const PG = new Startup()
try {
  PG.main()
} catch (e) {
  if (e instanceof BinError) {
    console.error(e.message)
  } else {
    throw e
  }
}

import * as path from 'path'
import * as fs from 'fs'
import commander from 'commander'
import TypeChecker from './typechecker'
import print from '../../helpers/printer'

class Profiler {
  parameters: string[]
  dir: string
  default: string
  constructor() {
    this.parameters = ['saveProfile', 'setProfile', 'deleteProfile', 'listProfile']
    this.dir = path.normalize(__dirname + '/profiles/')
    this.default = path.normalize(__dirname + '/default')
  }
  InitFolder(): void {
    if (!fs.existsSync(this.dir)) {
      fs.mkdirSync(this.dir)
    }
    if (!fs.existsSync(this.default)) {
      fs.writeFileSync(this.default, '')
    }
  }
  FuseFileAndEnv(program: commander.Command, json: { [x: string]: unknown }): void {
    for (const key in json) {
      if (Object.prototype.hasOwnProperty.call(json, key)) {
        if (!this.parameters.includes(key) && key !== 'version') {
          program[key] = json[key]
        }
      }
    }
  }

  LoadDefaultProfile(program: commander.Command): void {
    this.InitFolder()
    const defaultProfileName = fs.readFileSync(this.default).toString()
    if (defaultProfileName.length && this.existProfile(defaultProfileName)) {
      const file = fs.readFileSync(path.resolve(this.dir, defaultProfileName))
      const json = JSON.parse(file.toString())
      this.FuseFileAndEnv(program, json)
      print('%info% loaded default profile %yellow%' + defaultProfileName)
    }
  }
  ProcessProfile(program: commander.Command): void {
    if (this.whichProfile(program) === 'save') {
      this.saveProfile(program)
    } else if (this.whichProfile(program) === 'del') {
      this.deleteProfile(program)
    } else if (this.whichProfile(program) === 'set') {
      this.setProfile(program)
    } else if (this.whichProfile(program) === 'list') {
      this.showProfiles()
    }
  }

  saveProfile(program: commander.Command): void {
    if (this.argsMustbeNamed(program, 'save')) {
      if (this.existProfile(program.saveProfile)) {
        print(
          '%danger% profile %yellow%' +
            program.saveProfile +
            '%reset% already exists, use %grey%--delete-profile ' +
            program.saveProfile +
            '%reset% first'
        )
      } else {
        if (program.server) {
          const json = JSON.stringify(program.opts())
          fs.writeFileSync(__dirname + '/profiles/' + program.saveProfile, json)
          fs.writeFileSync(__dirname + '/default', program.saveProfile)
          print('%info% saved %yellow%' + program.saveProfile + '%reset% and set it as default')
        } else {
          TypeChecker.missingArg('-s, --server <server>', '-s irc.server.net')
        }
      }
    }
  }

  setProfile(program: commander.Command): void {
    if (this.argsMustbeNamed(program, 'set')) {
      if (this.existProfile(program.setProfile)) {
        fs.writeFileSync(this.default, program.setProfile)
      } else {
        print('%danger% profile %yellow%' + program.setProfile + "%reset% doesn't exist")
        this.showProfiles()
      }
    }
  }

  deleteProfile(program: commander.Command): void {
    if (this.argsMustbeNamed(program, 'delete')) {
      const profilePath = path.resolve(this.dir, program.deleteProfile)
      const profileExists = fs.existsSync(profilePath)
      if (profileExists) {
        const defaultProfile = fs.readFileSync(this.default).toString()
        if (defaultProfile == program.deleteProfile) {
          fs.unlinkSync(this.default)
          print('%info% deleted %yellow%' + program.deleteProfile)
        }
      } else {
        print('%danger% profile %yellow%' + program.setProfile + "%reset% doesn't exists")
        this.showProfiles()
      }
    }
  }

  argsMustbeNamed(program: commander.Command, type: string): boolean {
    if (typeof program[type + 'Profile'] === 'string') {
      return true
    } else {
      print('%danger% presets must be named, eg. %grey%--' + type + '-profile john')
      return false
    }
  }
  showProfiles(): void {
    const profiles = fs.readdirSync(this.dir)
    const defaultProfile = fs.readFileSync(this.default).toString()
    for (const preset of profiles) {
      if (preset == defaultProfile) {
        print('- %cyan%' + preset + '%reset% %grey%* default', 2)
      } else {
        print('- %cyan%' + preset, 2)
      }
    }
  }
  whichProfile(program: commander.Command): 'save' | 'set' | 'del' | 'list' | undefined {
    if (program.saveProfile) {
      return 'save'
    } else if (program.setProfile) {
      return 'set'
    } else if (program.deleteProfile) {
      return 'del'
    } else if (program.listProfile) {
      return 'list'
    }
  }

  isProfile(program: commander.Command, key?: string): boolean {
    if (key) {
      return this.parameters.includes(key)
    } else {
      const args = Object.keys(program.opts())
      for (const arg of args) {
        if (program[arg]) {
          if (this.parameters.includes(arg)) {
            return true
          }
        }
      }
      return false
    }
  }

  existProfile(profileName: string): boolean {
    const exist = fs.existsSync(path.resolve(this.dir, profileName))
    if (exist) {
      return true
    }
    return false
  }
}

export default new Profiler()

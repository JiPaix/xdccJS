import * as path from 'path'
import * as fs from 'fs'
import * as colors from 'colors/safe'
import commander from 'commander'

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
  LoadDefaultProfile(program: commander.Command): void {
    this.InitFolder()
    const defaultProfileName = fs.readFileSync(this.default).toString()
    if (defaultProfileName.length && this.existProfile(defaultProfileName)) {
      const file = fs.readFileSync(path.resolve(this.dir, defaultProfileName))
      const json = JSON.parse(file.toString())
      for (const key in json) {
        if (Object.prototype.hasOwnProperty.call(json, key)) {
          if (!this.parameters.includes(key) && key !== 'version') {
            program[key] = json[key]
          }
        }
      }
      console.error(colors.bold(colors.cyan(`\u2139`)), `loaded default profile ${colors.yellow(defaultProfileName)}`)
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
  setProfile(program: commander.Command): void {
    if (typeof program.setProfile === 'string') {
      if (this.existProfile(program.setProfile)) {
        fs.writeFileSync(this.default, program.setProfile)
      } else {
        console.error(colors.bold(colors.red(`\u0058`)), `profile ${colors.yellow(program.setProfile)} doesn't exist`)
        this.showProfiles()
      }
    } else {
      console.error(
        colors.bold(colors.red(`\u0058`)),
        `presets must be named, eg. ${colors.gray('--set-profile john')}`
      )
    }
  }
  deleteProfile(program: commander.Command): void {
    if (typeof program.deleteProfile === 'string') {
      const profilePath = path.resolve(this.dir, program.deleteProfile)
      const profileExists = fs.existsSync(profilePath)
      if (profileExists) {
        const defaultProfile = fs.readFileSync(this.default).toString()
        if (defaultProfile == program.deleteProfile) {
          fs.unlinkSync(this.default)
          console.error(colors.bold(colors.cyan(`\u2139`)), `deleted ${colors.yellow(program.deleteProfile)}`)
        }
      } else {
        console.error(
          colors.bold(colors.red(`\u0058`)),
          `profile ${colors.yellow(program.deleteProfile)} doesn't exist`
        )
        this.showProfiles()
      }
    } else {
      console.error(
        colors.bold(colors.red(`\u0058`)),
        `presets must be named, eg. ${colors.gray('--delete-profile john')}`
      )
    }
  }
  showProfiles(): void {
    const profiles = fs.readdirSync(this.dir)
    const defaultProfile = fs.readFileSync(this.default).toString()
    for (const preset of profiles) {
      if (preset == defaultProfile) {
        console.error('-'.padStart(2), colors.cyan(preset), colors.gray('* default'))
      } else {
        console.error('-'.padStart(2), colors.cyan(preset))
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

  saveProfile(program: commander.Command): void {
    if (typeof program.saveProfile === 'string') {
      if (this.existProfile(program.saveProfile)) {
        console.error(
          colors.bold(colors.red(`\u0058`)),
          `profile ${colors.yellow(program.saveProfile)} already exists, use ${colors.grey(
            `--delete-profile ${program.saveProfile}`
          )} first`
        )
      } else {
        if (program.server) {
          const json = JSON.stringify(program.opts())
          fs.writeFileSync(__dirname + '/profiles/' + program.saveProfile, json)
          fs.writeFileSync(__dirname + '/default', program.saveProfile)
          console.error(
            colors.bold(colors.cyan(`\u2139`)),
            `saved ${colors.yellow(program.saveProfile)} and set it as default`
          )
        } else {
          console.error(
            colors.bold(colors.red(`\u0058`)),
            `option '-s, --server <server>' argument missing,`,
            `eg. ${colors.gray('-s irc.server.net')}`
          )
        }
      }
    } else {
      console.error(
        colors.bold(colors.red(`\u0058`)),
        `presets must be named, eg. ${colors.gray('--save-profile john')}`
      )
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

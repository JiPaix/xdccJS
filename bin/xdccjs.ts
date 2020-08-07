#!/usr/bin/env node
/* eslint-disable @typescript-eslint/triple-slash-reference */
/// <reference path="../@types/irc-framework.ts"/>
import XDCC from '../index'
import { program } from 'commander'
import { version } from '../package.json'
import * as colors from 'colors/safe'
import * as fs from 'fs'
import * as path from 'path'

const presets: { [prop: string]: string } = {}

const parseIfNotInt = (number: number | string): number => {
  if (typeof number === 'number') {
    return number
  } else {
    return parseInt(number)
  }
}

program
  .version(version)
  .name('xdccJS')
  .option('-s, --server <server>', 'irc server address')
  .option('--port <number>', 'irc server port', parseIfNotInt, 6667)
  .option('-b, --bot <botname>', 'xdcc bot nickname')
  .option('-d, --download <packs...>', 'pack number(s) to download')
  .option('-p, --path [path]', 'download path')
  .option('-u, --username <username>', 'irc username', 'xdccJS')
  .option('-c, --channel [chan...]', 'channel to join (without #)')
  .option('-r, --retry [number]', 'number of attempts before skipping pack', parseIfNotInt, 0)
  .option('--reverse-port [number]', 'port used for passive dccs', parseIfNotInt, 5001)
  .option('--no-randomize', 'removes random numbers to nickname')
  .option(
    '-w, --wait [number]',
    'wait time (in seconds) in channel(s) before sending download request',
    parseIfNotInt,
    0
  )
  .option('--save-profile [string]', 'save current options as a profile')
  .option('--delete-profile [string]', 'delete profile')
  .option('--set-profile [string]', 'set profile as default')
  .option('--list-profile', 'list all available profiles')
  .parse()

if (program.path) {
  if (process.platform === 'win32') {
    program.path = path.win32.normalize(program.path)
  } else {
    program.path = path.normalize(program.path)
  }
}

const isNotProfile = (key?: string): boolean => {
  if (key) {
    return key !== 'saveProfile' && key !== 'setProfile' && key !== 'deleteProfile' && key !== 'listProfile'
  } else {
    return !program.saveProfile && !program.setProfile && !program.deleteProfile && !program.listProfile
  }
}

const showProfiles = (): void => {
  if (fs.existsSync(__dirname + '/profiles/')) {
    const profiles = fs.readdirSync(__dirname + '/profiles/')
    if (profiles.length) {
      const def = fs.readFileSync(__dirname + '/default').toString()
      for (const preset of profiles) {
        if (preset == def) {
          console.error('-'.padStart(2), colors.cyan(preset), colors.gray('* default'))
        } else {
          console.error('-'.padStart(2), colors.cyan(preset))
        }
      }
    } else {
      console.error(colors.bold(colors.cyan(`\u2139`)), `no presets found`)
    }
  } else {
    console.error(
      colors.bold(colors.cyan(`\u2139`)),
      `no presets found, add one : eg. ${colors.gray('--save-profile john')}`
    )
  }
}

if (program.saveProfile) {
  if (typeof program.saveProfile === 'string') {
    if (fs.existsSync(__dirname + '/profiles/' + program.saveProfile)) {
      console.error(
        colors.bold(colors.red(`\u0058`)),
        `profile ${colors.yellow(program.saveProfile)} already exists, use ${colors.grey(
          `--delete-profile ${program.saveProfile}`
        )} first`
      )
    } else {
      if (program.server) {
        if (!fs.existsSync(__dirname + '/profiles')) {
          fs.mkdirSync(__dirname + '/profiles')
        }
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
          `presets must at least include a server, eg. ${colors.gray('--save-profile john --server irc.server.net')}`
        )
      }
    }
  } else {
    console.error(colors.bold(colors.red(`\u0058`)), `presets must be named, eg. ${colors.gray('--save-profile john')}`)
  }
} else if (program.deleteProfile) {
  if (typeof program.deleteProfile === 'string') {
    if (fs.existsSync(__dirname + '/profiles/' + program.deleteProfile)) {
      fs.unlinkSync(__dirname + '/profiles/' + program.deleteProfile)
      const def = fs.readFileSync(__dirname + '/default').toString()
      if (def == program.deleteProfile) {
        fs.unlinkSync(__dirname + '/default')
      }
      console.error(colors.bold(colors.cyan(`\u2139`)), `deleted ${colors.yellow(program.deleteProfile)}`)
    } else {
      console.error(colors.bold(colors.red(`\u0058`)), `profile ${colors.yellow(program.deleteProfile)} doesn't exist`)
      showProfiles()
    }
  } else {
    console.error(
      colors.bold(colors.red(`\u0058`)),
      `presets must be named, eg. ${colors.gray('--delete-profile john')}`
    )
  }
} else if (program.setProfile) {
  if (typeof program.setProfile === 'string') {
    if (fs.existsSync(__dirname + '/profiles/' + program.setProfile)) {
      const file = fs.readFileSync(__dirname + '/profiles/' + program.setProfile)
      const parsed = JSON.parse(file.toString())
      fs.writeFileSync(__dirname + '/default', program.setProfile)
      for (const key in parsed) {
        if (Object.prototype.hasOwnProperty.call(parsed, key)) {
          if (key !== 'version' && isNotProfile(key)) {
            presets[key] = parsed[key]
          }
        }
      }
      console.error(colors.bold(colors.cyan(`\u2139`)), `${colors.yellow(program.setProfile)} as default profile`)
    } else {
      console.error(colors.bold(colors.red(`\u0058`)), `profile ${colors.yellow(program.setProfile)} doesn't exist`)
      showProfiles()
    }
  } else {
    console.error(colors.bold(colors.red(`\u0058`)), `presets must be named, eg. ${colors.gray('--set-profile john')}`)
  }
} else if (program.listProfile) {
  showProfiles()
} else {
  if (fs.existsSync(__dirname + '/default')) {
    const presetName = fs.readFileSync(__dirname + '/default').toString()
    if (!program.server) {
      if (fs.existsSync(__dirname + '/' + presetName)) {
        const file = fs.readFileSync(__dirname + '/' + presetName)
        const parsed = JSON.parse(file.toString())
        for (const key in parsed) {
          if (Object.prototype.hasOwnProperty.call(parsed, key)) {
            if (key !== 'version' && isNotProfile(key)) {
              if (!program[key]) {
                program[key] = parsed[key]
              }
            }
          }
        }
        console.error(colors.bold(colors.cyan(`\u2139`)), `loaded default profile ${colors.yellow(presetName)}`)
      } else {
        console.error(colors.bold(colors.red(`\u0058`)), `profile ${colors.yellow(presetName)} doesn't exist`)
      }
    } else {
      console.error(colors.bold(colors.cyan(`\u2139`)), `ignored default profile ${colors.yellow(presetName)}`)
    }
  }
}

const check: boolean[] = []
let isLazy = false
if (typeof process.argv[2] !== 'undefined') {
  if (process.argv[2].includes('/msg') || process.argv[2].includes('/MSG')) {
    process.argv[2] = process.argv[2].toLowerCase()
    const regex = /(\/msg)\s(.+)\s(xdcc)\s(send)\s(.*)/g
    const match = regex.exec(process.argv[2])
    if (program.server) {
      if (match) {
        if (match.length === 6) {
          if (match[1] === '/msg' && match[3] === 'xdcc' && match[4] === 'send') {
            program.bot = match[2]
            program.download = match[5]
            isLazy = true
          } else {
            check.push(false)
            console.error(
              colors.bold(colors.red(`\u0058`)),
              `wrong syntax, eg. ${colors.gray('/msg bot xdcc send 25-33, 150')}`
            )
          }
        } else {
          check.push(false)
          console.error(
            colors.bold(colors.red(`\u0058`)),
            `wrong syntax, eg. ${colors.gray('/msg bot xdcc send 25-33, 150')}`
          )
        }
      } else {
        check.push(false)
        console.error(
          colors.bold(colors.red(`\u0058`)),
          `wrong syntax, eg. ${colors.gray('/msg bot xdcc send 25-33, 150')}`
        )
      }
    } else {
      console.error(
        colors.bold(colors.red(`\u0058`)),
        `profile has no server, you can't use the lazy method.\n change profile or use the "non-lazy" way, see : ${colors.gray(
          'xdccJS --help'
        )}`
      )
      console.error('error: profile has no server')
      check.push(false)
    }
  }
}

if (isNotProfile()) {
  if (!program.server) {
    check.push(false)
    console.error(
      colors.bold(colors.red(`\u0058`)),
      `option '-s, --server <server>' argument missing,`,
      `eg. ${colors.gray('-s irc.server.net')}`
    )
  } else if (!program.bot) {
    check.push(false)
    console.error(
      colors.bold(colors.red(`\u0058`)),
      `option '-b, --bot <botname>' argument missing,`,
      `eg. ${colors.gray(`-b "xdcc|a|bot"`)}`
    )
  } else if (!program.download) {
    check.push(false)
    console.error(
      colors.bold(colors.red(`\u0058`)),
      `option '-d, --download <pack>' argument missing,`,
      `eg. ${colors.gray(`-d 1-30, 55, 105`)}`
    )
  } else if (program.port) {
    if (isNaN(parseInt(program.port))) {
      check.push(false)
      console.error(
        colors.bold(colors.red(`\u0058`)),
        `option '-p, --port <number>' must be a number,`,
        `eg. ${colors.gray(`-p 6669`)}`
      )
    }
  } else if (isNaN(parseInt(program.wait))) {
    check.push(false)
    console.error(
      colors.bold(colors.red(`\u0058`)),
      `option '-w, --wait <number>' must be a number,`,
      `eg. ${colors.gray(`-w 60`)}`
    )
  } else if (program.retry) {
    if (isNaN(program.retry)) {
      check.push(false)
      console.error(
        colors.bold(colors.red(`\u0058`)),
        `option '-r, --retry <number>' must be a number,`,
        `eg. ${colors.gray(`-r 3`)}`
      )
    }
  }
  if (!check.length) {
    const opts = {
      host: program.server,
      port: program.port,
      nick: program.username,
      chan: program.channel,
      path: program.path || false,
      randomizeNick: program.randomize,
      passivePort: [program.reversePort],
      verbose: true,
      retry: program.retry,
    }

    if (!isLazy) {
      let pack = ''
      for (const packs of program.download) {
        pack += packs
      }
      program.download = pack
    }

    const xdccJS = new XDCC(opts)

    if (program.wait) {
      xdccJS.on('ready', () => {
        let wait = program.wait
        process.stderr.cursorTo(1)
        --wait
        process.stderr.write(`\u2937 ` + colors.bold(colors.cyan('\u2139')) + ' waiting: ' + wait)
        process.stderr.clearLine(1)
        const interv = setInterval(() => {
          process.stderr.cursorTo(1)
          --wait
          process.stderr.write(`\u2937 ` + colors.bold(colors.cyan('\u2139')) + ' waiting: ' + wait)
          process.stderr.clearLine(1)
          if (wait === 0) {
            process.stderr.clearLine(0)
            process.stderr.cursorTo(0)
            clearInterval(interv)
            const job = xdccJS.download(program.bot, program.download)
            job.on('pipe', stream => {
              stream.pipe(process.stdin)
            })
          }
        }, 1000)
      })
    } else {
      xdccJS.on('ready', () => {
        const job = xdccJS.download(program.bot, program.download)
        job.on('pipe', stream => {
          stream.on('data', chunk => {
            process.stdout.write(chunk)
          })
        })
      })
    }
    xdccJS.on('can-quit', () => {
      xdccJS.quit()
    })
  }
}

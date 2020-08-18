#!/usr/bin/env node
/* eslint-disable @typescript-eslint/triple-slash-reference */
/// <reference path="../src/@types/irc-framework.ts"/>
import XDCC from '../../index'
import { program } from 'commander'
import { version } from '../../package.json'
import Profiler from '../helpers/bin-helpers/profiler'
import TypeChecker from '../helpers/bin-helpers/typechecker'
import * as path from 'path'
import * as colors from 'colors/safe'
import { Params } from '../interfaces/params'

Profiler.InitFolder()

program
  .version(version)
  .name('xdccJS')
  .option('-s, --server <server>', 'irc server address')
  .option('--port <number>', 'irc server port', TypeChecker.parseIfNotInt, 6667)
  .option('-b, --bot <botname>', 'xdcc bot nickname')
  .option('-d, --download <packs...>', 'pack number(s) to download')
  .option('-p, --path [path]', 'download path', path.normalize)
  .option('-u, --username <username>', 'irc username', 'xdccJS')
  .option('-c, --channel [chan...]', 'channel to join (without #)')
  .option('-r, --retry [number]', 'number of attempts before skipping pack', TypeChecker.parseIfNotInt, 0)
  .option('--reverse-port [number]', 'port used for passive dccs', TypeChecker.parseIfNotInt, 5001)
  .option('--no-randomize', 'removes random numbers to nickname')
  .option(
    '-w, --wait [number]',
    'wait time (in seconds) in channel(s) before sending download request',
    TypeChecker.parseIfNotInt,
    0
  )
  .option('--save-profile [string]', 'save current options as a profile')
  .option('--delete-profile [string]', 'delete profile')
  .option('--set-profile [string]', 'set profile as default')
  .option('--list-profile', 'list all available profiles')
  .parse()

if (Profiler.isProfile(program)) {
  Profiler.ProcessProfile(program)
} else {
  Profiler.LoadDefaultProfile(program)
  if (TypeChecker.isIRCstyle(program, process.argv)) {
    TypeChecker.parseLazyString(program, process.argv)
  }

  if (TypeChecker.checkArgs(program)) {
    const opts:Params = {
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

    const xdccJS = new XDCC(opts)

    xdccJS.once('ready', () => {
      if (program.wait) {
        let wait = program.wait
        const interval = setInterval(() => {
          process.stderr.cursorTo(1)
          --wait
          process.stderr.write(`\u2937 ` + colors.bold(colors.cyan('\u2139')) + ' waiting: ' + wait)
          process.stderr.clearLine(1)
          if (wait === 0) {
            process.stderr.clearLine(0)
            process.stderr.cursorTo(0)
            clearInterval(interval)
            xdccJS.download(program.bot, program.download)
          }
        }, 1000)
      } else {
        xdccJS.download(program.bot, program.download)
      }
    })
    xdccJS.on('pipe', stream => {
      stream.pipe(process.stdout)
    })
    xdccJS.on('can-quit', () => {
      xdccJS.quit()
    })
  }
}

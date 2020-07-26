#!/usr/bin/env node
/* eslint-disable @typescript-eslint/triple-slash-reference */
/// <reference path="../@types/irc-framework.ts"/>
import XDCC from '../index'
import { program } from 'commander'
import { version } from '../package.json'
import * as colors from 'colors/safe'
import * as ProgressBar from 'progress'
import * as path from 'path'
program
  .version(version)
  .name('xdccJS')
  .option('-s, --server <server>', 'irc server address')
  .option('-P, --port <number>', 'irc server port', parseInt, 6667)
  .option('-p, --path <path>', 'download path')
  .option('-r, --reverse-port <numbers...>', 'port used for passive dccs', parseInt, 5001)
  .option('-u, --username <username>', 'irc username', 'xdccJS')
  .option('--no-randomize', 'removes random numbers to nickname')
  .option('-c, --channel [chan...]', 'channel to join (without #)')
  .option('-b, --bot <botname>', 'xdcc bot nickname')
  .option('-d, --download <packs...>', 'pack number to download')
  .option('-w, --wait [number]', 'wait time (in seconds) before sending download request')
  .parse()

const check: boolean[] = []

if (!program.server) {
  check.push(false)
  console.error(`error: option '-s, --server <server>' argument missing`)
} else if (!program.bot) {
  check.push(false)
  console.error(`error: option '-b, --bot <botname>' argument missing`)
} else if (!program.download) {
  check.push(false)
  console.error(`error: option '-d, --download <pack>' argument missing`)
} else if (program.port) {
  if (isNaN(parseInt(program.port))) {
    check.push(false)
    console.error(`error: option '-p, --port <number>' must be number`)
  }
} else if (isNaN(parseInt(program.wait))) {
  check.push(false)
  console.error(`error: option '-w, --wait <number>' must be number`)
}
if (check.filter(err => err === false).length === 0) {
  const opts = {
    host: program.server,
    port: program.port,
    nick: program.username,
    chan: program.channel,
    path: program.path || false,
    randomizeNick: program.randomize,
    passivePort: [program.reversePort],
    verbose: true,
  }
  const nbOfPack = program.download.length
  let pack = ''
  for (const packs of program.download) {
    pack += packs
  }
  program.download = pack
  program.wait = parseInt(program.wait)

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
          xdccJS.download(program.bot, program.download)
        }
      }, 1000)
    })
  } else {
    xdccJS.on('ready', () => {
      xdccJS.download(program.bot, program.download)
    })
  }
  if (nbOfPack > 1) {
    xdccJS.on('done', f => {
      console.error(f)
    })
  }
  xdccJS.on('can-quit', () => {
    xdccJS.quit()
  })
}

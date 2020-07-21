#!/usr/bin/env node
/* eslint-disable @typescript-eslint/triple-slash-reference */
/// <reference path="../@types/irc-framework.ts"/>
import XDCC from '../index'
import { program } from 'commander'
import { version } from '../package.json'

program
  .version(version)
  .name('xdccJS')
  .option('-s, --server <server>', 'irc server address')
  .option('-P, --port <number>', 'irc server port', parseInt, 6667)
  .option('-p, --path <path>', 'download path')
  .option(
    '-r, --reverse-port <number>',
    'port used for passive dccs',
    parseInt,
    5001
  )
  .option('-u, --username <username>', 'irc username', 'xdccJS')
  .option('--no-randomize', 'add random numbers to nickname')
  .option('-c, --channel <chan>', 'channel to join (without #)', 'xdccJS')
  .option('-b, --bot <botname>', 'xdcc bot nickname')
  .option('-d, --download <pack>', 'pack number to download')
  .parse(process.argv)

declare interface Params {
  /** IRC server hostname */
  host: string
  /** IRC server PORT */
  port: number
  /** Nickname to use on IRC */
  nick: string
  /** Channel(s) to join */
  chan: string | string[]
  /** Download path */
  path: false | string
  /** Display download progress in console */
  verbose?: boolean
  /** Add Random number to nickname */
  randomizeNick?: boolean
  /** Port(s) for passive DCC */
  passivePort?: number[]
}

if (!program.server) {
  console.log(`error: option '-s, --server <server>' argument missing`)
} else if (!program.bot) {
  console.log(`error: option '-b, --bot <botname>' argument missing`)
} else if (!program.download) {
  console.log(`error: option '-d, --download <pack>' argument missing`)
} else {
  const opts: Params = {
    host: program.server,
    port: program.port,
    nick: program.username,
    chan: [program.channel],
    path: program.path || false,
    randomizeNick: program.randomize,
    passivePort: [program.reversePort],
    verbose: true,
  }
  const xdccJS = new XDCC(opts)
  xdccJS.on('xdcc-ready', () => {
    xdccJS.download(program.bot, program.download)
  })
  xdccJS.on('downloaded', () => {
    xdccJS.quit()
  })
  xdccJS.on('pipe-data', data => {
    process.stdout.write(data)
  })
  xdccJS.on('pipe-downloaded', () => {
    xdccJS.quit()
  })
}

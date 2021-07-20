/* eslint-disable @typescript-eslint/no-non-null-assertion */
import 'mocha'
import { expect } from 'chai'
import XDCC, { Params } from '../src/index'
import { Job } from '../src/interfaces/job'
import { isArray } from 'lodash'
import * as fs from 'fs'
import * as path from 'path'
import { PassThrough } from 'stream'
import Manipulator from 'dotenv-manipulator'

new Manipulator()
declare let process: {
  exit: (n: number) => {}
  env: {
    NODE_ENV: string
    SERVER1: string
    SERVER2: string
    CHAN1: string
    CHAN2: string
    GIN: string
  }
}
const XDCC2 = require('../src/index').default
let start: XDCC

const args: Params = {
  host: process.env.SERVER1,
  path: 'downloads',
  port: 6660,
  retry: 1,
  verbose: false,
  nickname: Math.random()
    .toString(36)
    .replace(/[^a-z]+/g, '')
    .substr(0, 9),
  randomizeNick: false,
  timeout: 5,
  secure: false,
}

const testFile = path.resolve('./', 'downloads', 'Gin.txt')
if (fs.existsSync(testFile)) {
  fs.unlinkSync(testFile)
}

let A: Job
let B: Job
describe('import and require', () => {
  it('import', () => {
    expect(XDCC).to.be.a('function')
  })
  it('require', () => {
    expect(XDCC2).to.be.a('function')
  })
})

describe('initialize', () => {
  before(function (done) {
    start = new XDCC(args)
    if (start instanceof XDCC) {
      done()
    }
  })
  it('connect', function (done) {
    this.timeout(10000)
    start.once('ready', () => {
      done()
    })
  })
})
let job: void | Job | Job[]

describe('Jobify', () => {
  it('download()', function (done) {
    A = start.download('JiPaix', '1-2,5')
    start.download('JiPaix', [25])
    start.download('JiPaix', ['26'])
    start.download('JiPaixx', 2)
    if (A.show().now === 1 && A.show().queue[0] === 2) {
      done()
    }
  })
  it('register job', function (done) {
    if (A.queue.length === 4) {
      const jobs = start.jobs()
      if (isArray(jobs)) {
        if (jobs.length == 2) {
          done()
        }
      }
    }
  })
  it('display job status', function (done) {
    job = start.jobs()
    if (job) {
      if (isArray(job)) {
        if (!job[0].isDone()) {
          done()
        }
      }
    }
  })
  it('cancel', function (done) {
    if (job) {
      if (isArray(job)) {
        if (!job[0].cancel) {
          done()
        }
      }
    }
  })
})

describe('Connexion', () => {
  it('can-quit', function (done) {
    this.timeout(0)
    start.once('can-quit', () => {
      done()
    })
  })
})
let size: number
describe('RealLife', () => {
  it('really download', function (done) {
    this.timeout(0)
    B = start.download(process.env.GIN, 1)
    B.on('downloaded', f => {
      if (fs.lstatSync(f.filePath).size === f.length) {
        size = f.length
        done()
      }
    })
  })
  it('resume', function (done) {
    this.timeout(0)
    const C = start.download(process.env.GIN, 1)
    C.on('downloaded', f => {
      if (fs.lstatSync(f.filePath).size === size) {
        done()
      }
    })
  })
  it('quit', function (done) {
    start.quit()
    done()
  })
})

let start2: XDCC
const args2: Params = {
  host: process.env.SERVER2,
  chan: [process.env.CHAN1, process.env.CHAN2],
  retry: 0,
  verbose: true,
  randomizeNick: true,
  path: false,
  passivePort: Array.from(Array(5050 + 1).keys()).slice(5010),
}

let downloadInfo: { bot: string; pack: string }
describe('RealLife#2', () => {
  it('connect', function (done) {
    this.timeout(0)
    start2 = new XDCC2(args2)
    start2.on('ready', () => {
      start2.irc.on('message', ev => {
        if (downloadInfo) {
          const ignore = ['NickServ', 'TheSource', 'TS-Search']
          if (!ignore.includes(ev.nick)) {
            if (ev.target === start2.irc.user.nick) {
              console.error(ev.message)
            }
          }
        }
        if (ev.nick.includes('|P|')) {
          if (ev.message.includes('#')) {
            const pack = ev.message.match(/#\w+/g)
            if (pack) {
              if (!downloadInfo) {
                downloadInfo = { bot: ev.nick, pack: pack[0].replace('#', '') }
              }
            }
          }
        }
      })
      setTimeout(() => {
        done()
      }, 65 * 1000)
    })
  })
  it('download passive pipe', function (done) {
    this.timeout(0)
    const job = start2.download(downloadInfo.bot, downloadInfo.pack)

    start2.on('error', e => {
      console.error(e)
    })

    job.on('pipe', stream => {
      if (stream instanceof PassThrough) {
        done()
      } else {
        console.error('not instance of PassThrough')
        process.exit(1)
      }
    })
  })

  it('cancel()', function (done) {
    this.timeout(0)
    const JobB = start2.jobs(downloadInfo.bot)
    if (JobB instanceof Job) {
      if (JobB.cancel) {
        JobB.cancel()
        JobB.on('cancel', () => {
          done()
        })
      } else {
        console.error('not cancellable')
        process.exit(1)
      }
    } else {
      console.error('not instance of Job')
      process.exit(1)
    }
  })
  it('has no job', function (done) {
    start2.quit()
    if (!start2.jobs()) {
      done()
    }
  })
})

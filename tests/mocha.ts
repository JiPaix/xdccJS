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

const XDCC2 = require('../src/index').default

new Manipulator()
declare let process: {
  exit: (n: number) => {}
  env: {
    NODE_ENV: string
    SERVER1: string
    SERVER2: string
    CHAN1: string
    CHAN2: string
    BOT1: string
    FILE1: string
    IGNORE1: string
    IGNORE2: string
    IGNORE3: string
  }
}
// TODO
// create downloads folder or empty it. =>>>>>



const args: Params = {
  host: process.env.SERVER1,
  path: 'downloads',
  verbose: true,
  chan:"#jipai",
  nickname: Math.random()
    .toString(36)
    .replace(/[^a-z]+/g, '')
    .substr(0, 9),
  randomizeNick: true,
  secure: false,
}

const args2: Params = {
  host: process.env.SERVER2,
  port: 6667,
  retry: 1,
  chan:"the.source",
  verbose: false,
  nickname: Math.random()
    .toString(36)
    .replace(/[^a-z]+/g, '')
    .substr(0, 9),
  randomizeNick: false,
  secure: false,
  passivePort: [5001]
}

let xdccJS1: XDCC
let xdccJS2: XDCC

describe('import and require', () => {
  it('import', () => {
    expect(XDCC).to.be.a('function')
  })
  it('require', () => {
    expect(XDCC2).to.be.a('function')
  })
})

describe('initialize', () => {
  it('connect #1', function(done) {
    this.timeout(10000)
    xdccJS1 = new XDCC(args)
    xdccJS1.once('ready', () => {
      done()
    })
  })
  it('connect #2', function(done) {
    this.timeout(10000)
    xdccJS2 = new XDCC2(args2)
    xdccJS2.once('ready', () => {
      done()
    })
  })
})

let A:Job
let job: void | Job | Job[]

describe('Jobify', () => {
  it('download', function (done) {
    A = xdccJS1.download('JiPaix', '1-2,5')
    xdccJS1.download('JiPaix', [25])
    xdccJS1.download('JiPaix', ['26'])
    xdccJS1.download('JiPaixx', 2)
    if (A.show().now === 1 && A.show().queue[0] === 2) {
      done()
    } else {
      done('not jobified')
    }
  })
  it('register job', function (done) {
    if (A.queue.length === 4) {
      const jobs = xdccJS1.jobs()
      if (isArray(jobs)) {
        if (jobs.length == 2) {
          done()
        } else {
          done('wrong length')
        }
      }
    }
  })
  it('display job status', function (done) {
    job = xdccJS1.jobs()
    if (job) {
      if (isArray(job)) {
        if (typeof job[0].isDone() === 'boolean') {
          done()
        } else {
          done('failed')
        }
      }
    }
  })
  it('cancel', function (done) {
    if(isArray(job)) {
      for (const j of job) {
        if(j.cancel) j.cancel()
      }
      done()
    }
  })
})

let size:number
describe('RealLife', () => {
  it('download', function (done) {
    this.timeout(10000)
    const job = xdccJS1.download(process.env.BOT1, 1)
    job.once('downloaded', ()=>done())
    job.on('error', (err) => done(err))
  })

  it('quit', function (done) {
    xdccJS1.quit()
    done()
  })
})


let downloadInfo: { bot: string; pack: string }

describe('RealLife#2', () => {
  it('Reading messages', function (done) {
    this.timeout(0)
    xdccJS2.irc.on('message', ev => {
      if(ev.nick.includes('|P|')) {
        if(ev.message.includes('#')) {
          const pack = ev.message.match(/#\w+/g)
          if (pack) {
            if(!downloadInfo) {
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

  it('download passive + pipe', function (done) {

    this.timeout(0)
    const job = xdccJS2.download(downloadInfo.bot, downloadInfo.pack)

    xdccJS2.on('error', e => {
      done(e)
    })

    job.on('pipe', stream => {
      if (stream instanceof PassThrough) {
        done()
      } else {
        done('not instance of PassThrough')
        process.exit(1)
      }
    })
  })

  it('cancel()', function (done) {
    this.timeout(0)
    const JobB = xdccJS2.jobs(downloadInfo.bot)
    if (JobB instanceof Job) {
      if (JobB.cancel) {
        JobB.cancel()
        JobB.on('cancel', () => {
          done()
        })
      } else {
        done('not cancellable')
      }
    } else {
      done('not instance of Job')
    }
  })
  it('has no job', function (done) {
    xdccJS2.quit()
    if (!xdccJS2.jobs()) {
      done()
    } else {
      done('job incorrectly canceled')
    }
  })
})
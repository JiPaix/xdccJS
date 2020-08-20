/* eslint-disable @typescript-eslint/no-non-null-assertion */
import 'mocha'
import { expect } from 'chai'
import XDCC, { Params } from '../src/index'
import { Job } from '../src/interfaces/job'
import { isArray } from 'lodash'
import * as fs from 'fs'
import * as path from 'path'
const XDCC2 = require('../src/index').default
let start: XDCC

const args: Params = {
  host: 'irc.rizon.net',
  chan: ['xdccjs', '#xdccjs2'],
  path: 'downloads',
  port: 6660,
  retry: 1,
  verbose: true,
  randomizeNick: true,
  passivePort: [5001],
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
    B = start.download('ginpachi-sensei', 1)
    B.on('downloaded', f => {
      if (fs.lstatSync(f.filePath).size === f.length) {
        size = f.length
        done()
      }
    })
  })
  it('resume', function (done) {
    this.timeout(0)
    const C = start.download('ginpachi-sensei', 1)
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

/* eslint-disable @typescript-eslint/no-non-null-assertion */
import 'mocha'
import { expect } from 'chai'
import XDCC from '..'

const XDCC2 = require('../').default
let start: XDCC

const args = {
  host: 'irc.rizon.net',
  nick: 'tester',
  chan: '#jipaix',
  path: 'downloads',
  port: 6660,
  retry: 0,
  verbose: false,
  randomizeNick: true,
  passivePort: [5001],
}
interface Job {
  queue: number[]
}
let A: Job

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
    start.on('ready', () => {
      done()
    })
  })
  it('download()', function (done) {
    start.once('request', (res: { target: string; packets: number[] }) => {
      let check
      for (let i = 0; i < res.packets.length; i++) {
        check = [1, 2, 5][i] === res.packets[i]
      }
      if (check) {
        done()
      }
    })
    A = start.download('JiPaix', '1-2,5')
  })
  it('register job', function (done) {
    if (A.queue!.length === 2) {
      done()
    }
  })
  it('add to job', function (done) {
    start.download('JiPaix', 6)
    if (A.queue!.length === 3 && A.queue![2] === 6) {
      done()
    }
  })
  it('disconnect', function (done) {
    done()
    process.exit(0)
  })
})

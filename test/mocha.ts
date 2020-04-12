import 'mocha'
import {
    expect
} from 'chai'
import XDCC from '../'

let start: XDCC

const XDCC2 = require('../').default

const args = {
    host: 'irc.rizon.net',
    nick: 'tester',
    chan: '#jipaix',
    path: 'downloads',
    port: 6660,
    verbose: false,
    randomizeNick: true,
}


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
        done()
    })
    it('connect', function (done) {
        this.timeout(10000)
        start.on('xdcc-ready', () => {
            done()
        })
    })
    it('download()', function (done) {
        start.on('request', (res) => {
            if (res.target === 'JiPaix' && res.packet === '#1') {
                done()
            }
        })
        start.download('JiPaix', 1)
    })
    it('downloadBatch()', function (done) {
        start.on('request batch', (res) => {
            if (res.target === 'JiPaix' && [2, 3, 4, 5, 9].every((val, i, arr) => val === res.packet[i])) {
                start.quit()
                done()
            }
        })
        start.downloadBatch('JiPaix', '2-5 , 9')
    })
})
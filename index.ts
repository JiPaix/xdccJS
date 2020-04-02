import * as IRC from 'irc-framework';
import * as fs from 'fs'
import * as path from 'path'
import * as net from 'net'

type packageNumber = string | number;

export default class XDCC extends IRC.Client {
    nick: string
    chan: string
    path: string
    verbose: boolean
    disconnect: boolean
    constructor(parameters: { host: string; port: number; nick: string; chan: string; path: string; disconnect?: boolean; verbose?: boolean }) {
        super()
        this.verbose = parameters.verbose || false
        this.disconnect = parameters.disconnect || false
        this.nick = this.nickRandomizer(parameters.nick)
        this.chan = this.HashTag(parameters.chan)
        this.connect({
            host: parameters.host,
            port: parameters.port,
            nick: this.nick,
            encoding: 'utf8',
            // eslint-disable-next-line @typescript-eslint/camelcase
            auto_reconnect: false,
        })
        this.path = path.join(path.resolve('./'), parameters.path)
        fs.mkdirSync(this.path, { recursive: true })
        this.live()
    }
    private live(): void {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self = this
        this.on('connected', () => {
            const channel = this.channel(this.chan);
            channel.join();

            self.emit('xdcc-ready')
            if (this.verbose) { console.log(`connected and joined ${this.chan}`) }
        });
        this.on('request', (args: { target: string; packet: packageNumber }) => {
            this.say(args.target, 'xdcc send ' + args.packet)
            if (this.verbose) { console.log(`/MSG ${args.target} xdcc send ${args.packet} `) }
        })
        this.on('ctcp request', (resp: { [prop: string]: string }): void => {
            if (resp.message === null || typeof resp.message !== 'string') {
                throw new TypeError('CTCP : unexpected response.')
            }
            const fileInfo = this.parseCtcp(resp.message)
            const file = fs.createWriteStream(fileInfo.filePath)
            file.on('open', () => {
                let received = 0
                const sendBuffer = Buffer.alloc(4)
                let slowdown: NodeJS.Timeout = setInterval(() => { throw new Error(`not receiving any data`) }, 10000)
                const client = net.connect(fileInfo.port, fileInfo.ip, () => {
                    self.emit('download start')
                    if (this.verbose) { console.log(`download starting: ${fileInfo.file} `) }
                })
                client.on('data', (data) => {
                    file.write(data)
                    received += data.length
                    sendBuffer.writeUInt32BE(received, 0)
                    client.write(sendBuffer)
                    if (received === data.length) {
                        clearInterval(slowdown)
                        slowdown = setInterval(() => {
                            self.emit('downloading', received, fileInfo)
                            if (this.verbose) { process.stdout.write(`downloading : ${this.formatBytes(received)} / ${this.formatBytes(fileInfo.length)}\r`) }
                        }, 1000)
                    } else if (received === fileInfo.length) {
                        clearInterval(slowdown)
                    }
                })
                client.on('end', () => {
                    file.end()
                    self.emit('downloaded', fileInfo)
                    if (this.verbose) { console.log(`downloading done: ${file.path}`) }
                    if (this.disconnect) { self.quit('muybueno') }
                })
                client.on('error', (err) => {
                    self.emit('download error', err, fileInfo)
                    file.end()
                    if (this.verbose) { console.log('download error', err) }
                })
            })
        })
    }
    public send(target: string, packet: packageNumber): void {
        packet = this.HashTag(packet)
        this.emit('request', { target, packet })
    }
    private nickRandomizer(nick: string): string {
        if (nick.length > 6) {
            nick = nick.substr(0, 6)
        }
        return nick + Math.floor(Math.random() * 999) + 1
    }
    private formatBytes(bytes: number, decimals = 2): string {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const dm = decimals < 0 ? 0 : decimals
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
    }
    private HashTag(value: packageNumber): string {
        if (typeof value === 'string') {
            if (RegExp(/(^[0-9]+$|^#[0-9]+$)/g).test(value) || RegExp(/(^[A-z]+$|^#[A-z]+$)/g).test(value)) {
                if (value.charAt(0) === '#') {
                    return value
                } else {
                    return `#${value}`
                }
            } else {
                throw new TypeError(`Package: string must match this pattern: /(^[0-9]+$|^#[0-9]+$)/g`)
            }
        } else if (typeof value === 'number') {
            if (value % 1 === 0) {
                return `#${value.toString()}`
            } else {
                throw new TypeError(`Package: number must be an integer.`)
            }

        } else {
            throw new TypeError(`Package: expect package to be a number or a string matching this pattern: /(^[0-9]+$|^#[0-9]+$)/g`)
        }
    }
    private uint32ToIP(n: number): string {
        const byte1 = n & 255
            , byte2 = ((n >> 8) & 255)
            , byte3 = ((n >> 16) & 255)
            , byte4 = ((n >> 24) & 255);
        return byte4 + "." + byte3 + "." + byte2 + "." + byte1;
    }
    private parseCtcp(text: string): { file: string; filePath: string; ip: string; port: number; length: number } {
        const parts = text.match(/(?:[^\s"]+|"[^"]*")+/g);
        if (!parts) { throw new TypeError(`CTCP : received unexpected msg : ${text}`) }
        if (
            parts.some((index) => {
                index === null
            })
        ) {
            throw new TypeError(`CTCP : received unexpected msg : ${text}`)
        }
        return {
            file: parts[2].replace(/"/g, ''),
            filePath: path.normalize(this.path + '/' + parts[2].replace(/"/g, '')),
            ip: this.uint32ToIP(parseInt(parts[3], 10)),
            port: parseInt(parts[4], 10),
            length: parseInt(parts[5], 10)
        };
    }
}


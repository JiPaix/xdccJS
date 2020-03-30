import * as IRC from 'irc-framework';
import customEvents from 'eventemitter3';
import fs from 'fs'
import path from 'path'
import net from 'net'

type packageNumber = string | number;

export = class XDCC extends IRC.Client {
    nick: string
    chan: string
    path: string
    constructor(parameters: { host: string, port: number, nick: string, chan: string, path: string }) {
        super()
        this.nick = this.nickRandomizer(parameters.nick)
        this.chan = this.HashTag(parameters.chan)
        this.connect({
            host: parameters.host,
            port: parameters.port,
            nick: this.nick,
            encoding: 'utf8',
            auto_reconnect: false,
        })
        this.customEvents = new customEvents()
        this.path = path.join(path.resolve(__dirname, '../'), parameters.path)
        fs.mkdirSync(this.path, { recursive: true })
        this.live()
    }
    private live() {
        this.on('connected', () => {
            let channel = this.channel(this.chan);
            channel.join();
        });
        this.customEvents.on('request', (args: { target: string, packet: packageNumber }) => {
            let channel = this.channel(this.chan);
            this.say(args.target, 'xdcc send ' + args.packet)
        })
        this.on('ctcp request', (resp: any) => {
            let self = this
            let fileInfo = this.parseCtcp(resp.message)
            let file = fs.createWriteStream(fileInfo.filePath)
            file.on('open', () => {
                let received = 0
                let sendBuffer = Buffer.alloc(4)
                let client = net.connect(fileInfo.port, fileInfo.ip, () => {
                    self.customEvents.emit('download start')
                })
                client.on('data', (data) => {
                    file.write(data)
                    received += data.length
                    sendBuffer.writeUInt32BE(received, 0)
                    client.write(sendBuffer)
                    self.customEvents.emit('downloading', received, fileInfo)
                })
                client.on('end', () => {
                    file.end()
                    self.customEvents.emit('downloaded', fileInfo)
                })
                client.on('error', (err) => {
                    self.customEvents.emit('download error', err, fileInfo)
                    file.end()
                })
            })
        })
    }
    public send(target: string, packet: packageNumber) {
        packet = this.HashTag(packet)
        this.customEvents.emit('request', { target, packet })
    }
    private nickRandomizer(nick: string) {
        return nick + Math.floor(Math.random() * 9999) + 1
    }
    private HashTag(value: packageNumber): string {
        if (typeof value === 'string') {
            let chan: string = value
            if (chan.charAt(0) === '#') {
                return chan

            } else {
                return '#' + chan
            }
        } else if (typeof value === 'number') {
            let pack: string = '#' + value
            return pack
        }
        throw new Error('unreachable')
    }
    private uint32ToIP(n: number) {
        var byte1 = n & 255
            , byte2 = ((n >> 8) & 255)
            , byte3 = ((n >> 16) & 255)
            , byte4 = ((n >> 24) & 255);

        return byte4 + "." + byte3 + "." + byte2 + "." + byte1;
    }
    private parseCtcp(text: any) {
        let parts = text.match(/(?:[^\s"]+|"[^"]*")+/g);
        return {
            file: parts[2].replace(/"/g, ''),
            filePath: path.normalize(this.path + '/' + parts[2].replace(/"/g, '')),
            ip: this.uint32ToIP(parseInt(parts[3], 10)),
            port: parseInt(parts[4], 10),
            length: parseInt(parts[5], 10)
        };
    }
}
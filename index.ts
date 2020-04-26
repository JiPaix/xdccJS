/* eslint-disable @typescript-eslint/no-this-alias */
/* eslint-disable @typescript-eslint/triple-slash-reference */
/// <reference path="@types/irc-framework.ts"/>
import { Client } from 'irc-framework'
import * as fs from 'fs'
import * as path from 'path'
import * as net from 'net'

export default class XDCC extends Client
{
    private nick: string
    private chan: string[]
    public path: false | string
    public verbose: boolean

    constructor ( parameters: { host: string; port: number; nick: string; chan: string | string[]; path: false | string; verbose?: boolean; randomizeNick?: boolean } )
    {
        super()
        if ( typeof parameters.host !== 'string' )
        {
            throw TypeError( `unexpected type of 'host': a string was expected but got '${ typeof parameters.host }'` )
        }
        if ( typeof parameters.port !== 'number' )
        {
            throw TypeError( `unexpected type of 'port': a number was expected but got '${ typeof parameters.port }'` )
        }
        if ( typeof parameters.nick !== 'string' )
        {
            throw TypeError( `unexpected type of 'nick': a string was expected but got '${ typeof parameters.nick }'` )
        }
        if ( typeof parameters.path === 'string' || parameters.path == false )
        {
            if ( typeof parameters.path === 'string' )
            {
                this.path = path.normalize( parameters.path )
                if ( !path.isAbsolute( this.path ) )
                {
                    this.path = path.join( path.resolve( './' ), parameters.path )
                }
                fs.mkdirSync( this.path, { recursive: true } )
            } else
            {
                this.path = false
            }
        } else
        {
            throw TypeError( `unexpected type of 'path': a string or false was expected but got '${ typeof parameters.path }'` )
        }
        if ( typeof parameters.verbose == 'boolean' || typeof parameters.verbose == 'undefined' )
        {
            this.verbose = parameters.verbose || false
        } else
        {
            throw TypeError( `unexpected type of 'verbose': a boolean was expected but got '${ typeof parameters.verbose }'` )
        }
        if ( typeof parameters.randomizeNick === 'boolean' || typeof parameters.randomizeNick === 'undefined' )
        {
            if ( parameters.randomizeNick === false )
            {
                this.nick = parameters.nick
            } else
            {
                this.nick = this.nickRandomizer( parameters.nick )
            }
        } else
        {
            throw TypeError( `unexpected type of 'randomizeNick': a boolean was expected but got '${ typeof parameters.randomizeNick }'` )
        }
        if ( typeof parameters.chan === 'string' )
        {
            this.chan = [ this.checkHashtag( parameters.chan, true ) ]
        } else if ( Array.isArray( parameters.chan ) )
        {
            this.chan = parameters.chan
        } else
        {
            throw TypeError( `unexpected type of 'chan': a boolean was expected but got '${ typeof parameters.chan }'` )
        }
        this.connect( {
            host: parameters.host,
            port: parameters.port,
            nick: this.nick,
            encoding: 'utf8',
            // eslint-disable-next-line @typescript-eslint/camelcase
            auto_reconnect: true,
            // eslint-disable-next-line @typescript-eslint/camelcase
            ping_interval: 30,
            // eslint-disable-next-line @typescript-eslint/camelcase
            ping_timeout: 120,
        } )
        this.live()
    }

    private live (): void
    {
        const self = this
        this.on( 'connected', () =>
        {
            for ( let index = 0; index < this.chan.length; index++ )
            {
                const channel = this.channel( this.checkHashtag( this.chan[ index ], true ) )
                channel.join()
            }
            self.emit( 'xdcc-ready' )
            if ( this.verbose ) { console.log( `connected and joined ${ this.chan }` ) }
        } )
        this.on( 'request', ( args: { target: string; packet: string | number } ) =>
        {
            this.say( args.target, `xdcc send ${ args.packet }` )
            if ( this.verbose ) { console.log( `/MSG ${ args.target } xdcc send ${ args.packet }` ) }
        } )
        this.on( 'request batch', ( args: { target: string; packet: number[] } ) =>
        {
            if ( !this.path ) { throw new Error( `downloadBatch() can't be used in pipe mode.` ) }
            let i = 0
            if ( i < args.packet.length )
            {
                this.say( args.target, `xdcc send ${ args.packet[ i ] }` )
                if ( this.verbose ) { console.log( `/MSG ${ args.target } xdcc send ${ args.packet[ i ] }` ) }
                i++
            }
            this.on( 'downloaded', () =>
            {
                if ( i < args.packet.length )
                {
                    this.say( args.target, `xdcc send ${ args.packet[ i ] }` )
                    if ( this.verbose ) { console.log( `/MSG ${ args.target } xdcc send ${ args.packet[ i ] }` ) }
                    i++
                }
            } )

        } )
        this.on( 'ctcp request', ( resp: { [ prop: string ]: string } ): void =>
        {
            if ( typeof resp.message !== 'string' )
            {
                throw new TypeError( `CTCP MSG: ${ resp.message }` )
            }
            if ( this.path )
            {
                this.downloadToFile( resp )
            } else
            {
                this.downloadToPipe( resp )
            }
        } )
    }

    private downloadToPipe ( resp: { [ prop: string ]: string } ): void
    {
        const self = this
        const fileInfo = this.parseCtcp( resp.message )
        let received = 0
        const sendBuffer = Buffer.alloc( 4 )
        let slowdown: NodeJS.Timeout = setInterval( () => { throw new Error( `not receiving any data` ) }, 10000 )
        const client = net.connect( fileInfo.port, fileInfo.ip, () =>
        {
            self.emit( 'download-start' )
            if ( this.verbose ) { console.log( `download starting: ${ fileInfo.file }; ` ) }
        } )
        self.emit( 'download-pipe', client, fileInfo )
        client.on( 'data', ( data ) =>
        {
            self.emit( 'data', data, fileInfo.length )
            received += data.length
            sendBuffer.writeUInt32BE( received, 0 )
            client.write( sendBuffer )
            if ( received === data.length )
            {
                clearInterval( slowdown )
                slowdown = setInterval( () =>
                {
                    self.emit( 'downloading', received, fileInfo )
                    if ( this.verbose ) { process.stdout.write( `downloading : ${ this.formatBytes( received ) } / ${ this.formatBytes( fileInfo.length ) }\r` ) }
                }, 1000 )
            } else if ( received === fileInfo.length )
            {
                clearInterval( slowdown )
            }
        } )
    }

    private downloadToFile ( resp: { [ prop: string ]: string } ): void
    {
        const self = this
        const fileInfo = this.parseCtcp( resp.message )
        if ( fs.existsSync( fileInfo.filePath ) )
        {
            if ( fs.statSync( fileInfo.filePath ).size === fileInfo.length )
            {
                this.say( resp.nick, 'XDCC CANCEL' )
                self.emit( 'downloaded', fileInfo )
                if ( this.verbose ) { console.log( `You already have this: ${ fileInfo.filePath }` ) }
                return
            } else
            {
                fs.unlinkSync( fileInfo.filePath )
            }
        }
        const file = fs.createWriteStream( fileInfo.filePath )
        file.on( 'open', () =>
        {
            let received = 0
            const sendBuffer = Buffer.alloc( 4 )
            let slowdown: NodeJS.Timeout = setInterval( () => { throw new Error( `not receiving any data` ) }, 10000 )
            const client = net.connect( fileInfo.port, fileInfo.ip, () =>
            {
                self.emit( 'download-start' )
                if ( this.verbose ) { console.log( `download starting: ${ fileInfo.file } ` ) }
            } )
            client.on( 'data', ( data ) =>
            {
                file.write( data )
                received += data.length
                sendBuffer.writeUInt32BE( received, 0 )
                client.write( sendBuffer )
                if ( received === data.length )
                {
                    clearInterval( slowdown )
                    slowdown = setInterval( () =>
                    {
                        self.emit( 'downloading', received, fileInfo )
                        if ( this.verbose ) { process.stdout.write( `downloading : ${ this.formatBytes( received ) } / ${ this.formatBytes( fileInfo.length ) }\r` ) }
                    }, 1000 )
                } else if ( received === fileInfo.length )
                {
                    clearInterval( slowdown )
                }
            } )
            client.on( 'end', () =>
            {
                file.end()
                self.emit( 'downloaded', fileInfo )
                if ( this.verbose ) { console.log( `downloading done: ${ file.path }` ) }
            } )
            client.on( 'error', ( err ) =>
            {
                self.emit( 'download-error', err, fileInfo )
                file.end()
                if ( this.verbose ) { console.log( `download error : ${ err }` ) }
            } )
        } )
    }

    public download ( target: string, packet: string | number ): void
    {
        packet = this.checkHashtag( packet, false )
        this.emit( 'request', { target, packet } )
    }

    public downloadBatch ( target: string, packets: string ): void
    {
        const packet = packets.split( ',' )
        const range: number[] = []
        packet.map( s =>
        {
            const minmax = s.split( '-' )
            if ( s.includes( '-' ) )
            {
                for ( let i = +minmax[ 0 ]; i <= +minmax[ 1 ]; i++ )
                {
                    range.push( i )
                }
            } else
            {
                range.push( parseInt( s ) )
            }
        } )
        if ( this.verbose ) { console.log( `Batch download of packets : ${ packets }` ) }
        this.emit( 'request batch', { target: target, packet: range } )
    }

    private nickRandomizer ( nick: string ): string
    {
        if ( nick.length > 6 )
        {
            nick = nick.substr( 0, 6 )
        }
        return nick + Math.floor( Math.random() * 999 ) + 1
    }

    private formatBytes ( bytes: number, decimals = 2 ): string
    {
        if ( bytes === 0 ) return '0 Bytes'
        const k = 1024
        const dm = decimals < 0 ? 0 : decimals
        const sizes = [ 'Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB' ]
        const i = Math.floor( Math.log( bytes ) / Math.log( k ) )
        return parseFloat( ( bytes / Math.pow( k, i ) ).toFixed( dm ) ) + ' ' + sizes[ i ]
    }

    private checkHashtag ( value: string | number, isChannel: boolean ): string
    {
        if ( isChannel )
        {
            if ( typeof value === 'string' )
            {
                if ( value.charAt( 0 ) === '#' )
                {
                    return value
                } else
                {
                    return `#${ value }`
                }
            } else if ( typeof value === 'number' )
            {
                return value.toString()
            } else
            {
                throw TypeError( `unexpected type of 'chan': a string|number was expected but got '${ typeof value }'` )
            }
        } else
        {
            if ( typeof value === 'number' )
            {
                if ( value % 1 === 0 )
                {
                    return `#${ value.toString() }`
                } else
                {
                    throw TypeError( `unexpected 'package': number must be an integer'` )
                }
            } else if ( typeof value === 'string' )
            {
                const isPack = RegExp( /^\d+-\d+$|^#\d+-\d+$|^\d+$|^#\d+$/gm ).test( value )
                if ( isPack )
                {
                    return value
                } else
                {
                    throw new TypeError( `unexpected 'package': string must be '100' or '#100' or '100-102' or '#102-102'` )
                }
            } else
            {
                throw new TypeError( `unexpected type of 'package': a string|number was expected but got ${ typeof value }` )
            }
        }
    }

    private uint32ToIP ( n: number ): string
    {
        const byte1 = n & 255
            , byte2 = ( ( n >> 8 ) & 255 )
            , byte3 = ( ( n >> 16 ) & 255 )
            , byte4 = ( ( n >> 24 ) & 255 )
        return byte4 + "." + byte3 + "." + byte2 + "." + byte1
    }

    private parseCtcp ( text: string ): { file: string; filePath: string; ip: string; port: number; length: number }
    {
        const parts = text.match( /(?:[^\s"]+|"[^"]*")+/g )
        if ( !parts ) { throw new TypeError( `CTCP : received unexpected msg : ${ text }` ) }
        if (
            parts.some( ( index ) =>
            {
                index === null
            } )
        )
        {
            throw new TypeError( `CTCP : received unexpected msg : ${ text }` )
        }
        return {
            file: parts[ 2 ].replace( /"/g, '' ),
            filePath: path.normalize( this.path + '/' + parts[ 2 ].replace( /"/g, '' ) ),
            ip: this.uint32ToIP( parseInt( parts[ 3 ], 10 ) ),
            port: parseInt( parts[ 4 ], 10 ),
            length: parseInt( parts[ 5 ], 10 )
        }
    }
}
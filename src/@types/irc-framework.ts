/* eslint-disable */
/// <reference path="websocket.ts"/>

declare module 'irc-framework' {
  import { EventEmitter } from 'eventemitter3'
  import * as DuplexStream from 'stream'
  import Connection from 'irc-framework/src/transports/websocket'

  export class Client extends EventEmitter {
    constructor(options?: ClientConstructorParameters)

    private setDefaultTransport(transport: any): void

    // get Message(): ClassDecorator;//TODO
    /** Applies the default options to the options object given as impot, and returns it. */
    private _applyDefaultOptions(user_options: ClientConstructorParameters): ClientConstructorParameters

    private createStructure(): void

    /** Is connected to the IRC network and successfully registered. */
    connected: boolean

    // TODO
    /** The object for the connected message, as long as the client is connected. */ user: IrcUser

    // TODO
    /** Request */ private requestCap(capability: string): void

    use(a: any): any

    connect(connect_options?: Object): void

    /**
     * Proxy the command handler events onto the client object, with some added sugar
     * Events are handled in order:
     * 1. Received from the command handler
     * 2. Checked if any extra properties/methods are to be added to the params + re-emitted
     * 3. Routed through middleware
     * 4. Emitted from the client instance
     */
    private proxyIrcEvents(): void

    private addCommandHandlerListeners(): void

    private registerToNetwork(): void

    startPeriodicPing(): void

    raw(raw_data_line: string): void

    rawString(...parameters: Array<string>): string

    rawString(parameters: Array<string>): string

    quit(quit_message?: string): void

    ping(message?: string): void

    changeNick(nick: string): void

    sendMessage(commandName: string, target: string, message: string): string[]

    say(target: string, message: string): string[]

    notice(target: string, message: string): string[]

    join(channel: string, key?: string): void

    part(channel: string, message?: string): void

    mode(channel: string, mode: string, extra_args?: string[]): void

    private inviteList(channel: string, cb: (e: Event) => any): void

    // TODO: typeof e?
    invite(channel: string, nick: string): void

    private addInvite(channel: String, mask: string): void

    private removeInvite(channel: string, mask: string): void

    banlist(channel: string, cb: (e: Event) => any): void

    ban(channel: string, mask: string): void

    unban(channel: string, mask: string): void

    setTopic(channel: string, newTopic: string): void

    ctcpRequest(target: string, type: string, ...params: Array<any>): void

    ctcpResponse(target: string, type: string /* , params: Array<any> */): void

    action(target: string, message: string): string[]

    whowas(target: string, cb: (event: Event) => any): void

    whois(nick: string, cb: (event: any) => void): void

    /**
     * WHO requests are queued up to run serially.
     * This is mostly because networks will only reply serially and it makes
     * it easier to include the correct replies to callbacks
     */
    who(target: string, cb: (event: any) => void): void

    private list(/* params: Array<string> */): void

    channel(channel_name: string): IrcChannel

    private match(match_regex: string, cb: (event: Event) => any, message_type: string): { stop: () => void }

    private matchNotice(match_regex: string, cb: (event: Event) => any): void

    private matchMessage(match_regex: string, cb: (event: Event) => any): void

    private matchAction(match_regex: string, cb: (event: Event) => any): void

    private stringToBlocks(str: string, block_size?: number): string[]

    on(eventType: string | symbol, cb: (event?: any, another?: any) => void): this

    on(eventType: 'raw', cb: (event: RawEventArgs) => void): this

    on(eventType: 'join', cb: (event: JoinEventArgs) => void): this

    on(eventType: 'registered', cb: (event: RegisteredEventArgs) => void): this

    on(eventType: 'quit', cb: (event: QuitEventArgs) => void): this

    on(eventType: 'part', cb: (event: QuitEventArgs) => void): this

    on(eventType: 'kick', cb: (event: QuitEventArgs) => void): this

    on(eventType: 'message', cb: (event: MessageEventArgs) => any): this

    on(eventType: 'notice', cb: (event: MessageEventArgs /* TODO */) => any): this

    on(eventType: 'mode', cb: (event: ModeEventArgs) => any): this

    on(eventType: 'socket close', cb: (event: {}) => any): this

    on(eventType: 'socket connected', cb: (event: {}) => any): this

    on(eventType: 'raw socket connected', cb: (event: {}) => any): this

    on(eventType: 'server options', cb: (event: ServerOptionsEventArgs) => any): this

    on(eventType: 'debug', cb: (message: string) => any): this

    on(eventType: 'nick in use', cb: (event: NickInUseEventArgs) => any): this

    on(eventType: 'nick invalid', cb: (event: NickInvalidEventArgs) => any): this

    on(eventType: 'irc error', cb: (event: IrcErrorEventArgs) => any): this
    /**
     * @description Event triggered when .download() has finished downloading all files
     * @example
     * xdccJS.on('ready', () => {
     *    xdccJS.download('XDCC|BLUE', '23-25, 102, 300')
     *    xdccJS.download('XDCC|RED', 1152)
     * })
     *
     * xdccJS.on('done', job => {
     *    console.log(job)
     *    console.log('-----')
     * })
     *
     * // console output :
     *
     * {
     *    nick: 'XDCC|RED',
     *    success: ['file.txt'],
     *    failures: []
     * }
     * -----
     * {
     *    nick: 'XDCC|BLUE',
     *    success: [ 'file.pdf', 'video.mp4', 'audio.wav' ],
     *    failures: [ 24, 300 ]
     * }
     */
    on(eventType: 'done', cb: (job: Job) => any): this
    /**
     * @description Event triggered while a file is being downloaded
     * @example
     * xdccJS.on('downloading', fileInfo => {
     *    console.log(`${fileInfo.file} @ ${percentage}%`)
     * })
     */
    on(eventType: 'downloading', cb: (fileInfo: FileInfo, received: number, percentage: number) => any): this
    /**
     * @description Event triggered when a file is downloaded
     * @example
     * xdccJS.on('downloaded', fileInfo => {
     *    console.log('file available @: ' + fileInfo.filePath)
     * })
     */
    on(eventType: 'downloaded', cb: (fileInfo: FileInfo) => any): this
    /**
     * @description Event triggered when all downloads are done
     * @example
     * xdccJS.on('can-quit', () => {
     *    xdccJS.quit()
     * })
     */
    on(eventType: 'can-quit', cb: () => void): this
    /**
     * @description Event triggered when chunks of data are being received
     * @remark Depending on `params.path` value, returns either a `Buffer` with the acutal data or a `fileInfo` object
     * @example
     * // example with `param.path` defined as a path
     * xdccJS.once('data', (fileInfo, received) => {
     *    console.log('starting download of: ' + fileInfo.file)
     * })
     * // If you only need a console ouput just run xdccJS with: params.verbose = true.
     *
     * // CONSOLE OUPUT :
     *  //=> starting download of: myfile.mp4
     * @example
     * // example with `params.path` set to false (or undefined)
     * xdccJS.on('data', (data, received) => {
     *    stream.write(data)
     * })
     */
    on(eventType: 'data', cb: (data: FileInfo | Buffer, received: number) => void): this
    /**
     * @description Event triggered when a download/connection error happens
     * @remark This event doesn't skip retries
     * @remark fileInfo isn't provided in case of an error not related to a download
     * @example
     * xdccJS.on('error', (error, fileInfo) => {
     *    console.log('failed to download: ' + fileInfo.file)
     *    console.log(error)
     * })
     * // CONSOLE OUTPUT
     *  //=> failed to download myfile.mp'
     *  //=> timeout: no response from BOT-NICKNAME
     */
    on(eventType: 'error', cb: (error: Error) => void): this
    /**
     * @description Event triggered when xdccJS is ready to download
     * @example
     * xdccJS.on('ready', () => {
     *    xdccJS.download('BOT', '1-5, 22-35, 100, 132')
     * })
     */
    on(eventType: 'ready', cb: () => void): this
  }
  export class Message {
    // TODO: What is actually in it and what was in the event?
    constructor(command?: string, ...args: string[])

    account?: IrcUser

    group?: any

    hostname: string

    ident: string

    message: string

    nick: string

    reply(e: any): any

    tags: Object

    // any
    time?: any

    type: string
  }
  export interface MessageEventArgs {
    account?: any
    group?: any
    hostname: string
    ident: string
    message: string
    nick: string
    reply: (message: string) => void
    tags: { [key: string]: string }
    target: string
    time?: any
    type: 'privmsg' | 'action' | 'notice' // TODO
  }
  export interface FileInfo {
    /** Type of transfert (send or resume) */
    type: string
    /** Filename */
    file: string
    /** Filename with absolute path, return false if using pipes */
    filePath: string
    /** Transfert IP */
    ip: string
    /** Transfert PORT  */
    port: number
    /** File length in bytes */
    length: number
    /** Token (passive DCC) */
    token: number
    /** Resume Position */
    position?: number
  }
  export interface JoinEventArgs {
    // todo: is that wrong?
    account: boolean
    channel: string
    gecos: string
    hostname: string
    ident: string
    nick: string
    time?: any
  }
  export interface KickEventArgs {
    kicked: string
    nick: string
    ident: string
    hostname: string
    channel: string
    message: string
    time: number
  }
  export interface RawEventArgs {
    from_server: boolean
    line: string
  }
  export interface RegisteredEventArgs {
    nick: string
  }
  export interface QuitEventArgs {
    hostname: string
    ident: string
    message: string
    nick: string
    time?: any
  }
  interface Mode {
    mode: string
    param: string
  }
  export interface ModeEventArgs {
    modes: Mode[]
    nick: string
    raw_modes: string
    raw_params: string[]
    target: string
    time?: any
  }
  export interface ServerOptionsEventArgs {
    options: any
    cap: any
  }
  export interface NickInvalidEventArgs {
    nick: string
    reason: string
  }
  export interface NickInUseEventArgs {
    nick: string
    reason: string
  }
  export interface IrcErrorEventArgs {
    error: string
    channel: string
    reason: string
  }
  export interface Job {
    /**
     * @description Nick of the xdcc bot
     */
    nick: string
    /**
     * @description Array with filenames of successfully downloaded files
     */
    success: string[]
    /**
     * @description Array of pack number that failed
     */
    failures: number[]
  }
  // interface IrcUser {
  //   /**The current nick you are currently using.*/
  //   nick: string;
  //   /**Your username (ident) that the network sees you as using.*/
  //   username: string;
  //   /**Your current gecos (realname).*/
  //   gecos: string;
  //   /**On supported servers, the hostname that the networksees you are using.*/
  //   host: string;
  //   /**Your current away status. Empty for not away.*/
  //   away: string;
  //   /**A set() instance with your current message modes.*/
  //   modes: Set<string>;
  // }
  // TODO: what to call it? why is it channel.users empty after join?
  interface IrcUser {
    hostname: string
    ident: string
    modes: string[] // any[]
    nick: string
  }
  class IrcChannel extends EventEmitter {
    constructor(irc_client: Client, channel_name: string, key: string)

    irc_client: Client

    name: string

    say(message: string): string[]

    notice(message: string): string[]

    join(key?: string): void

    part(message?: string): void

    mode(mode: string, extra_args?: string[]): void

    banlist(cb: (e: Event) => any): void

    ban(mask: string): void

    unban(mask: string): void

    users: IrcUser[]

    /**
     * Relay messages between this channel to another
     * @param  {IrcChannel|String} target_chan Target channel
     * @param  {Object} opts        Extra options
     *
     * opts may contain the following properties:
     * one_way (false) Only relay messages to target_chan, not the reverse
     * replay_nicks (true) Include the sending nick as part of the relayed message
     */
    relay(target_chan: IrcChannel | String, opts: Object): void

    stream(stream_ops: Object): DuplexStream

    updateUsers(cb: (channel: IrcChannel) => any): void

    on(eventType: 'channel info', cb: (event: ChannelInfoEventArgs) => any): this

    on(eventType: string | symbol, cb: (event: any) => any): this
  }
  export interface ChannelInfoEventArgs {
    channel: string
    created_at?: number
    modes?: Mode[] // TODO: check type
    url?: string
  }
  export interface UserListEventArgs {
    channel: string
    users: IrcUser[] // TODO: check type
  }
  export interface WhoListEventArgs {
    target: string
    users: IrcUser[] // TODO: check type
  }
  export interface BanlistEventArgs {
    channel: string
    bans: IrcUser[] // TODO: check type
  }
  export interface TopicEventArgs {
    channel: string
    topic: string
    nick?: string
    time?: number
  }
  export interface TopicSetByEventArgs {
    channel: string
    nick: string
    ident: string
    hostname: string
    when?: number
  }
  interface ClientConstructorParameters {
    host: string // host?: (?)
    nick?: string
    username?: string
    gecos?: string
    encoding?: string
    version?: string
    enable_chghost?: boolean
    enable_echomessage?: boolean
    message_max_length?: number
    auto_reconnect?: boolean
    auto_reconnect_wait?: number
    auto_reconnect_max_retries?: number
    ping_interval?: number
    ping_timeout?: number
    transport?: new (options: any) => Connection
    tls?: boolean
    webirc?: {
      password?: string
      username?: string
      hostname?: string
      ip?: string
    }
  }
}

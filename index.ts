/* eslint-disable @typescript-eslint/member-delimiter-style */
/* eslint-disable @typescript-eslint/no-this-alias */
/* eslint-disable @typescript-eslint/triple-slash-reference */
/// <reference path="@types/irc-framework.ts"/>
import { Client } from 'irc-framework'
import * as fs from 'fs'
import * as path from 'path'
import * as net from 'net'
import * as http from 'http'
import * as ProgressBar from 'progress'
/**
 * XDCC
 * @noInheritDoc
 */
export default class XDCC extends Client {
	private nick: string
	private chan: string[]
	/**
	 * Download path (absolute or relative) <br/>
	 * default value inherited from {@link constructor}'s parameter {@link Params.path}
	 * @see {@link download}
	 * @example
	 * ```js
	 * // setting path when instantiating :
	 * param.path = '/home/user/downloads'
	 * const xdccJS = new XDCC(param)
	 * ```
	 * @example
	 * ```js
	 * // same with relative path
	 * param.path = 'downloads' //=> /your/project/path/downloads
	 * const xdccJS = new XDCC(param)
	 * ```
	 * @example
	 * ```js
	 * param.path = 'downloads'
	 * const xdccJS = new XDCC(param)
	 *
	 * // ... later in your code
	 *  xdccJS.path = '/another/path'
	 * ```
	 */
	public path: false | string
	private verbose: boolean
	/**
	 * Array of port(s) to use for passive DCCs <br/>
	 * number of port determine how many passive dcc you can run in parallel. <br/>
	 * default value : `[5001]`
	 */
	private passivePort: number[] = [5001]
	private portInUse: number[] = []
	private ip!: number
	private timeouts!: NodeJS.Timeout
	/**
	 * Initiate IRC connection
	 * @remark {@link Params.path} sets {@link XDCC.path} property
	 * @example
	 * ```javascript
	 * let opts = {
	 *  host: 'irc.server.net',
	 *  nick: 'JiPaix',
	 *  chan: ['#itsMe', '#JiPaix' ],
	 *  path: 'downloads',
	 *  verbose: true,
	 *  randomizeNick: true,
	 *  passivePort : [5001, 5002, 5003]
	 * }
	 *
	 * const xdccJS = new XDCC(opts)
	 * ```
	 * @fires {@link xdcc-ready}
	 */
	constructor(parameters: Params) {
		super()
		this._is('host', parameters.host, 'string')
		this._is('port', parameters.port, 'number')
		this._is('nick', parameters.nick, 'string')
		if (
			this._is(
				'randomizeNick',
				parameters.randomizeNick,
				'boolean',
				false
			)
		) {
			this.nick = this.nickRandomizer(parameters.nick)
		} else {
			this.nick = parameters.nick
		}
		this.verbose = this._is('verbose', parameters.verbose, 'boolean', false)
		parameters.passivePort = this._is(
			'passivePort',
			parameters.passivePort,
			'object',
			[5001]
		)
		parameters.path = this._is('path', parameters.path, 'string', false)
		if (typeof parameters.path === 'string') {
			this.path = path.normalize(parameters.path)
			if (!path.isAbsolute(this.path)) {
				this.path = path.join(path.resolve('./'), parameters.path)
			}
			if (!fs.existsSync(this.path)) {
				fs.mkdirSync(this.path, {
					recursive: true,
				})
			}
		} else {
			this.path = false
		}
		if (typeof parameters.chan === 'string') {
			this.chan = [this.checkHashtag(parameters.chan, true)]
		} else if (Array.isArray(parameters.chan)) {
			this.chan = parameters.chan
		} else {
			throw TypeError(
				`unexpected type of 'chan': an array of strings was expected'`
			)
		}
		this.getRemIP((ip: number) => {
			this.ip = ip
		})
		this.connect({
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
		})
		this.live(parameters.host)
	}
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private _is(name: string, variable: any, type: string, def?: any): any {
		if (typeof variable !== type) {
			if (typeof def === 'undefined') {
				throw TypeError(
					`unexpected type of '${name}': a ${type} was expected but got '${typeof variable}'`
				)
			} else {
				return def
			}
		} else {
			return variable
		}
	}
	private getRemIP(cb: { (ip: number): void }): void {
		const options = {
			host: 'ipv4bot.whatismyipaddress.com',
			port: 80,
			path: '/',
		}
		http.get(options, (res) => {
			let data = ''
			res.on('data', (chunk) => {
				data = data + chunk
			})
			res.on('end', () => {
				const b = Buffer.from(data).toString()
				const d = b.split('.')
				const res = ((+d[0] * 256 + +d[1]) * 256 + +d[2]) * 256 + +d[3]
				cb(res)
			})
		})
		return
	}

	private live(ircServer: string): void {
		const self = this
		this.on('connected', () => {
			for (let index = 0; index < this.chan.length; index++) {
				const channel = this.channel(
					this.checkHashtag(this.chan[index], true)
				)
				channel.join()
			}
			if (this.verbose) {
				console.log(
					`\x1b[1m\x1b[32m\u2713\x1b[0m connected to: \x1b[33m${ircServer}\x1b[0m`
				)
				console.log(
					`\u2937`.padStart(2),
					`\x1b[1m\x1b[32m\u2713\x1b[0m joined: ${this.chan.map(
						(e) => `\x1b[33m#${e}\x1b[0m`
					)}`
				)
			}
			self.emit('xdcc-ready')
		})
		this.on(
			'request',
			(args: { target: string; packet: string | number }) => {
				this.say(args.target, `xdcc send ${args.packet}`)
				if (this.verbose) {
					console.log(
						`\u2937`.padStart(4),
						`\x1b[1m\x1b[32m\u2713\x1b[0m sending command: /MSG \x1b[33m${args.target}\x1b[0m xdcc send \x1b[33m${args.packet}\x1b[0m`
					)
				}
				this.timeouts = setTimeout(() => {
					this.say(args.target, 'XDCC CANCEL')
					if (this.verbose) {
						console.log(
							`\u2937`.padStart(6),
							`\x1b[1m\x1b[31m\u0058\x1b[0m timeout: No response from \x1b[33m${args.target}\x1b[0m`
						)
					}
				}, 10000)
			}
		)
		this.on(
			'request-batch',
			(args: { target: string; packet: number[] }) => {
				if (!this.path) {
					throw new Error(
						`downloadBatch() can't be used in pipe mode.`
					)
				}
				let i = 0
				if (i < args.packet.length) {
					this.say(args.target, `xdcc send ${args.packet[i]}`)
					if (this.verbose) {
						console.log(
							`\u2937`.padStart(4),
							`\x1b[1m\x1b[32m\u2713\x1b[0m sending command: /MSG \x1b[33m${args.target}\x1b[0m xdcc send \x1b[33m${args.packet[i]}\x1b[0m`
						)
					}
					i++
				}
				this.on('downloaded', () => {
					if (i < args.packet.length) {
						this.say(args.target, `xdcc send ${args.packet[i]}`)
						if (this.verbose) {
							console.log(
								`\u2937`.padStart(4),
								`\x1b[1m\x1b[32m\u2713\x1b[0m sending command: /MSG \x1b[33m${args.target}\x1b[0m xdcc send \x1b[33m${args.packet[i]}\x1b[0m`
							)
						}
						i++
					} else {
						this.emit('batch-complete', args)
					}
				})
			}
		)
		this.on('ctcp request', (resp: { [prop: string]: string }): void => {
			if (typeof resp.message !== 'string') {
				throw new TypeError(`CTCP MSG: ${resp.message}`)
			}
			if (this.path) {
				this.downloadToFile(resp)
			} else {
				this.downloadToPipe(resp)
			}
		})
	}

	private downloadToPipe(resp: { [prop: string]: string }): void {
		const self = this
		const fileInfo = this.parseCtcp(resp.message)
		let received = 0
		const sendBuffer = Buffer.alloc(4)
		const available = this.passivePort.filter(
			(port) => !this.portInUse.includes(port)
		)
		const pick = available[Math.floor(Math.random() * available.length)]
		let timeout: NodeJS.Timeout
		const bar = this.setupProgressBar(fileInfo.length)
		clearTimeout(this.timeouts)
		if (fileInfo.port === 0) {
			const server = net.createServer((client) => {
				timeout = setTimeout(() => {
					server.close(() => {
						this.portInUse = this.portInUse.filter(
							(p) => p !== pick
						)
						this.emit(
							'pipe-err',
							new Error('CONNTIMEOUT: No initial connection'),
							fileInfo
						)
					})
				}, 10000)
				this.emit('pipe-start', fileInfo)
				client.on('data', (data) => {
					clearTimeout(timeout)
					received += data.length
					sendBuffer.writeUInt32BE(received, 0)
					client.write(sendBuffer)
					self.emit('pipe-data', data, received)
					if (this.verbose) {
						bar.tick(data.length)
					}
					timeout = setTimeout(() => {
						server.close(() => {
							this.portInUse = this.portInUse.filter(
								(p) => p !== pick
							)
							const err = new Error(
								'CONNTIMEOUT: not receiving data'
							)
							this.say(resp.nick, 'XDCC CANCEL')
							this.emit('download-err', err, fileInfo)
							if (this.verbose) {
								bar.interrupt(err.message)
							}
						})
					}, 2000)
				})
				client.on('end', () => {
					clearTimeout(timeout)
					server.close(() => {
						this.portInUse = this.portInUse.filter(
							(p) => p !== pick
						)
						self.emit('pipe-downloaded', fileInfo)
						if (this.verbose) {
							console.log(`pipe download done`)
						}
					})
				})
				client.on('error', (err) => {
					clearTimeout(timeout)
					server.close(() => {
						this.portInUse = this.portInUse.filter(
							(p) => p !== pick
						)
						this.say(resp.nick, 'XDCC CANCEL')
						self.emit('pipe-err', err, fileInfo)
						if (this.verbose) {
							bar.interrupt(err.message)
						}
					})
				})
			})
			server.on('listening', () => {
				this.raw(
					`PRIVMSG ${resp.nick} ${String.fromCharCode(1)}DCC SEND ${
						fileInfo.file
					} ${this.ip} ${pick} ${fileInfo.length} ${
						fileInfo.token
					}${String.fromCharCode(1)}`
				)
			})
			if (pick) {
				this.portInUse.push(pick)
				server.listen(pick, '0.0.0.0')
			} else {
				server.close(() => {
					this.portInUse = this.portInUse.filter((p) => p !== pick)
					this.say(resp.nick, 'XDCC CANCEL')
					const err = new Error(
						'All passive ports are currently used'
					)
					self.emit('pipe-err', err, fileInfo)
					if (this.verbose) {
						bar.interrupt(err.message)
					}
				})
			}
			server.on('error', (err) => {
				clearTimeout(timeout)
				server.close(() => {
					this.portInUse = this.portInUse.filter((p) => p !== pick)
					this.say(resp.nick, 'XDCC CANCEL')
					self.emit('pipe-err', err, fileInfo)
					if (this.verbose) {
						bar.interrupt(err.message)
					}
				})
			})
		} else {
			let timeout = setTimeout(() => {
				const err = new Error('CONNTIMEOUT: No initial connection')
				this.emit('download-err', err, fileInfo)
				if (this.verbose) {
					console.log(
						`\u2937`.padStart(6),
						`\x1b[1m\x1b[31m\u0058\x1b[0m couldn't connect to: \x1b[33m${fileInfo.ip}:${fileInfo.port}\x1b[0m`
					)
				}
			}, 10000)
			const client = net.connect(fileInfo.port, fileInfo.ip)
			client.on('connect', () => {
				self.emit('pipe-start', fileInfo)
				clearTimeout(timeout)
				timeout = setTimeout(() => {
					const err = new Error(
						'connection timeout: no receiving data '
					)
					this.say(resp.nick, 'XDCC CANCEL')
					this.emit('download-err', err, fileInfo)
					if (this.verbose) {
						bar.interrupt(
							`\u2937`.padStart(8) +
								' \x1b[1m\x1b[31m\u0058\x1b[0m ' +
								err.message
						)
					}
				}, 2000)
				if (this.verbose) {
					console.log(
						`\u2937`.padStart(6),
						`\x1b[1m\x1b[32m\u2713\x1b[0m opening connection with bot: \x1b[33m${fileInfo.ip}:${fileInfo.port}\x1b[0m`
					)
				}
			})
			client.on('data', (data) => {
				clearTimeout(timeout)
				received += data.length
				sendBuffer.writeUInt32BE(received, 0)
				client.write(sendBuffer)
				self.emit('pipe-data', data, received)
				timeout = setTimeout(() => {
					const err = new Error(
						'connection timeout: no receiving data '
					)
					this.say(resp.nick, 'XDCC CANCEL')
					this.emit('pipe-err', err, fileInfo)
					if (this.verbose) {
						bar.interrupt(
							`\u2937`.padStart(8) +
								' \x1b[1m\x1b[31m\u0058\x1b[0m ' +
								err.message
						)
					}
				}, 2000)
				if (this.verbose) {
					bar.tick(data.length)
				}
			})
			client.on('end', () => {
				clearTimeout(timeout)
				self.emit('pipe-downloaded', fileInfo)
				if (this.verbose) {
					console.log(
						`\u2937`.padStart(8),
						`\x1b[1m\x1b[32m\u2713\x1b[0m done: \x1b[36m${fileInfo.file}\x1b[0m`
					)
				}
			})
			client.on('error', (err) => {
				this.say(resp.nick, 'XDCC CANCEL')
				self.emit('pipe-err', err, fileInfo)
			})
		}
	}

	private downloadToFile(resp: { [prop: string]: string }): void {
		const self = this
		const fileInfo = this.parseCtcp(resp.message)
		if (
			typeof fileInfo.filePath === 'undefined' ||
			fileInfo.filePath === null
		) {
			throw Error('filePath must be defined')
		}
		if (fs.existsSync(fileInfo.filePath)) {
			if (fs.statSync(fileInfo.filePath).size === fileInfo.length) {
				clearTimeout(this.timeouts)
				this.say(resp.nick, 'XDCC CANCEL')
				if (this.verbose) {
					console.log(
						`\u2937`.padStart(8),
						`\x1b[1m\x1b[32m\u2713\x1b[0m done: \x1b[36m${fileInfo.filePath}\x1b[0m`
					)
				}
				self.emit('downloaded', fileInfo)
				return
			} else {
				fs.unlinkSync(fileInfo.filePath)
			}
		}
		const timeout = setTimeout(() => {
			this.say(resp.nick, 'XDCC CANCEL')
			const err = new Error('CONNTIMEOUT: No initial connection')
			this.emit('download-err', err, fileInfo)
			if (this.verbose) {
				console.log(
					`\u2937`.padStart(6),
					`\x1b[1m\x1b[31m\u0058\x1b[0m couldn't connect to: \x1b[33m${fileInfo.ip}:${fileInfo.port}\x1b[0m`
				)
			}
		}, 10000)
		const file = fs.createWriteStream(fileInfo.filePath)
		file.on('ready', () => {
			if (fileInfo.port === 0) {
				clearTimeout(timeout)
				clearTimeout(this.timeouts)
				this.passiveToFile(file, fileInfo, timeout, resp.nick)
			} else {
				clearTimeout(this.timeouts)
				this.activeToFile(file, fileInfo, timeout, resp.nick)
			}
		})
	}
	private setupProgressBar(len: number): ProgressBar {
		return new ProgressBar(
			`\u2937`.padStart(6) +
				' \x1b[1m\x1b[32m\u2713\x1b[0m downloading [:bar] :rate/s :percent :etas',
			{
				complete: '=',
				incomplete: ' ',
				width: 20,
				total: len,
			}
		)
	}
	private activeToFile(
		file: fs.WriteStream,
		fileInfo: FileInfo,
		timeout: NodeJS.Timeout,
		nick: string
	): void {
		const bar = this.setupProgressBar(fileInfo.length)
		const self = this
		let received = 0
		const sendBuffer = Buffer.alloc(4)
		const client = net.connect(fileInfo.port, fileInfo.ip)
		client.on('connect', () => {
			self.emit('download-start', fileInfo)
			clearTimeout(timeout)
			timeout = setTimeout(() => {
				const err = new Error('connection timeout: no receiving data ')
				this.say(nick, 'XDCC CANCEL')
				this.emit('download-err', err, fileInfo)
				if (this.verbose) {
					bar.interrupt(
						`\u2937`.padStart(8) +
							' \x1b[1m\x1b[31m\u0058\x1b[0m ' +
							err.message
					)
				}
			}, 2000)
			if (this.verbose) {
				console.log(
					`\u2937`.padStart(6),
					`\x1b[1m\x1b[32m\u2713\x1b[0m opening connection with bot: \x1b[33m${fileInfo.ip}:${fileInfo.port}\x1b[0m`
				)
			}
		})
		client.on('data', (data) => {
			clearTimeout(timeout)
			file.write(data)
			received += data.length
			sendBuffer.writeUInt32BE(received, 0)
			client.write(sendBuffer)
			self.emit('downloading', received, fileInfo)
			timeout = setTimeout(() => {
				const err = new Error('connection timeout: no receiving data ')
				this.say(nick, 'XDCC CANCEL')
				this.emit('download-err', err, fileInfo)
				if (this.verbose) {
					bar.interrupt(
						`\u2937`.padStart(8) +
							' \x1b[1m\x1b[31m\u0058\x1b[0m ' +
							err.message
					)
				}
			}, 2000)
			if (this.verbose) {
				bar.tick(data.length)
			}
		})
		client.on('end', () => {
			file.end()
			clearTimeout(timeout)
			if (this.verbose) {
				console.log(
					`\u2937`.padStart(8),
					`\x1b[1m\x1b[32m\u2713\x1b[0m done: \x1b[36m${file.path}\x1b[0m`
				)
			}
			self.emit('downloaded', fileInfo)
		})
		client.on('error', (err) => {
			file.end()
			this.say(nick, 'XDCC CANCEL')
			self.emit('download-err', err, fileInfo)
		})
	}

	private passiveToFile(
		file: fs.WriteStream,
		fileInfo: FileInfo,
		timeout: NodeJS.Timeout,
		nick: string
	): void {
		const bar = this.setupProgressBar(fileInfo.length)
		const self = this
		let received = 0
		const sendBuffer = Buffer.alloc(4)
		const available = this.passivePort.filter(
			(port) => !this.portInUse.includes(port)
		)
		const pick = available[Math.floor(Math.random() * available.length)]
		const server = net.createServer((client) => {
			this.emit('download-start', fileInfo)
			client.on('data', (data) => {
				clearTimeout(timeout)
				file.write(data)
				received += data.length
				sendBuffer.writeUInt32BE(received, 0)
				client.write(sendBuffer)
				self.emit('downloading', received, fileInfo)
				timeout = setTimeout(() => {
					server.close(() => {
						this.portInUse = this.portInUse.filter(
							(p) => p !== pick
						)
						const err = new Error(
							'connection timeout: no receiving data '
						)
						this.say(nick, 'XDCC CANCEL')
						this.emit('download-err', err, fileInfo)
						if (this.verbose) {
							bar.interrupt(
								`\u2937`.padStart(8) +
									' \x1b[1m\x1b[31m\u0058\x1b[0m ' +
									err.message
							)
						}
					})
				}, 2000)
				if (this.verbose) {
					bar.tick(data.length)
				}
			})
			client.on('end', () => {
				file.end()
				clearTimeout(timeout)
				server.close(() => {
					this.portInUse = this.portInUse.filter((p) => p !== pick)
					if (this.verbose) {
						console.log(
							`\u2937`.padStart(8),
							`\x1b[1m\x1b[32m\u2713\x1b[0m done: \x1b[36m${file.path}\x1b[0m`
						)
					}
					self.emit('downloaded', fileInfo)
				})
			})
			client.on('error', (err) => {
				clearTimeout(timeout)
				file.end()
				server.close(() => {
					this.portInUse = this.portInUse.filter((p) => p !== pick)
					this.say(nick, 'XDCC CANCEL')
					self.emit('download-err', err, fileInfo)
					if (this.verbose) {
						bar.interrupt(
							`\u2937`.padStart(8) +
								' \x1b[1m\x1b[31m\u0058\x1b[0m ' +
								err.message
						)
					}
				})
			})
		})
		if (pick) {
			this.portInUse.push(pick)
			server.listen(pick, '0.0.0.0')
		} else {
			this.say(nick, 'XDCC CANCEL')
			const err = new Error('All passive ports are currently used')
			self.emit('download-err', err, fileInfo)
			if (this.verbose) {
				console.log(
					`\u2937`.padStart(6),
					`\x1b[1m\x1b[31m\u0058\x1b[0m all passive ports are currently used: \x1b[33m${fileInfo.ip}:${fileInfo.port}\x1b[0m`
				)
			}
		}
		server.on('listening', () => {
			this.raw(
				`PRIVMSG ${nick} ${String.fromCharCode(1)}DCC SEND ${
					fileInfo.file
				} ${this.ip} ${pick} ${fileInfo.length} ${
					fileInfo.token
				}${String.fromCharCode(1)}`
			)
			if (this.verbose) {
				console.log(
					`\u2937`.padStart(6),
					`\x1b[1m\x1b[32m\u2713\x1b[0m listening for passive download at: \x1b[33m${this.ip}:${pick}\x1b[0m`
				)
			}
		})
		server.on('error', (err) => {
			file.end()
			server.close(() => {
				this.portInUse = this.portInUse.filter((p) => p !== pick)
				this.say(nick, 'XDCC CANCEL')
				self.emit('download-err', err, fileInfo)
				if (this.verbose) {
					console.log(
						`\u2937`.padStart(6),
						`\x1b[1m\x1b[31m\u0058\x1b[0m couldn't setup a passive transfert: \x1b[33m${err}\x1b[0m`
					)
				}
			})
		})
	}
	/**
	 * Method used to download a single packet.<br/><br/>
	 * @param target Bot's nickname
	 * @param packet Packet
	 * @remark Fires either download or pipe events depending on {@link path}'s value
	 * @fires {@link download-err| Download Events}
	 * @fires {@link pipe-data| Pipe Events}
	 * @see {@link path}
	 * @example
	 * ```javascript
	 * xdccJS.download('XDCC|Bot', 152)
	 * ```
	 */
	public download(target: string, packet: string | number): void {
		packet = this.checkHashtag(packet, false)
		this.emit('request', {
			target,
			packet,
		})
	}
	/**
	 * Method used to download multiple packets
	 * @param target Bot's nickname
	 * @param packets Packets
	 * @remark Fires either download or pipe events depending on {@link path}'s value
	 * @fires {@link download-err| Download Events}
	 * @fires {@link pipe-data| Pipe Events}
	 * @fire {@link batch-complete}
	 * @see {@link path}
	 * @example
	 * ```javascript
	 * xdccJS.downloadBatch('XDCC|Bot', '1-10, 25-27, 30')
	 * // accepts array of numbers too, (strings are converted to number)
	 * xdccJS.downloadBatch('XDCC|Bot', [1, 2, 3, '24', 32, 33, 35])
	 * ```
	 */
	public downloadBatch(
		target: string,
		packets: string | number[] | string[]
	): void {
		const range: number[] = []
		if (typeof packets === 'string') {
			const packet = packets.split(',')
			for (const s of packet) {
				const minmax = s.split('-')
				if (s.includes('-')) {
					for (let i = +minmax[0]; i <= +minmax[1]; i++) {
						range.push(i)
					}
				} else {
					range.push(parseInt(s))
				}
			}
		} else {
			if (Array.isArray(packets)) {
				for (const pack of packets) {
					if (typeof pack === 'number') {
						range.push(pack)
					} else {
						range.push(parseInt(pack))
					}
				}
			}
		}

		if (this.verbose) {
			console.log(
				`\u2937`.padStart(4),
				`\x1b[1m\x1b[36m\u2139\x1b[0m batch download of packets: \x1b[33m${packets}\x1b[0m`
			)
		}
		this.emit('request-batch', {
			target: target,
			packet: range,
		})
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

	private checkHashtag(value: string | number, isChannel: boolean): string {
		if (isChannel) {
			if (typeof value === 'string') {
				if (value.charAt(0) === '#') {
					return value
				} else {
					return `#${value}`
				}
			} else if (typeof value === 'number') {
				return value.toString()
			} else {
				throw TypeError(
					`unexpected type of 'chan': a string|number was expected but got '${typeof value}'`
				)
			}
		} else {
			if (typeof value === 'number') {
				if (value % 1 === 0) {
					return `#${value.toString()}`
				} else {
					throw TypeError(
						`unexpected 'package': number must be an integer'`
					)
				}
			} else if (typeof value === 'string') {
				const isPack = RegExp(
					/^\d+-\d+$|^#\d+-\d+$|^\d+$|^#\d+$/gm
				).test(value)
				if (isPack) {
					return value
				} else {
					throw new TypeError(
						`unexpected 'package': string must be '100' or '#100' or '100-102' or '#102-102'`
					)
				}
			} else {
				throw new TypeError(
					`unexpected type of 'package': a string|number was expected but got ${typeof value}`
				)
			}
		}
	}

	private uint32ToIP(n: number): string {
		const byte1 = n & 255,
			byte2 = (n >> 8) & 255,
			byte3 = (n >> 16) & 255,
			byte4 = (n >> 24) & 255
		return byte4 + '.' + byte3 + '.' + byte2 + '.' + byte1
	}

	private parseCtcp(text: string): FileInfo {
		const parts = text.match(/(?:[^\s"]+|"[^"]*")+/g)
		if (parts === null) {
			throw new TypeError(`CTCP : received unexpected msg : ${text}`)
		}
		if (
			parts.some((val) => {
				return val === null
			})
		) {
			throw new TypeError(`CTCP : received unexpected msg : ${text}`)
		}
		return {
			file: parts[2].replace(/"/g, ''),
			filePath: path.normalize(
				this.path + '/' + parts[2].replace(/"/g, '')
			),
			ip: this.uint32ToIP(parseInt(parts[3], 10)),
			port: parseInt(parts[4], 10),
			length: parseInt(parts[5], 10),
			token: parseInt(parts[6], 10),
		}
	}
	/**
	 * Event triggered when xdccJS is ready to download
	 * @event xdcc-ready
	 * @example
	 * ```js
	 * xdccJS.on('xdcc-ready', () => {
	 *  xdccJS.download('XDCC|BOT', 23)
	 * })
	 * ```
	 */
	static EVENT_XDCC_READY: () => void
	/**
	 * Event triggered when a download starts.
	 * @category Download
	 * @event download-start
	 * @example
	 * ```js
	 * xdccJS.on('download-start', (f) => {
	 *   console.log(`Starting download of ${f.file}`)
	 * })
	 * ```
	 */
	static EVENT_XDCC_START: (f: FileInfo) => void
	/**
	 * Event triggered when chunks of data are being received
	 * @category Download
	 * @event downloading
	 * @example
	 * ```js
	 * xdccJS.on('downloading', (r, f) => {
	 *   console.log(`${f.file} - ${r}/${FileInfo.length} Bytes`)
	 * })
	 */
	static EVENT_XDCC_WHILE: (r: received, f: FileInfo) => void
	/**
	 * Event triggered when a download fails.
	 * @category Download
	 * @event download-err
	 * @example
	 * ```js
	 * xdccJS.on('download-err', (e, f) => {
	 *   console.log(`failed to download ${f.file}`)
	 *   console.log(e)
	 * })
	 * ```
	 */
	static EVENT_XDCC_ERR: (e: Error, f: FileInfo) => void
	/**
	 * Event triggered when a download is completed.
	 * @category Download
	 * @event downloaded
	 * @example
	 * ```js
	 * xdccJS.on('downloaded', (f) => {
	 *   console.log(`Download completed: ${f.filePath}`)
	 * })
	 * ```
	 */
	static EVENT_XDCC_DONE: (f: FileInfo) => void
	/**
	 * Event triggered when {@link downloadBatch} has completed all downloads
	 * @event batch-complete
	 * @example
	 * ```js
	 * xdccJS.on('xdcc-ready', () => {
	 *  xdccJS.downloadBatch('XDCC|BOT', '23-25, 102, 300')
	 * })
	 * 
	 * xdccJS.on('batch-complete', (batchInfo) => {
	 * 	console.log(batchInfo) //=> { target: 'XDCC|BOT', packet: [23, 24, 25, 102, 300] }
	 * })
	 * ```
	 */
	static EVENT_XDCC_BATCH: (i: batchInfo) => void
	/**
	 * Event triggered when a pipable download starts. callback returns {@link FileInfo}
	 * @category Pipe
	 * @event pipe-start
	 * @example
	 * ```js
	 * xdccJS.on('pipe-start', (f) => {
	 *   console.log(`File length  : ${f.length}`)
	 * })
	 * ```
	 */
	static EVENT_PIPE_START: (f: FileInfo) => void
	/**
	 * Event triggered when receiving data from a piped download.
	 * @category Pipe
	 * @event pipe-data
	 * @example
	 * ```js
	 * let stream = fs.createWriteStream( 'MyFile.mp4' )
	 * xdccJS.on('pipe-data', (chunk, r) => {
	 *   stream.write(chunk)
	 *   console.log(`Downloaded ${stream.length} out of ${r}`)
	 * })
	 * ```
	 */
	static EVENT_PIPE_DATA: (chunk: Buffer, r: received) => void
	/**
	 * Event triggered when a piped download has failed. Callback returns Error and {@link FileInfo}
	 * @category Pipe
	 * @event pipe-err
	 * @example
	 * ```js
	 * let file = fs.createWriteStream( 'MyFile.mp4' )
	 * xdccJS.on('pipe-err', (e, f) => {
	 *   file.end()
	 *   console.log(`failed to download : ${f.file}`)
	 *   console.log(e)
	 * })
	 * ```
	 */
	static EVENT_PIPE_ERR: (e: Error, f: FileInfo) => void
	/**
	 * Event triggered when a pipable download is done. Callback returns {@link FileInfo}
	 * @category Pipe
	 * @event pipe-downloaded
	 * @example
	 * ```js
	 * let file = fs.createWriteStream( 'MyFile.mp4' )
	 * xdccJS.on('pipe-downloaded', (e, f) => {
	 *   file.end()
	 * })
	 * ```
	 */
	static EVENT_PIPE_DONE: (f: FileInfo) => void
}

/**
 * Parameters for {@link XDCC.constructor}
 * @asMemberOf XDCC
 */
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

/**
 * File informations
 * @asMemberOf XDCC
 */
declare interface FileInfo {
	/** Filename */
	file: string
	/** Filename with absolute path */
	filePath?: string
	/** Transfert IP */
	ip: string
	/** Transfert PORT  */
	port: number
	/** File length in bytes */
	length: number
	/** Token (passive DCC) */
	token: number
}

/**
 * Batch information
 * @asMemberOf XDCC
 */
declare interface batchInfo {
	/** Bot username */
	target: string
	/** Filename with absolute path */
	packet: number[]
}
/**
 * Accumulated lenght of data received*
 * @asMemberOf XDCC
 */
declare type received = number

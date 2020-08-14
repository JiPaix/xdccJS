/**
 * Parameters for {@link XDCC.constructor}
 * @asMemberOf XDCC
 */

export interface checkedParams {
  /**
   * @description IRC server's hostname
   * @example
   * ```js
   * params.host = 'irc.server.net'
   * ```
   */
  host: string
  /**
   * @description IRC server PORT
   * @default `6667`
   * @example
   * ```js
   * params.port = 6669
   * ```
   */
  port: number
  /**
   * @description Nickname to use on IRC
   * @example
   * ```js
   * params.nick = 'JiPaix'
   * ```
   */
  nick: string
  /**
   * @description Channel(s) to join
   * @remark Hashtags are optional
   * @example
   * ```js
   * params.chan = '#wee'
   * // can also be an array
   * params.chan = ['#wee', '#happy']
   * // in both cases # are optional
   * params.chan = 'weee'
   * params.chan = ['#wee', 'happy']
   * ```
   */
  chan: string[]
  /**
   * @description Download path
   * @default `false`
   * @remark `undefined` or `false` enables piping, see {@link XDCC.download} for example on how to use pipes.
   * @example
   * ```js
   * // absolute path
   * params.path = '/home/user/downloads
   * ```
   * @example
   * ```js
   * // relative path
   * params.path = 'downloads/xdcc' //=> /your/project/folder/downloads/xdcc
   * ```
   * @example
   * ```js
   * // explicitly enable piping
   * params.path = false
   * ```
   * */
  path: string | false
  /**
   * @description Display information regarding your download in console
   * @default `false`
   * @example
   * ```js
   * params.verbose = true
   * ```
   */
  verbose: boolean
  /**
   * @description Array of ports for passive DCC
   * @default `[5001]`
   * @remark Some xdcc bots use passive dcc, this require to have these ports opened on your computer/router/firewall
   * @example
   * ```js
   * params.passivePort = [3833, 2525]
   */
  passivePort: number[]
  /**
   * @description Number of retries when a download fails
   * @default `1`
   * @example
   * ```js
   * // we've set params.retry = 2
   * xdccJS.download('xdcc|bot', '20, 25')
   * // if download of pack '20' fails it will retry twice before skipping to pack '25'
   */
  retry: number
}

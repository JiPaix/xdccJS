import { FileInfo } from './fileinfo'
import { PassThrough } from 'stream'
import * as net from 'net'
import * as fs from 'fs'

/**
 * @ignore
 */
export interface Candidate {
  /**
   * @ignore
   */
  cancel?: () => void

  /**
   * @description Nickname of the bot
   */
  nick: string
  /**
   * @description Pack number in queue
   */
  queue: number[]
  /**
   * @ignore
   */
  timeout: {
    bar?: ProgressBar
    fileInfo?: FileInfo
    to?: NodeJS.Timeout
    eventType?: string
    message?: string
    padding?: number
    delay?: number
    fn?: () => void
    stream?: fs.WriteStream | PassThrough
    server?: net.Server
    socket?: net.Socket
    pick?: number
    clear: () => void
  }
  /**
   * @description Package number currently downloading
   */
  now: number
  /**
   * @description Nb of retries on `now`
   */
  retry: number
  /**
   * @description Array with pack number that failed after x `retry`
   */
  failures: number[]
  /**
   * @description Array of file (filenames) that successfully downloaded
   */
  success: string[]
}

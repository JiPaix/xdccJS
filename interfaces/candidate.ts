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
  timeout?: NodeJS.Timeout
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

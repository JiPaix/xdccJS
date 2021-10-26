export interface Candidate {
  /**
   * Cancel function
   */
  cancel?: () => void

  /**
   * Nickname of the bot
   */
  nick: string
  /**
   * Nickname of the bot cancel request should be sent (same as nick most of the time)
   */
  cancelNick: string
  /**
   * Pack number in queue
   */
  queue: number[]
  /**
   * @ignore
   */
  timeout: {
    clear: () => void
  }
  /**
   * Package number currently downloading
   */
  now: number
  /**
   * Nb of retries on `now`
   */
  retry: number
  /**
   * Array with pack number that failed after x `retry`
   */
  failures: number[]
  /**
   * Array of file (filenames) that successfully downloaded
   */
  success: string[]
}

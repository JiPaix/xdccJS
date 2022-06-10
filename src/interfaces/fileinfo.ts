/**
 * File informations
 * @asMemberOf XDCC
 */
export type FileInfo = {
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
  token: number|string
  /** Resume Position */
  position?: number
}

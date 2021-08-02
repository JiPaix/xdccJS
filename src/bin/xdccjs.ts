import XDCC, { Params } from '../index'
import { BinError } from './errorhandler'
import { Profiles } from './profiles'
import { Connect } from '../connect'
import { savedParams } from './commander'

export class XdccJSbin extends Profiles {
  constructor() {
    super()
    const lazyArgs = this.isCopyPasteARGV()
    if(lazyArgs) {
      this.lazy(lazyArgs)
    } else {
      this.profileAction()
      this.main()
    }
  }

  private isLazySyntaxCorrect(match: RegExpExecArray): boolean {
    if (match[1].toLowerCase() === 'msg' && match[3].toLowerCase() === 'xdcc' && match[4].toLowerCase() === 'send') {
      return true
    } else {
      return false
    }
  }

  private lazy(match: RegExpExecArray): void {
    if (typeof this.defaultProfile === 'undefined') {
      throw new BinError('%info% You need to setup a profile first in order to use copy paste method')
    } else {
      if (this.isLazySyntaxCorrect(match)) {
        this.program.bot = match[2]
        this.program.download = [match[5]]
        this.downloadWith(this.defaultProfile)
      } else {
        throw new BinError(
          '%danger% Wrong format, try (with double quotes): %grey%"/MSG My|BOT xdcc send 23, 25, 50-55"'
        )
      }
    }
  }
  private isCopyPasteARGV(): RegExpExecArray | void {
    const match = /\/(msg|MSG) (.*) (xdcc|XDCC) (send|SEND) (.*)$/
      .exec(process.argv.join(' '))
    if (match) {
      return match
    }
    return undefined
  }
  private main(): void {
    if (typeof this.defaultProfile !== 'undefined') {
      this.downloadWith(this.defaultProfile)
    } else {
      this.downloadWith(this.xdccBINOPTS())
    }
  }

  private writeMSG(time: number): void {
    if(!this.program.quiet) {
      process.stderr.cursorTo(1)
      process.stderr.write(Connect.replace('%info% waiting: ' + time))
      process.stderr.clearLine(1)
    }
  }

  private clearMSG(): void {
    if(!this.program.quiet) {
      process.stderr.clearLine(0)
      process.stderr.cursorTo(0)
    }
  }

  private waitMessage(time: number, xdccJS: XDCC, bot: string, download: string): void {
    const start = time
    const inter = setInterval(() => {
      time--
      if (start > 0) {
        this.writeMSG(time)
      }
      if (time <= 0) {
        if (start > 0) {
          this.clearMSG()
        }
        xdccJS.download(bot, download)
        clearInterval(inter)
      }
    }, 1000)
  }

  private downloadWith(opts: [Params, savedParams]): void {
    if(typeof this.program.saveProfile === 'undefined' && typeof this.program.setProfile === 'undefined' && typeof this.program.deleteProfile === 'undefined') {
      if (typeof this.program.bot === 'undefined' && typeof opts[1].bot === 'undefined') {
        throw new BinError('%danger% You must specify a bot name')
      }
      if (typeof this.program.download === 'undefined') {
        throw new BinError('%danger% You must specify a packet number to download, eg. %grey%--download 1, 3, 55-60')
      }
      const download = this.program.download.join('')
      const bot = this.program.bot ? this.program.bot : opts[1].bot
      const wait = opts[1].wait || 0
      if (!bot) throw new Error('Control flow error: downloadwith()')
      const xdccJS = new XDCC(opts[0])
      xdccJS.on('ready', () => {
        this.waitMessage(wait, xdccJS, bot, download)
      })
      xdccJS.on('can-quit', () => {
        xdccJS.quit()
      })
    }
  }
}

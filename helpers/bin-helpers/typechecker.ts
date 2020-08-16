import commander from 'commander'
import print from '../printer'

class BinTypeChecker {
  lazyRegex: RegExp
  constructor() {
    this.lazyRegex = /(\/msg)\s(.+)\s(xdcc)\s(send)\s(.*)/g
  }
  parseIfNotInt = (number: number | string): number => {
    if (typeof number === 'number') {
      return number
    }
    return parseInt(number)
  }

  isIRCstyle(program: commander.Command, args: string[]): boolean {
    if (args[2].includes('/msg') || args[2].includes('/MSG')) {
      if (program.server) {
        return true
      } else {
        print(
          '%danger% profile has no server, you can\'t use the lazy method.\n change profile or use the "non-lazy" way, see : %grey%xdccJS --help'
        )
      }
    }
    return false
  }

  checkLazySyntax(arr: string[]): boolean {
    const matches = ['/msg', 'xdcc', 'send']
    const position = [1, 3, 4]
    let count = 0
    for (let index = 0; index < matches.length; index++) {
      if (matches[index] === arr[position[index]]) {
        count++
      }
    }
    if (count === 3) {
      return true
    }
    print('%danger% wrong syntax, eg. %grey%/msg My-Bot xdcc send 25-33, 150')
    return false
  }

  parseLazyString(program: commander.Command, args: string[]): boolean {
    const lazyString = args[2]
    const match = this.lazyRegex.exec(lazyString.toLocaleLowerCase())
    if (match) {
      if (this.checkLazySyntax(match)) {
        program.bot = match[2]
        program.download = match[5]
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[a-zA-Z]/g, '')
          .replace(/\s/g, '')
        return true
      } else {
        return false
      }
    } else {
      print('%danger% wrong syntax, eg. %grey%/msg My-Bot xdcc send 25-33, 150')
      return false
    }
  }

  checkArgs(program: commander.Command): boolean {
    const fin: boolean[] = []
    if (!program.server) {
      this.missingArg('-s, --server <server>', '-s irc.server.net')
      fin.push(false)
    }
    if (!program.bot) {
      this.missingArg('-b, --bot <botname>', '-b "xdcc|a|bot"')
      fin.push(false)
    }
    if (!program.download) {
      this.missingArg('-d, --download <pack>', '-d 1-30, 55, 105')
      fin.push(false)
    }
    if (isNaN(program.port)) {
      this.wrongArg('-p, --port <number>', 'number', '-p 6669')
      fin.push(false)
    }
    if (isNaN(program.wait)) {
      this.wrongArg('-w, --wait <number>', 'number', '-w 60')
      fin.push(false)
    }
    if (isNaN(program.retry)) {
      this.wrongArg('-r, --retry <number>', 'number', '-r 3')
      fin.push(false)
    }
    return fin.length ? false : true
  }

  wrongArg(argument: string, expected: string, example: string): void {
    print(`%danger% option '${argument}' must be a ${expected}, eg. %grey%${example}`)
  }
  missingArg(argument: string, example: string): void {
    print(`%danger% option '${argument}' argument missing, eg. %grey%${example}`)
  }
}

export default new BinTypeChecker()

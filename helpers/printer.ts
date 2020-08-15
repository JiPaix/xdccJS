import * as colors from 'colors/safe'
export default function Print(string: string, padding = 0) {
  string = string
    .replace('%bold%', '\x1b[2m')
    .replace('%red%', '\x1b[31m')
    .replace('%cyan%', '\x1b[36m')
    .replace('%green%', '\x1b[32m')
    .replace('%reset%', '\x1b[0m')
    .replace('%grey%', '\x1b[90m')
    .replace('%yellow%', '\x1b[33')
    .replace('%danger%', colors.bold(colors.red('\u0058')))
    .replace('%info%', colors.bold(colors.cyan('\u2139')))
    .replace('%success%', colors.bold(colors.green('\u2713')))
  string = string + '\x1b[0m'
  console.error(string.padStart(padding))
}

export default function ePrint(string: string, padding = 0): void {
  string = string
    .replace(/%bold%/g, '\x1b[2m')
    .replace(/%red%/g, '\x1b[31m')
    .replace(/%cyan%/g, '\x1b[36m')
    .replace(/%green%/g, '\x1b[32m')
    .replace(/%reset%/g, '\x1b[0m')
    .replace(/%grey%/g, '\x1b[90m')
    .replace(/%yellow%/g, '\x1b[33m')
    .replace(/%danger%/g, '\x1b[1m\x1b[31m\u0058\x1b[0m')
    .replace(/%info%/g, '\x1b[1m\x1b[36m\u2139\x1b[0m')
    .replace(/%success%/g, '\x1b[1m\x1b[32m\u2713\x1b[0m')
  string = string + '\x1b[0m'
  console.error(`\u2937`.padStart(padding), string)
}

export function colorize(string: string): string {
  string = string
    .replace(/%bold%/g, '\x1b[2m')
    .replace(/%red%/g, '\x1b[31m')
    .replace(/%cyan%/g, '\x1b[36m')
    .replace(/%green%/g, '\x1b[32m')
    .replace(/%reset%/g, '\x1b[0m')
    .replace(/%grey%/g, '\x1b[90m')
    .replace(/%yellow%/g, '\x1b[33')
    .replace(/%danger%/g, '\x1b[1m\x1b[31m\u0058\x1b[0m')
    .replace(/%info%/g, '\x1b[1m\x1b[36m\u2139\x1b[0m')
    .replace(/%success%/g, '\x1b[1m\x1b[32m\u2713\x1b[0m')
  string = string + '\x1b[0m'
  return string
}

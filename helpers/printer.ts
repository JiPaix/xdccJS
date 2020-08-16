function replace(string: string): string {
  return string
    .replace(/%bold%/g, '\x1b[1m')
    .replace(/%red%/g, '\x1b[31m')
    .replace(/%cyan%/g, '\x1b[36m')
    .replace(/%green%/g, '\x1b[32m')
    .replace(/%magenta%/g, '\x1B[35m')
    .replace(/%blue%/g, '\x1B[34m')
    .replace(/%reset%/g, '\x1b[0m')
    .replace(/%grey%/g, '\x1b[90m')
    .replace(/%yellow%/g, '\x1b[33m')
    .replace(/%RGB(\S*)%/g, '\x1B[38;2;$1m')
    .replace(/%danger%/g, '\x1b[1m\x1b[31m\u0058\x1b[0m')
    .replace(/%info%/g, '\x1b[1m\x1b[36m\u2139\x1b[0m')
    .replace(/%success%/g, '\x1b[1m\x1b[32m\u2713\x1b[0m')
}

export default function ePrint(string: string, padding = 0): void {
  string = replace(string) + '\x1b[0m'
  console.error(`\u2937`.padStart(padding), string)
}

export function colorize(string: string): string {
  return replace(string) + '\x1b[0m'
}

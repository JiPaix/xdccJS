import { Connect } from '../connect'

export class BinError extends Error {
  constructor(message: string) {
    message = Connect.replace(message)
    super(message)
  }
}

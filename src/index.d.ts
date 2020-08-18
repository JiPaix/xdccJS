import Downloader, { Params } from './downloader'
import { Job } from './interfaces/job'
import EventEmitter from 'eventemitter3'
import { FileInfo } from './interfaces/fileinfo'
declare class Controller extends EventEmitter {
  params: Params | undefined
  xdcc: Downloader | undefined
  constructor()
  private _listen
  config(params: Params): this
  init(): void
  download(target: string, packets: string | number | string[] | number[]): Job

}
declare const _default: Controller
export = _default

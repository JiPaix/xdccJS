import XDCC from '../index'
import * as colors from 'colors/safe'
import { Job } from '../interfaces/job'
import Timeout from './timeouthandler'
import ePrint, { colorize } from './printer'

class EventHandler {
  onConnect(self: XDCC): void {
    self.on('connected', () => {
      clearTimeout(self.connectionTimeout)
      for (const chan of self.chan) {
        self.join(chan)
      }
      if (self.verbose) {
        const msg = colorize(`%success% connected to : %bold%%yellow%${self.host}%reset%%bold%:%yellow%${self.port}`)
        console.error(msg)
      }
      ePrint('%success% joined: [ %yellow%' + self.chan.join(' ') + '%reset% ]', 2)
      self.emit('ready')
    })
  }

  onRequest(self: XDCC): void {
    self.on('request', (args: { target: string; packets: number[] }) => {
      const candidate = self.__getCandidate(args.target)
      candidate.now = args.packets[0]
      self.__removeCurrentFromQueue(candidate)
      self.say(args.target, `xdcc send ${candidate.now}`)
      new Timeout(self, candidate)
        .eventType('error')
        .eventMessage(`timeout: no response from ${colors.yellow(candidate.nick)}`, 6)
        .start(15)
      ePrint(
        '%success% sending command: /MSG %yellow%' +
          candidate.nick +
          '%reset% xdcc send %yellow%' +
          candidate.now.toString()
      )
    })
  }

  onCtcpRequest(self: XDCC): void {
    self.on('ctcp request', (resp: { [prop: string]: string }): void => {
      self.__checkBeforeDL(resp, self.candidates[0])
    })
  }

  onNext(self: XDCC): void {
    self.on('next', (candidate: Job) => {
      candidate.retry = 0
      new Timeout(self, candidate)
        .eventType('error')
        .eventMessage(`timeout: no response from ${colors.yellow(candidate.nick)}`, 6)
        .start(15)
      self.__removeCurrentFromQueue(candidate)
      if (candidate.queue.length) {
        candidate.now = candidate.queue[0]
        self.__removeCurrentFromQueue(candidate)
        self.say(candidate.nick, `xdcc send ${candidate.now}`)
      } else {
        self.candidates = self.candidates.filter(c => c.nick !== candidate.nick)
        candidate.emit('done', candidate.show())
        self.emit('done', () => candidate.show())
        if (!self.candidates.length) {
          self.emit('can-quit')
        } else {
          const newcandidate = self.candidates[0]
          self.emit('request', { target: newcandidate.nick, packets: newcandidate.queue })
        }
      }
    })
  }
}

export default new EventHandler()

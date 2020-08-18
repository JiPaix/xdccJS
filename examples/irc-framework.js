/**
 * How to use IRC-FRAMEWORK within xdccJS :
 *
 * everything in their documentation can be used in xdccJS
 * https://github.com/kiwiirc/irc-framework/blob/master/docs/clientapi.md
 */

const XDCC = require('xdccjs').default

let opts = {
  // xdccJS "standard" options :
  host: 'irc.server.net',
  port: 6660,
  nick: 'ItsMeJiPaix',
  chan: ['#mychannel'],
  path: 'downloads',
  retry: 2,
  verbose: false,
  randomizeNick: false,
  passivePort: [5000, 5001, 5002],
  // fin

  /**
   * IRC FRAMEWORK CONSTRUCTOR OPTIONS CAN ALSO BE INCLUDED
   * https://github.com/kiwiirc/irc-framework/blob/master/docs/clientapi.md#constructor
   */
  gecos: 'ircbot',
  encoding: 'utf8',
  version: 'node.js irc-framework',
  enable_chghost: false,
  enable_echomessage: false,
  auto_reconnect: true,
  auto_reconnect_wait: 4000,
  auto_reconnect_max_retries: 3,
  ping_interval: 30,
  ping_timeout: 120,
  account: {
    account: 'username',
    password: 'account_password',
  },
  webirc: {
    password: '',
    username: '*',
    hostname: 'users.host.isp.net',
    ip: '1.1.1.1',
    options: {
      secure: true,
      'local-port': 6697,
      'remote-port': 21726,
    },
  },
  client_certificate: {
    private_key: '-----BEGIN RSA PRIVATE KEY-----[...]',
    certificate: '-----BEGIN CERTIFICATE-----[...]',
  },
}

const xdccJS = new XDCC(opts)

xdccJS.on('ready', () => {
  /**
   * Join password protected channels
   * https://github.com/kiwiirc/irc-framework/blob/master/docs/clientapi.md#joinchannel--key
   */
  xdccJS.irc.join('#channel', 'password')

  /**
   * Join channels in TOPIC
   * https://github.com/kiwiirc/irc-framework/blob/master/docs/events.md#channels
   */
  xdccJS.irc.on('topic', info => {
    const channels = info.topic.match(/#\w*/g)
    for (const chan of channels) {
      xdccJS.join(chan)
    }
  })

  /**
   * Send Messages
   * https://github.com/kiwiirc/irc-framework/blob/master/docs/clientapi.md#saytarget-message
   */
  xdccJS.irc.say('#channel', 'hello everyone')
  xdccJS.irc.say('someone', 'hello!')

  /**
   * Read Messages
   * https://github.com/kiwiirc/irc-framework/blob/master/docs/events.md#messaging
   */
  xdccJS.irc.on('message', data => {
    // if message is sent to me
    if (data.target == xdccJS.user.nick) {
      do_something_with(data.nick, data.message)
    }
    // if message is sent in #mychannel
    if (data.target == '#mychannel') {
      do_something_with(data.nick, data.message)
    }
  })
})

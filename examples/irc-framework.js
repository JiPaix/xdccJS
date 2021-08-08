/**
 * How to use IRC-FRAMEWORK API within xdccJS :
 * This file only contains a few examples.
 * 
 * IRC-FRAMEWORK documentation is available at:
 * https://github.com/kiwiirc/irc-framework/blob/master/docs/clientapi.md
 */


/**
 * xdccJS SETUP
 */
const XDCC = require('xdccjs').default

let opts = {
  host: 'irc.server.net',
  port: 6660,
  nick: 'ItsMeJiPaix',
  chan: ['#mychannel'],
  path: 'downloads',
  retry: 2,
  verbose: false,
  randomizeNick: false,
  passivePort: [5000, 5001, 5002],
}

/**
 * Middleware (NickServ authentification)
 * modified version of: https://github.com/kiwiirc/irc-framework#middleware
 */
const nicksev = { account: 'JiPaix', password: 'secret' }

function ExampleMiddleware() {
	return function(client, raw_events, parsed_events) {
		parsed_events.use(theMiddleware);
	}
	function theMiddleware(command, event, client, next) {
		if (command === 'registered') {
				client.say('nickserv', 'identify ' + nicksev.account + ' ' + nicksev.password);
		}
		if (command === 'message' && client.caseCompare(event.event.nick, 'nickserv')) {
			// Handle success/retries/failures
		}
		next();
	}
}

/**
 * Start xdccJS using a middleware
 */
const xdccJS = new XDCC(opts)
xdccJS.irc.use(ExampleMiddleware)

xdccJS.on('ready', () => {
  /**
   * Access IRC-FRAMEWORK methods :
   * https://github.com/kiwiirc/irc-framework/blob/master/docs/clientapi.md#methods
   */
  xdccJS.irc.join('#channel')
  xdccJS.irc.join('#joinPrivateChannel', 'password')

  xdccJS.irc.say('SomeOne', 'Hello babe')
  xdccJS.irc.say('#someWhere', 'Hey!')

  /**
   * Access to IRC-FRAMEWORK events
   * https://github.com/kiwiirc/irc-framework/blob/master/docs/events.md
   */
  xdccJS.irc
    .on('privmsg', info => {
      if(info.target.indexOf('#') === -1) {
        // Private message
      } else {
        //=> Channel message
      }
    })
    .on('topic', info => {
      console.log(info.topic) //=> Display the new topic
    })
    .on('kick', info => {
      console.log(info.nick, 'kicked', info.kicked, 'from', info.channel)
    })
})

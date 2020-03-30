# XDCC for nodejs

### INSTALLATION :
`npm i xdccjs`
```js
// ES6
import XDCC from 'xdccjs'

// CommonJS
const XDCC = require('xdccjs').default
```
### USAGE
```js
let  xdcc = new  XDCC({
  host:  'irc.rizon.net',
  nick:  'mynickname',
  chan:  '#mychan',
  path:  'dl',      // folder relative to module path, e.g : node_modules/xdccjs/dl
  port:  6660
})

xdcc.send("xdcc-bot-nickname", 23)
//=> /MSG xdcc-bot-nickname xdcc send #23
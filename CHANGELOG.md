# Changelog
## [v4.4.1](https://github.com/jipaix/xdccjs/tree/v4.4.0)
## Fix + Chore(deps)
* fix issue within commonjs context
* remove `public-ip`
* add "custom" `getIp` function
---
## [v4.4.0](https://github.com/jipaix/xdccjs/tree/v4.4.0)

### Refactor(lib)
* use of `import type` instead of `import` when necessary
* better typing:
  * add export for interfaces `Candidate`
  * add export for class `Job`
  * add export for typed events: `GlobalMessageEvents` and `JobMessageEvents`
### Docs(lib)
* add `job.isDone()` to README
### Style(lib)
* remove unused imports
* fix wrong indents
### Chores(dev-deps)
* add `typed-emitter` dependency
### Breaking changes :warning:
* xdccJS now requires node >=14
---
## [v4.3.209](https://github.com/jipaix/xdccjs/tree/v4.3.207)
### Fix(CI)
* CI Hotfix for [v4.3.207](https://github.com/jipaix/xdccjs/tree/v4.3.207)
---
## [v4.3.207](https://github.com/jipaix/xdccjs/tree/v4.3.207)
### Chores(dev-deps, deps)
* updated all depedencies
---
## [v4.3.20](https://github.com/jipaix/xdccjs/tree/v4.3.20)
### Fix(lib+cli)
* checking if host and port were valid was interpreted as flood on some servers [70e125d6](https://github.com/JiPaix/xdccJS/commit/70e125d6734173b52e376c25a59aa956783c219c)
### Chore(lib)
* add type definitions for events [f2f55850](https://github.com/JiPaix/xdccJS/commit/f2f558508eca8fc86c038afff68b6ced803f621e)
### CI
* updated 16.x to `node_current` (16.11.1) [483d4512](https://github.com/JiPaix/xdccJS/commit/483d45127d437ff6e62f11e97a0cc008391a2889) [48711ec7](https://github.com/JiPaix/xdccJS/commit/48711ec7cb501c9cb1a2c0102070bdc27f968793)
---
## [v4.3.14](https://github.com/jipaix/xdccjs/tree/v4.3.14)
### Fix(lib)
* Fix `Job` not importing, `Job` is no longer exported as a namespace. use: `import Job from '/'` [bd0b3b28](https://github.com/JiPaix/xdccJS/commit/bd0b3b2817a80cbb50240f2da6ab766306cf94cb) (thanks to @Firstus report)
### Fix(doc)
* removed typos (tsl>tls) [8c013dd7](https://github.com/JiPaix/xdccJS/commit/8c013dd7f3d2a9d8d8adeceeb4164e6d6709d778)
---
## [v4.3.10](https://github.com/jipaix/xdccjs/tree/v4.3.10)
### Fix
* `TypeError` had a wrong message when `Constructor.tls` type wasn't boolean [863b4fac](https://github.com/JiPaix/xdccJS/commit/863b4facefff7afdbe3838a0fa4552eb2828ed1d) 
### CI
* fix github auto-release [a0ec4314](https://github.com/JiPaix/xdccJS/commit/a0ec431424b81c047f28925ab03fc66a1b269431)
* updated code for discord.js >=13.1.0 [03f9c68f](03f9c68f408c0ff437c93e16693f4dcf039301db)
### Doc
* Added example for `Constructor.tls` [cece9fa8](https://github.com/JiPaix/xdccJS/commit/cece9fa839856ff66d3cb3b6bf0641ca89582932) [2182e12c](https://github.com/JiPaix/xdccJS/commit/2182e12c8a900f44e01b589e61c1235e1f2e8da4)
---
## [v4.3.1](https://github.com/jipaix/xdccjs/tree/v4.3.1)
### Features
* added support for SSL/TLS [676d7049](https://github.com/JiPaix/xdccJS/commit/676d70493d5d833993e4741d4e118495d13a79ef)
### Fix
* fix connection to server being refused because of default username (credit: @TheFlashBold) [448e7786](https://github.com/JiPaix/xdccJS/commit/448e77866aa96f77515b1109d12b21d1345e5769) [cfd4101a](https://github.com/JiPaix/xdccJS/commit/cfd4101aa433ab743d1f3a817924865488d83905)
### CI
* fix build cmd not working [be8c24dc](https://github.com/JiPaix/xdccJS/commit/be8c24dc4882afb3608a44586264c0e6141d2abf)
* added build without doc [a38144c8](https://github.com/JiPaix/xdccJS/commit/a38144c84ba553d74cea3e6371ed68d7ac5cc7ae)
* add codeql analyze [9302b034](https://github.com/JiPaix/xdccJS/commit/9302b034133c071cd7b872b23fb4cc885ddbc878) [36c5c770](https://github.com/JiPaix/xdccJS/commit/36c5c77039587e998e380a34746cc5458fe7d673) 
* fix release and discord integration [51714a6d](https://github.com/JiPaix/xdccJS/commit/51714a6d8cf14d3f59c40bf40ed8d0de347c4435)
* build utilities are rewritten in TypeScript language [fbda950c](https://github.com/JiPaix/xdccJS/commit/fbda950cccf85db83532da385649a27d17b0aa8f)
### Style(lib)
* remove JobError.message emojis, padding and fancy colors [0f2e50bb](https://github.com/JiPaix/xdccJS/commit/0f2e50bba058c2a766c8f56640b6a43a81c22cf1)
### Doc(cli)
* Simplified explanation about profiles [e5b3c9ce](https://github.com/JiPaix/xdccJS/commit/e5b3c9ce102d73bd3975b818e3607dfd9d301ac6)
### Chores
* remove duplicate interface [ed84c657](https://github.com/JiPaix/xdccJS/commit/ed84c657df06e4ba9e95c4ca805030f2e14ed8cb)
### Chores(dev-deps)
* bump axios from 0.21.1 to 0.22.0
* bump commander from 8.1.0 to 8.2.0
* bump discord.js from 13.1.0 to 13.2.0
* bump eslint from 7.32.0 to 8.0.0 
* added eslint plugin import/typescript 2.24.2
* bump mocha from 9.0.3 to 9.1.2
* bump pkg from 5.3.1 to 5.3.3
* bump ts-node from 10.2.0 to 10.2.1
* bump typedoc from 0.21.6 to 0.21.6
* bump typescript from 4.3.5 to 4.4.3
* bump @types/chai from 4.2.21 to 4.2.22
* bump @types/lodash from 4.14.172 to 4.14.175
* bump @types/node from 16.6.1 to 16.10.3
* bump @typescript-eslint/eslint-plugin 4.29.1 from to 4.33.0
* bump @typescript-eslint/parser from 4.29.3 to 4.33.0
---
## [v4.3.0](https://github.com/jipaix/xdccjs/tree/v4.3.0)
### Features(lib)
* :warning: `xdccJS.download()` is now asynchronous [a1d170b1](https://github.com/JiPaix/xdccJS/commit/a1d170b1af993eb2ae70721d68930112770f1c45)
### Features(bin)
* Notice user when hostname is unreachable [bd452d5a](https://github.com/JiPaix/xdccJS/commit/bd452d5a9b24337fd2c9c2fbb776c80daa49678d)
### Fix(lib)
* Emit `error` event instead of throwing [b0ad1413](https://github.com/JiPaix/xdccJS/commit/b0ad1413e089bafea3dbf217130674a7039457b9)
* Fix `error` events being too ambiguous [0bf3ffc8](https://github.com/JiPaix/xdccJS/commit/0bf3ffc8c6fdab98110075821268e700329755a8)
  * `xdccJS.on('error', (err) => { } )` IRC errors ONLY
  * `Job.on('error', (msg, fileInfo) => {} )` Job errors ONLY
### Doc
* Add irc-framework integration example [6faf356e](https://github.com/JiPaix/xdccJS/commit/6faf356e7ced0de8d035d6a1c5fed7eaf5718dc0)
  * Credit @qgustavor [issue#241](https://github.com/JiPaix/xdccJS/issues/241)
### Chores(dev-deps)
* Add pkg to dev-deps
* Remove unused dotenv-manipulator
* bump @types/node from 16.4.10 to 16.6.1
* bump @types/lodash from 4.14.171 to 4.14.172
* bump @typescript-eslint/parser from 4.28.5 to 4.29.0
* bump @typescript-eslint/eslint-plugin from 4.29.0 to 4.29.1
* bump ts-node from 10.1.0 to 10.2.0
* bump discord.js from 12.5.3 to 13.1.0
---
## [v4.2.9](https://github.com/jipaix/xdccjs/tree/v4.2.9)
### HotFix
* Prevent xdccJS to indefinitely tries to connect to an unreachable host. [e9135ea1](https://github.com/JiPaix/xdccJS/commit/e9135ea11239996d428755f613c88cfb753e627c)
---
## [v4.2.8](https://github.com/jipaix/xdccjs/tree/v4.2.8)
### Fix(global)
* Fix a bug introduced in v4.2.6 where parameter `verbose` wasn't optional [d0e61f24](https://github.com/JiPaix/xdccJS/commit/d0e61f24a646ceda5a2bdd0ab04969df8175fd1d)
### Fix(bin)
* Profiles not loading [02371574](https://github.com/JiPaix/xdccJS/commit/02371574ce97f3dfb4ec37b40a5d2bc7fc57e458) [issue#238](https://github.com/JiPaix/xdccJS/issues/238)
  * Credit [@omgbox](https://github.com/omgbox)
* `--save-profile` without argument was creating a profile named `true` which wasn't interpreted as a string [61d382e0](https://github.com/JiPaix/xdccJS/commit/61d382e0922690b36b9b41ce6942334d9ce8a9a7)
  - `--delete-profile`, `--save-profile` and `--set-profile` now require an argument
---
## [v4.2.7](https://github.com/jipaix/xdccjs/tree/v4.2.7)
### Fix
* piped downloads via CLI are working again [d90c160b](https://github.com/JiPaix/xdccJS/commit/d90c160b2797734220e44ac1c79d1f71e00b8bed)
### CI
* Autogenerated releases + discord integration [5b9ed611](https://github.com/JiPaix/xdccJS/commit/5b9ed611c1ca4cebc7963955e75551b0223c1071) [965df097](https://github.com/JiPaix/xdccJS/commit/965df097969783a50e453fbe4cb769df0cde6b0d)
---
## [v4.2.6](https://github.com/jipaix/xdccjs/tree/v4.2.6)
### Features(gobal)
* added an extra verbose notification when a job is complete with the list of all packages that failed [#236](https://github.com/JiPaix/xdccJS/pull/236)
### Fix(bin)
* changed profile location to user's home directory, some (linux) users couldn't save profile due to invalid write permission [#237](https://github.com/JiPaix/xdccJS/pull/237)
* warn user if multiple profile option are used in the same command [#237](https://github.com/JiPaix/xdccJS/pull/237)
* downloads cannot be triggered if `--save/set/delete-profile` is set [#237](https://github.com/JiPaix/xdccJS/pull/237)
### Chores(dev-deps)
* bump @types/node from 16.4.7 to 16.4.10 [#231](https://github.com/JiPaix/xdccJS/pull/231)
* bump typedoc from 0.21.4 to 0.21.5 [#232](https://github.com/JiPaix/xdccJS/pull/232)
* bump @types/node from 16.4.7 to 16.4.10 [#233](https://github.com/JiPaix/xdccJS/pull/232)
### CI
* changed keyword for skipping ci to `[ci skip]` [c252f207](https://github.com/JiPaix/xdccJS/commit/c252f2077ed6e729e69a89c20fdd3d634379a743)
* changed dependency update check interval from daily to weekly [4da55709](https://github.com/JiPaix/xdccJS/commit/4da55709d55f32ae4b75a9ce146caefc1548e955)
### Docs
* fixing header position and icons url [c02314d4](https://github.com/JiPaix/xdccJS/commit/c02314d499dc40d1af0e6de2630646373887c227) [cd3942dc](https://github.com/JiPaix/xdccJS/commit/cd3942dcad60e6885f5d571c9807a52b41d0421e)
---
## [v4.2.5](https://github.com/jipaix/xdccjs/tree/v4.2.5)
### Fix:
- Unicode characeters not showing up in some cases [#230](https://github.com/JiPaix/xdccJS/pull/230) (lib+bin)
  - Credit [@omgbox](https://github.com/omgbox)
- Documentation still mentioning `--server` while its been replaced with `--host` [#230](https://github.com/JiPaix/xdccJS/pull/230)
  - Credit [@omgbox](https://github.com/omgbox)
### Improvement:
- Added a rollbar next to download message [#230](https://github.com/JiPaix/xdccJS/pull/230) (lib+bin)
  - `| [===   ] ETA: 10s @ 7.75 MB/s - 50%`
  - `/ [===   ] ETA: 7s @ 7.75 MB/s - 60%`
  - `- [====  ] ETA: 8s @ 7.75 MB/s - 68%`
  - etc..
- Removed some ununsed imports and variables from tests [8ef272c](https://github.com/JiPaix/xdccJS/commit/8ef272c0fd909835e341e0af2ad4c6e71bde4972)
### Misc:
- Updated dev-deps: [#219](https://github.com/JiPaix/xdccJS/pull/219) [#221](https://github.com/JiPaix/xdccJS/pull/221) [#222](https://github.com/JiPaix/xdccJS/pull/222) [#223](https://github.com/JiPaix/xdccJS/pull/223) [#226](https://github.com/JiPaix/xdccJS/pull/226)
---
## [v4.2.4](https://github.com/jipaix/xdccjs/tree/v4.2.4)
### New Feature:
- Added a `--quiet` option to xdccJS CLI
### Fix:
- NodeJS 16x not properly reading package.json
### Misc:
- Dependencies update (a lot)
---
## [v4.2.0](https://github.com/jipaix/xdccjs/tree/v4.2.0)
### Improvement:
- `server` option has been replace with `host` (lib+cli).
- `nick` and `username` option are replaced with `nickname` (lib+cli)
### Fix:
- Fix bug with xdccJS CLI where nickname option wasn't applied if its lenght was more than 6 characters
### Misc:
- Dependencies update
---
## [v4.1.6](https://github.com/jipaix/xdccjs/tree/v4.1.6)
### Fix:
- Added a fileInfo typescript interface
- Added a `downloading` event typescript definition
---
## [v4.1.5](https://github.com/jipaix/xdccjs/tree/v4.1.5)
### Fix:
- removed old compilted file from src folder
---
## [v4.1.2](https://github.com/jipaix/xdccjs/tree/v4.1.2)
### New Feature (jobs):
- Added a 'downloading' event
### Misc:
- Dependencies update
---
## [v4.1.1](https://github.com/jipaix/xdccjs/tree/v4.1.0)
### Fix: (bin)
- MAJOR FIX : Download weren't started if `--wait` wasn't provieded
---
## [v4.1.0](https://github.com/jipaix/xdccjs/tree/v4.1.0)
### Fix: (jobs)
- Jobs weren't cancelable until they had a download ongoing ([a103d1b](https://github.com/JiPaix/xdccJS/commit/a103d1b85460eaee40bef87c23f8af014b620efb))
- `job.cancel()` now totally empty a job's queue instead of just canceling the current packet ([a103d1b](https://github.com/JiPaix/xdccJS/commit/a103d1b85460eaee40bef87c23f8af014b620efb))
### Style: (verbose)
- Filename is now displayed before download starts ([1605b25](https://github.com/JiPaix/xdccJS/commit/1605b252f48fb592ed3ad2187a584d8b75af0301))
- Download bar is cleared when it reaches 100% ([PR#37](https://github.com/JiPaix/xdccJS/pull/37))
---
## [v4.0.6](https://github.com/jipaix/xdccjs/tree/v4.0.6)
### Style :

- Simplifying code readability ([8702a09](https://github.com/JiPaix/xdccJS/commit/8702a0920814714e7a35054a2b9bbd9c6976de09)) ([c1afdd9](https://github.com/JiPaix/xdccJS/commit/c1afdd9b234e36020ab14e5960b0d3df69391ca7)) ([c4daa9f](https://github.com/JiPaix/xdccJS/commit/c4daa9f8844343e97d1d105315a220d3f97d5e9f)) ([85409f8](https://github.com/JiPaix/xdccJS/commit/85409f8e3879d1ac0965b7246a33e0ccaff54a71)) ([e6db5a0](https://github.com/JiPaix/xdccJS/commit/e6db5a04d2f14a07c55c5af3b501722d7a51fc4e)) ([d71a99c](https://github.com/JiPaix/xdccJS/commit/d71a99cc98d184b3476732c87b6ac3987459a8bb))

### Test:

- Coverage improvement ([95f637d](https://github.com/JiPaix/xdccJS/commit/95f637d2392e93faf58bc19a78f259ab5d70ae02)) ([acc9323](https://github.com/JiPaix/xdccJS/commit/acc9323be41758d6471742e88cdf244a4a72beca)) ([c25cce7](https://github.com/JiPaix/xdccJS/commit/c25cce75a1675197ab0386eca922ed8ddad2411f))

### Doc:

- Updated documentation
---
## [v4.0.5](https://github.com/jipaix/xdccjs/tree/v4.0.5)

### Features :
- Add a secure option : deny/allow files sent by bot with different name than the one requested. ([4de1f94](https://github.com/JiPaix/xdccJS/commit/4de1f946a74defad52201fa16e2195b5d3bd6f18))

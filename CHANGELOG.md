# Changelog

## [v4.2.4](https://github.com/jipaix/xdccjs/tree/v4.3.0)
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
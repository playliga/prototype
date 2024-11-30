## 3.0.0-beta.18 (2024-11-30)

### Bug Fixes

- fixed broken link when CS:GO is not installed

## 3.0.0-beta.16 (2024-11-20)

### Features

- added the ability to buy players

### Bug Fixes

- fixed attack and reaction speed stats not being trained

## 3.0.0-beta.15 (2024-11-12)

- [View the Blog post](https://github.com/playliga/application/discussions/270)

### Features

- added a team details page
- added better team logos ([#70](https://github.com/playliga/application/issues/70))

### Bug Fixes

- on-the-fly settings reset after matches

## 3.0.0-beta.14 (2024-11-01)

- [View the Blog post](https://github.com/playliga/application/discussions/269)

### Features

- add competitions screen ([#82](https://github.com/playliga/application/issues/82))
- added a cog to configure match settings on-the-fly instead of opening up an extra modal before launching the game.

### Bug Fixes

- fix national flag width
- updated dust2 and inferno map screenshots

## 3.0.0-beta.13 (2024-10-24)

- [View the Blog post](https://github.com/playliga/application/discussions/268)

### Features

- added discord server invite menu item ([discord.gg/ZaEwHfDD5N](https://discord.gg/ZaEwHfDD5N))
- added a match setup modal ([#80](https://github.com/playliga/application/issues/80))
- added dark theme which can be set via the app settings ([#80](https://github.com/playliga/application/issues/80))
- redesigned settings screen to be less confusing ([#80](https://github.com/playliga/application/issues/80))

## 3.0.0-beta.10 (2024-10-16)

- [View the Blog post](https://github.com/playliga/application/discussions/267)

### Features

- added ability to define custom launch options for cs:go ([#79](https://github.com/playliga/application/issues/79))
- added ability for users to view their reported issues or feature requests
- earnings are now shown in the navbar ([#70](https://github.com/playliga/application/issues/70))
- restore inventory customizations in cs:go ([#80](https://github.com/playliga/application/issues/80))
- added menu item to view app changelog
- added a "What's New" modal and menu item

### Bug Fixes

- add warning modal if trying to close app while calendar is advancing. ([#77](https://github.com/playliga/application/issues/77))
- fixed attack and reaction time stats not being trained
- fixed date of save showing incorrectly ([#81](https://github.com/playliga/application/issues/81))

## 3.0.0-beta.9 (2024-10-12)

### Bug Fixes

- fixed date of save showing incorrectly ([#81](https://github.com/playliga/application/issues/81))
- fixed map override not being honored ([#84](https://github.com/playliga/application/issues/84))
- properly honor starters selection ([#85](https://github.com/playliga/application/issues/85))

## 3.0.0-beta.8 (2024-10-09)

### Features

- added a way to manually specify game install directory

### Bug Fixes

- fix steam and game detection logic ([#73](https://github.com/playliga/application/issues/73), [#76](https://github.com/playliga/application/issues/76))
- fix race condition starting match if round ends before LO3 finishes
- fix starter selection not being honored

## 3.0.0-beta.7 (2024-10-07)

- [View the Blog post](https://github.com/playliga/application/discussions/266)

### Features

- added new match results page
- added confetti animation when user wins competitions
- added congratulatory e-mail when user advances in competition stages
- allow ability to control in-game bot chatter levels

### Bug Fixes

- fallback to previous season standings if no upcoming matches detected
- fixed missing stats to generated bot profile
- clamp training gains to maximum possible xp for stats
- consider team prestige when simulating scores
- disable bot auto-difficulty adjustment in csgo
- render BYE games properly in recent matches

## 3.0.0-beta.6 (2024-09-20)

- [View the Blog post](https://github.com/playliga/application/discussions/265)

### Features

- dashboard ui changes
- add ability to view details of past matches
- add keyboard shortcut for save and exit to main menu
- apply win bonuses to user's team when winning simulated games
- track headshot percentage and assists in postgame report

### Bug Fixes

- clamp total xp to maximum achievable xp when training ([#45](https://github.com/playliga/application/issues/45))
- cosmetic changes to upcoming matches section
- email dialogue adjustments

## 3.0.0-beta.4 (2024-09-14)

### Features

- add `.motd` in-game command to CS 1.6, CS:CZ and CS:S
- auto add player to their team upon joining the server

### Bug Fixes

- prevent user from clicking on nav when the app is working ([#44](https://github.com/playliga/application/issues/44))
- render welcome message when user joins a team
- sync training boost labels with stats in player card

## 3.0.0-beta.3 (2024-09-05)

- [View the Blog post](https://github.com/playliga/application/discussions/264)

### Features

- added postmatch modal
- record scorebot events in the database
- added keyboard shortcut for settings screen
- added MR24 match rule support
- show last five matches in match preview

### Bug Fixes

- added tooltip on server boosts the user cannot afford yet
- adjust player regex in scorebot module
- adjust round over regex to pick up double digit team scores
- ensure database migrations run in the correct order
- fix modal windows not loading in rare cases
- modal window dimensions are now relative to its parent

## 3.0.0-beta.2 (2024-08-28)

### Features

- add ability to designate bot weapon preferences
- run database migrations at runtime

### Bug Fixes

- create issue page no longer crashes if game logs are not found
- do not clean up qconsole log files after matches
- interpolate variables properly in log file
- require country selection when starting new career
- trim app and game logs if they exceed the github api limit

## 3.0.0-beta.1 (2024-08-27)

### Features

- add support for cs:cz

### Bug Fixes

- properly clean up game files after matches

## 3.0.0-alpha.6 (2024-08-20)

### Features

- add help menu item
- added maps to cs:go
  - ancient, anubis, vertigo
- added maps to cs:s
  - russka
- added maps to cs 1.6
  - tuscan
- train stats after wins

### Bug Fixes

- app icon now renders correctly if uninstalling
- do not close out game immediately after match finishes

## 3.0.0-alpha.5 (2024-08-15)

### Features

- adjust verbiage on attack delay and reaction time stats in player cards
  - A big thank you to [/u/\_matt_hues](https://www.reddit.com/user/_matt_hues/) for the suggestion!

### Bug Fixes

- convert map when launching css
- ensure logs directory and file are in place before launching scorebot

## 3.0.0-alpha.4 (2024-08-14)

### Bug Fixes

- adjust app status error regex to not overlap games
- dashboard updates after settings are changed
- properly detect game installs

## 3.0.0-beta.28 (2025-01-22)

### Features

- added ability to search for players by name ([#343](https://github.com/playliga/application/issues/343)) ([fd982ef](https://github.com/playliga/application/commit/fd982ef6a35dcbb5ed512b83b398446847744124))

### Bug Fixes

- fix tier filter not resetting in player search page ([#342](https://github.com/playliga/application/issues/342)) ([030d0cb](https://github.com/playliga/application/commit/030d0cb3fbacc1d6cb2c37aa4bd98b5216cc61d0))
- improved error handling when detecting steam install path ([#340](https://github.com/playliga/application/issues/340)) ([2079cbf](https://github.com/playliga/application/commit/2079cbf94e9942a35c2863c5d8821df891ce99dc))

## 3.0.0-beta.27 (2025-01-21)

### Features

- added player stats to transfer modal ([#341](https://github.com/playliga/application/issues/341)) ([384c697](https://github.com/playliga/application/commit/384c6973030e025abef43a078515bc5e29b2bc6e))

### Bug Fixes

- fix edge case soft-locking users out of transfer market ([#338](https://github.com/playliga/application/issues/338)) ([7be4ddc](https://github.com/playliga/application/commit/7be4ddccc605ea92a35e55213439b9489948c4cb))

## 3.0.0-beta.26 (2025-01-19)

### Bug Fixes

- custom launch args now work for all games ([#335](https://github.com/playliga/application/issues/335)) ([65e7670](https://github.com/playliga/application/commit/65e7670c5447b81c39cdbd3f3d9784fb75c9e724))

## 3.0.0-beta.25 (2025-01-18)

### Features

- updated what's new modal ([d5d2071](https://github.com/playliga/application/commit/d5d20712dcc7f64d742dd70f1af191b8add85e54))

## 3.0.0-beta.24 (2025-01-08)

### Features

- added league playoffs ([#237](https://github.com/playliga/application/issues/237)) ([3986a75](https://github.com/playliga/application/commit/3986a75b62fe2eb6b1cf668a9ca1d1fde7fcca18))
- added facilities training bonus ([#327](https://github.com/playliga/application/issues/327)) ([2c49c4e](https://github.com/playliga/application/commit/2c49c4e7bf8fbafc55f591fe5a0c6647a0448282))

### Bug Fixes

- adjust prices for training bonuses ([#330](https://github.com/playliga/application/issues/330)) ([49413a9](https://github.com/playliga/application/commit/49413a9aa7fc30224f3c6944e5214d3307e5e8c7))
- fix rare occurrences where user's team is not added to any competitions ([#242](https://github.com/playliga/application/issues/242)) ([4da9503](https://github.com/playliga/application/commit/4da95035fdd017a426b1913d74c8b9c363b91f18))
- improved team and country dropdown performance ([#325](https://github.com/playliga/application/issues/325)) ([3289e65](https://github.com/playliga/application/commit/3289e657e981de726810983e941beea462e2659b))
- only set 4 starters when creating new career ([#326](https://github.com/playliga/application/issues/326)) ([001633b](https://github.com/playliga/application/commit/001633b13b427ddb95997913020ef83e64413ba0))
- tweaked team and player country distribution ([#319](https://github.com/playliga/application/issues/319)) ([eb8aa00](https://github.com/playliga/application/commit/eb8aa002fc64fe910fbf253903418225f093c32f))

## 3.0.0-beta.23 (2024-12-31)

### Features

- added a mod manager ui ([#322](https://github.com/playliga/application/issues/322)) ([edc1686](https://github.com/playliga/application/commit/edc16865571a53393c6a52c0f8e8c9357dd5009c))
- splash page now shows progress bar when downloading game plugins ([#260](https://github.com/playliga/application/issues/260)) ([dea03a6](https://github.com/playliga/application/commit/dea03a660f93fa823fa9c3c371755ae3d8370aee))

### Bug Fixes

- cosmetic adjustment to flag borders ([b736a4d](https://github.com/playliga/application/commit/b736a4d6f82c3a583cb8148aeba58490ff81dbde))
- fix rounding errors with training exp ([#317](https://github.com/playliga/application/issues/317)) ([ca7f4f3](https://github.com/playliga/application/commit/ca7f4f33ea96bf3a3d632a0ebe5dd1933c036c07))
- improved offline support ([#316](https://github.com/playliga/application/issues/316)) ([234a3f4](https://github.com/playliga/application/commit/234a3f41a6e92b676469fb40344178389054a2b3))

## 3.0.0-beta.22 (2024-12-18)

### Bug Fixes

- fixed issue recording match results when bot difficulty is selected ([#311](https://github.com/playliga/application/issues/311)) ([0b1be09](https://github.com/playliga/application/commit/0b1be09782fb06fc10d559b19c3bacec430a17a7))
- improved country selection among teams and players ([#310](https://github.com/playliga/application/issues/310)) ([a973c56](https://github.com/playliga/application/commit/a973c56b7c96bdc945b8d401883058bbc12d145b))
- small cosmetic fix to match setup modal ([17aaf6e](https://github.com/playliga/application/commit/17aaf6e73a556b966329794398bb388fc933cedb))

## 3.0.0-beta.21 (2024-12-13)

### Features

- add prize pools to competitions ([#259](https://github.com/playliga/application/issues/259)) ([8dfc0cc](https://github.com/playliga/application/commit/8dfc0cc9555b45000ae0eef4c5d6d1d5240e723e))
- added a bot difficulty setting ([#249](https://github.com/playliga/application/issues/249)) ([8e00044](https://github.com/playliga/application/commit/8e00044119f10ae996c9baa06483c33da5d81d32))
- show match results for team on their team page ([#256](https://github.com/playliga/application/issues/256)) ([a1c51c4](https://github.com/playliga/application/commit/a1c51c4ff2d24cfec452e422e21cc656286e2d79))

### Bug Fixes

- tweaked and improved probability weights when simming games ([#306](https://github.com/playliga/application/issues/306)) ([47b56e0](https://github.com/playliga/application/commit/47b56e0d8c645fa9599eda0f68cbeb9fc1619397))

## 3.0.0-beta.20 (2024-12-06)

### Features

- players now reconsider if wages offered are high enough ([#226](https://github.com/playliga/application/issues/226)) ([24dce0f](https://github.com/playliga/application/commit/24dce0f7e2972439ba2da0a7e85c932240013703))

### Bug Fixes

- adjust player transfer and wages after each season ([#298](https://github.com/playliga/application/issues/298)) ([22748f5](https://github.com/playliga/application/commit/22748f56faed255f62884f252d792e4a47ff5e0e))
- only consider honors for finished competitions ([#255](https://github.com/playliga/application/issues/255)) ([dd8cd5e](https://github.com/playliga/application/commit/dd8cd5e55e553f6cd17842b8bce462b980301201))
- select next e-mail after deleting an e-mail ([#223](https://github.com/playliga/application/issues/223)) ([5dd869a](https://github.com/playliga/application/commit/5dd869a65bdd485380ee689337e217a62543ee97))

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

<img src="./src/frontend/assets/icon.png" alt="LIGA Esports Manager" width="300" height="300" />

An immersive CS:GO Esports Simulator.

## APIs and Technologies

- Node `v20.9.x`.
- Electron `v29.x`.
- Electron Forge `v6.x`.
- SQLite `v5.x`.
  - On Windows, Python `3.10` or above [is required](https://github.com/nodejs/node-gyp#on-windows).

## Getting Started

> [!IMPORTANT]
> On windows, `npm start` must be run from CMD.exe, Powershell, or WSL2. [More Info](https://www.electronforge.io/templates/typescript-+-webpack-template).

```bash
npm install
npm start
```

## Resetting the Database

LIGA uses [Prisma ORM](https://www.prisma.io/) to manage its database interactions.

A unique Prisma Client is generated from the schema defined in source control which sometimes may need to be regenerated along with the database for troubleshooting purposes.

```bash
npm run db:reset
```

After resetting the database the teams and players data must be repopulated by running the Prisma seeder again. This is due to a limitation with Prisma's `init` command not passing arguments down to the `seed` command that it runs internally.

> [!IMPORTANT]
> A [Pandascore Access Token](https://app.pandascore.co/dashboard/main) is required.

```bash
npx prisma db seed -- --token <...>
```

## Development CLI

Provides convenience wrappers and business logic for common development tasks.

> [!TIP]
> For additional commands and options, pass in `--help` to either the top-level command or any of the subcommands.

```bash
npm run cli
npm run cli -- stats --help
npm run cli -- scraper teams --token <...>
```

## Compiling AMXX and SourceMod Plugins

This app also ships with an AMXX and SourceMod plugins to help manage matches. When making changes to the plugins they must be re-compiled which can be done directly from within VSCode.

Configure the following, replacing the placeholder value with the path to your game installation folder.

```json
"amxxpawn.compiler.executablePath": "<path_to_cstrike>/addons/amxmodx/scripting/amxxpc.exe",
"amxxpawn.compiler.includePaths": ["<path_to_cstrike>/addons/amxmodx/scripting/include"],
"SourcePawnLanguageServer.compiler.path": "<path_to_csgo>/addons/sourcemod/scripting/spcomp.exe",
"SourcePawnLanguageServer.includeDirectories": ["<path_to_csgo>/csgo/addons/sourcemod/scripting/include"],
"sourcepawn.outputDirectoryPath": "<path_to_project>/src/resources/games/csgo/addons/sourcemod/plugins/",
```

## Building Distributables

Generate platform specific distributables.

[More Info](https://www.electronforge.io/config/makers).

```bash
npm run make
```

### Publishing

> [!IMPORTANT]
> A [Github Access Token](https://github.com/settings/tokens) is required.

The publish command will build the application and publish it to Github as a draft release.

```bash
export GITHUB_TOKEN="<...>"
npm run publish
```

In order for the CI/CD process to mirror it into the [public releases repo](https://github.com/lemonpole/LIGA-public) the following must be done:

- Publish the release.
- Ensure it is _not_ a pre-release otherwise the CI/CD process will not pick it up.

### Generating Changelog

Currently, the changelog is generated ad-hoc and manually added to the release notes body.

This is because [Github's changelog generation feature only picks up PRs and not individual commits](https://github.com/orgs/community/discussions/31628).

> [!IMPORTANT]
> Make sure to strip the changelog of links to the private repo.

```bash
npx conventional-changelog-cli -p conventionalcommits
```

### Updating Application Icon

The installers only accept an `.ico` file so it must be manually converted from the base `assets/icon.png` image.

[More Info](https://www.electronforge.io/guides/create-and-add-icons#configuring-installer-icons).

```bash
npm run gen:icon
```

## Transcoding Videos

Ideally, `.webm` format should be used for videos such as the one used in the landing page because `.mp4` has stuttering and performance issues.

VP9 prefers to encode in two passes so the first pass compiles a log file with statistics about the video file which is then used in the second pass to make the video.

```bash
ffmpeg -i landing.mp4 -b:v 0 -crf 30 -pass 1 -an -f webm -y /dev/null
ffmpeg -i landing.mp4 -b:v 0 -crf 30 -pass 2 landing.webm
```

For VP9, the CRF can range from 0 (best quality) to 63 (smallest file size). It is set to `30` above for roughly, medium quality.

## Contributing

This project adheres to the conventional commits specification which is outlined [here](https://www.conventionalcommits.org/en/v1.0.0/#summary).

## Marketing

The resolution used for games and the app should be set to `1280x960`.

The game being demoed should also be running in window mode so that the transition between app and game is seamless when taking videos.

Additionally, the following `diff` should be applied to ensure consistency between videos and screenshots.

```diff
diff --git a/src/backend/lib/window-manager.ts b/src/backend/lib/window-manager.ts
index b6e60b1d..cc3a8b58 100644
--- a/src/backend/lib/window-manager.ts
+++ b/src/backend/lib/window-manager.ts
@@ -81,6 +81,8 @@ export const WINDOW_CONFIGS: Record<string, WindowConfig> = {
     url: is.main() && LANDING_WINDOW_WEBPACK_ENTRY,
     options: {
       ...baseWindowConfig,
+      width: 1280,
+      height: 960,
     },
   },
   [Constants.WindowIdentifier.Main]: {
@@ -88,6 +90,8 @@ export const WINDOW_CONFIGS: Record<string, WindowConfig> = {
     url: is.main() && MAIN_WINDOW_WEBPACK_ENTRY,
     options: {
       ...baseWindowConfig,
+      width: 1280,
+      height: 960,
     },
     buildMenu: () =>
       Menu.buildFromTemplate([
diff --git a/src/shared/constants.ts b/src/shared/constants.ts
index f2921e5e..341e9403 100644
--- a/src/shared/constants.ts
+++ b/src/shared/constants.ts
@@ -442,15 +442,7 @@ export const IdiomaticTier: Record<TierSlug | string, string> = {
  *
  * @constant
  */
-export const MapPool = [
-  'de_dust2',
-  'de_inferno',
-  'de_mirage',
-  'de_nuke',
-  'de_overpass',
-  'de_train',
-  'de_tuscan',
-];
+export const MapPool = ['de_dust2'];

 /**
  * Replacement maps for game variants.
```

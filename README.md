<div align="center">
  <p>
    <a href="https://discord.gg/ZaEwHfDD5N"><img src="https://img.shields.io/discord/1296858234853789826?style=for-the-badge&label=Discord&logo=discord&logoColor=white" /></a>
    <a href="https://playliga.gg/#/#download"><img src="https://img.shields.io/badge/download-latest-salmon?style=for-the-badge&logo=github" /></a>
    <a href="https://github.com/playliga/prototype/milestones"><img src="https://img.shields.io/badge/view_the-roadmap-blue?style=for-the-badge&logo=rocket&logoColor=white" /></a>
  </p>
  <p>The world's first Esports simulator for Counter-Strike where you can play your matches in-game or simulate them, you choose!</p>
</div>

# APIs and Technologies

- Node `v24.11.1`.
- Electron `v40.0.0`.
- SQLite `v5.x`.
  - On Windows, Python `3.10` or above [is required](https://github.com/nodejs/node-gyp#on-windows).

# Getting Started

> [!IMPORTANT]
> On windows, `npm start` must be run from CMD.exe, Powershell, or WSL2. [More Info](https://www.electronforge.io/templates/typescript-+-webpack-template).

```bash
npm install
npm start
```

# Resetting the Database

> [!IMPORTANT]
> A [Pandascore Access Token](https://app.pandascore.co/dashboard/main) is required.

This application uses [Prisma ORM](https://www.prisma.io/) to manage its database interactions.

A unique Prisma Client is generated from the schema defined in source control which sometimes may need to be regenerated along with the database for troubleshooting purposes.

```bash
npm run db:reset
```

After resetting the database the teams and players data will be repopulated using [PandaScore API](https://pandascore.co). A token must be provided in the `.env` file in order for this to work.

# Development CLI

Provides convenience wrappers and business logic for common development tasks.

```bash
npm run cli help
```

# Building

Generate platform specific distributables.

[More Info](https://www.electronforge.io/config/makers).

```bash
npm run make
```

## Publishing

> [!IMPORTANT]
> A [Github Access Token](https://github.com/settings/tokens) is required.

The publish command will build the application and publish it to Github as a draft release.

```bash
export GITHUB_TOKEN="<...>"
npm run publish
```

## Updating Application Icon

The installers only accept an `.ico` file so it must be manually converted from the base `assets/icon.png` image.

[More Info](https://www.electronforge.io/guides/create-and-add-icons#configuring-installer-icons).

```bash
npm run gen:icon
```

# Miscellaneous

## Marketing

The resolution used for games and the app should be set to `1280x960`.

The game being demoed should also be running in window mode so that the transition between app and game is seamless when taking videos.

## Transcoding Videos

`.webm` format should be used for videos such as the one used in the landing page because `.mp4` has stuttering and performance issues.

VP9 prefers to encode in two passes so the first pass compiles a log file with statistics about the video file which is then used in the second pass to make the video.

```bash
ffmpeg -i landing.mp4 -b:v 0 -crf 30 -pass 1 -an -f webm -y /dev/null
ffmpeg -i landing.mp4 -b:v 0 -crf 30 -pass 2 landing.webm
```

For VP9, the CRF can range from 0 (best quality) to 63 (smallest file size). It is set to `30` above for roughly, medium quality.

## Converting PNG to SVG

SVGs are great for responsive apps so if it's feasible, consider converting that PNG to an SVG using [ImageMagick](http://www.imagemagick.org/Usage/draw/#svg_output) and [AutoTrace](https://github.com/autotrace/autotrace).

```bash
convert autotrace:src/assets/logo.png src/icons/logo.svg
```

# Troubleshooting

## Error: Cannot find module 'undefinedbuild/Release/node_sqlite3.node'

This is caused by editing files while the app is transpiling.

## Error: Could not detect abi for version and runtime electron

```bash
rm -rf package-lock.json node_modules
npm install
```

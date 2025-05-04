# LIGA Esports Manager

[![Discord](https://img.shields.io/discord/1296858234853789826?style=for-the-badge&label=Join%20the%20Discord%20Server&link=https%3A%2F%2Fdiscord.gg%2FZaEwHfDD5N)](https://discord.gg/ZaEwHfDD5N)

An immersive CS:GO Esports Simulator.

## APIs and Technologies

- Node `v22.14.x`.
- Electron `v36.x`.
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

> [!IMPORTANT]
> A [Pandascore Access Token](https://app.pandascore.co/dashboard/main) is required.

LIGA uses [Prisma ORM](https://www.prisma.io/) to manage its database interactions.

A unique Prisma Client is generated from the schema defined in source control which sometimes may need to be regenerated along with the database for troubleshooting purposes.

```bash
npm run db:reset
```

After resetting the database the teams and players data will be repopulated using [PandaScore API](https://pandascore.co). A token must be provided in the `.env` file in order for this to work.

## Development CLI

Provides convenience wrappers and business logic for common development tasks.

```bash
npm run cli help
```

## Building

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

### Generating Changelog

Currently, the changelog is generated ad-hoc and manually added to the release notes body.

This is because Github's changelog generation feature only picks up PRs and not individual commits ([community/discussions/31628](https://github.com/orgs/community/discussions/31628)).

```bash
npx conventional-changelog-cli -p conventionalcommits
```

### Updating Application Icon

The installers only accept an `.ico` file so it must be manually converted from the base `assets/icon.png` image.

[More Info](https://www.electronforge.io/guides/create-and-add-icons#configuring-installer-icons).

```bash
npm run gen:icon
```

## Miscellaneous

### Marketing

The resolution used for games and the app should be set to `1280x960`.

The game being demoed should also be running in window mode so that the transition between app and game is seamless when taking videos.

### Transcoding Videos

`.webm` format should be used for videos such as the one used in the landing page because `.mp4` has stuttering and performance issues.

VP9 prefers to encode in two passes so the first pass compiles a log file with statistics about the video file which is then used in the second pass to make the video.

```bash
ffmpeg -i landing.mp4 -b:v 0 -crf 30 -pass 1 -an -f webm -y /dev/null
ffmpeg -i landing.mp4 -b:v 0 -crf 30 -pass 2 landing.webm
```

For VP9, the CRF can range from 0 (best quality) to 63 (smallest file size). It is set to `30` above for roughly, medium quality.

### Converting PNG to SVG

SVGs are great for responsive apps so if it's feasible, consider converting that PNG to an SVG using [ImageMagick](http://www.imagemagick.org/Usage/draw/#svg_output) and [AutoTrace](https://github.com/autotrace/autotrace).

```bash
convert autotrace:src/assets/logo.png src/icons/logo.svg
```

## Troubleshooting

### Error: Cannot find module 'undefinedbuild/Release/node_sqlite3.node'

This is caused by editing files while the app is transpiling.

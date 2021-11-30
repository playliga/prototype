# LIGA ESPORTS MANAGER

## Creating a release

This project uses [`electron-builder`](https://www.electron.build/configuration/publish) to publish releases. Once a release is published a pipeline is kicked off which downloads the release artifacts and uploads them to the [public releases repo](https://github.com/lemonpole/LIGA-public).

There is an race condition between `electron-builder` and the pipeline. Specifically, `electron-builder` publishes the release and then uploads the assets. The pipeline will run too soon and miss the files that are still being uploaded.

To bypass this, `electron-builder` is configured to create a Draft release which then has to be manually published.

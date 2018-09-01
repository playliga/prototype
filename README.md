# La Liga
## Development
> On Windows you will also have to install `windows-build-tools` so that electron-rebuild does not fail
> when attempting to call python:
>
> `$ npm --add-python-to-path install --global --production windows-build-tools`
```console
$ npm install

# Rebuild the sqlite adapter for your environment
$ ./node_modules/.bin/electron-rebuild  -f -w sqlite3

$ npm run start:dev
```

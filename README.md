# Minecraft Syncer

Tool that can be used to sync Minecraft save games using Google Drive.
The goal is that this project will result in a script with two commands that can be called by the
pre and post phases of MultiMC's launching

## Getting started on development

Install dependencies
```sh
bun install
```

Get a credentials.json file for the correct app from the [Google cloud credentials](https://console.cloud.google.com/apis/credentials) page.

## Building binaries

Bun can be used to build the binaries.

**Build for Linux x64**
```sh
bun build --compile --target=bun-linux-x64 ./index.ts --outfile multimc-sync
```

**Build for Windows x64**
```sh
bun build --compile --target=bun-bun-windows-x64 ./index.ts --outfile multimc-sync
```

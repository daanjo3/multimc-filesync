# Minecraft Syncer

Tool that can be used to sync Minecraft save games using Google Drive.
The goal is that this project will result in a script with two commands that can be called by the
pre and post phases of MultiMC's launching

## Getting started on development

Install dependencies

```sh
bun install
```

Get a credentials.json file for the correct app from the [Google cloud credentials](https://console.cloud.google.com/apis/credentials) page. Make sure to put this file in the root of the project directory.

## Building binaries

Bun can be used to build the binaries. See package.json for the commands.

## ToDo's

- Build pipeline which builds a binary along with the Google OAuth credentials
- Use app-properties for registering the save-name instead of using the filename to make it safer.
- Update method for identifying instances (maybe user-controlled?)

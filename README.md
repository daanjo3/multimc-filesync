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

Bun can be used to build the binaries. You can use the following commands:

```sh
# Linux build
bun run build:linux

# Windows build
bun run build:windows

# Default build (linux)
bun run build
```

## Using the tool

In its current state the tool can be used to synchronize files between Linux machines. In order to do this, follow the following steps:

1. Get a credentials file and put it in the root of the project directory
2. Build the binary using the commands above.
3. In MultiMC open the instance settings and navigate to `Custom Commands`.
4. Add the follow pre-launch command: `/path/to/filesync/binary down`
5. Add the follow post-exit command: `/path/to/filesync/binary up`
6. Launch! The first run and periodically afterwards Google Auth will ask for permission. You need to grant this to use the tool.

## ToDo's

- Make the script Windows friendly
- Build pipeline which builds a binary along with the Google OAuth credentials
- Use app-properties for registering the save-name and modified time instead of using the filename and GDrive modified time to make it more reliable.
- Update method for identifying instances (maybe user-controlled?)
- Update GDrive rights, they are a bit excessive now.

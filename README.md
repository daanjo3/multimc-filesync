# Minecraft Syncer

Tool that can be used to sync Minecraft save games using Google Drive and MultiMC. This project offers a pre-launch command and a post-exit command that will download or upload savegames to **your own** Google Drive.

## Disclaimer

This tool will move around your save-files and has not been tested extensively on all Minecraft/MultiMC versions. Use it at your own risk.

## Installation

1. Download the binary for your platform from the release page.
2. Copy the binary to your MultiMC home folder (or any other place on your filesystem)
3. In MultiMC, goto Settings -> Custom Commands and add the following commands:
   - Pre-launch command (linux): `/path/to/filesync/binary/folder/filesync-linux-x64-<version> down`
   - Post-exit command (linux): `/path/to/filesync/binary/folder/filesync-linux-x64-<version> up`
   - Pre-launch command (linux): `C:\\path\to\filesync\binary\folder\filesync-windows-x64-<version> down`
   - Post-exit command (linux): `C:\\path\to\filesync\binary\folder\filesync-windows-x64-<version> up`
4. The first time you will launch a Minecraft instance a Google page will open in your browser asking for permission, provide this.
5. Your Minecraft startup might hang now, kill the process and restart. It should work now.

To de-install simply remove the custom commands, delete the binary and the created filesync folder in your MultiMC directory.

## Building binaries

You can also simply build the binaries yourself, or run it from source. To build the binaries you can use Bun by calling the following commands:

```sh
# Linux build
bun run build:linux

# Windows build
bun run build:windows

# Default build (linux)
bun run build
```

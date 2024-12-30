import config from './config'
import fs from 'node:fs'
import path from 'node:path'
import gdrive from './gdrive'

async function init(): Promise<void> {
  // Bunch of stuff that needs to be handled before first script run
  if (!config.baseDir) {
    throw 'Environment variable MMC_SYNC_DIR is not set'
  }
  if (!fs.existsSync(path.resolve(config.baseDir, '..', 'multimc.cfg'))) {
    throw `Basedir (${config.baseDir}) is not set to the filesync subfolder of multimc`
  }

  // Ensure the multimc-filesync directory exists
  if (!fs.existsSync(config.baseDir)) {
    fs.mkdirSync(config.baseDir, { recursive: false })
  }

  if (config.clearLogOnStart && fs.existsSync(config.logging.filepath)) {
    fs.truncateSync(config.logging.filepath)
  }

  // Initialize the MCSync directory as a means to handle first-time auth
  await gdrive.getOrCreateMinecraftSyncDir()
}

export default init

import config from './config'
import fs from 'node:fs'

// Bunch of stuff that needs to be handled before first script run
if (!config.baseDir) {
  throw 'Environment variable MMC_SYNC_DIR is not set'
}

// Ensure the multimc-filesync directory exists
if (!fs.existsSync(config.baseDir)) {
  console.log(`Creating directory ${config.baseDir}`)
  fs.mkdirSync(config.baseDir, { recursive: false })
}

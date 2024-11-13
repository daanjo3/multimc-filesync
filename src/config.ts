import appCredentials from '../credentials.json'
import path from 'node:path'

const baseDir = path.join(process.env.INST_DIR!, '..', '..', 'filesync')

export default {
  baseDir,
  clearLogOnStart: process.env.MMC_SYNC_CLEAR_LOG == 'true',
  logging: {
    filepath: path.join(baseDir, 'mmc_filesync.log'),
    level: process.env.MMC_SYNC_LOGGING_LEVEL ?? 'info',
  },
  drive: {
    baseDirName: process.env.MMC_SYNC_DRIVE_DIR ?? 'MinecraftSync',
    appCredentials,
  },
}

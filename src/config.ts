import appCredentials from '../credentials.json'
import path from 'node:path'

export default {
  baseDir: path.resolve(process.env.INST_DIR!, '..', '..', 'filesync'),
  clearLogOnStart: process.env.MMC_SYNC_CLEAR_LOG == 'true',
  logging: {
    filepath: `${process.env.MMC_SYNC_DIR}/mmc_filesync.log`,
    level: process.env.LOGGING_LEVEL ?? 'info',
  },
  drive: {
    baseDirName: process.env.MMC_SYNC_DRIVE_DIR ?? 'MinecraftSync',
    appCredentials,
  },
}

import appCredentials from '../credentials.json'

export default {
  baseDir: process.env.MMC_SYNC_DIR,
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

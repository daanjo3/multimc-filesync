export default {
  baseDir: process.env.MMC_SYNC_DIR,
  logFilePath: `${process.env.MMC_SYNC_DIR}/mmc_filesync.log`,
  clearLogOnStart: process.env.MMC_SYNC_CLEAR_LOG == 'true',
}

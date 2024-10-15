import { createLogger, format, transports } from 'winston'
import config from './config'
const { combine, timestamp, prettyPrint } = format

const filename = `${config.baseDir}/mmc_filesync.log`

const logger = createLogger({
  level: 'info',
  format: combine(
    timestamp(),
    prettyPrint()
  ),
  transports: [
    new transports.File({ filename })
  ]
})

if (process.env.NODE_ENV !== 'production') {
  logger.add(new transports.Console({
    format: format.simple(),
  }));
}

export default logger

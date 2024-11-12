import { createLogger, format, transports } from 'winston'
import config from './config'
const { combine, timestamp, prettyPrint } = format

const logger = createLogger({
  level: config.logging.level,
  format: combine(timestamp(), prettyPrint()),
  transports: [new transports.File({ filename: config.logging.filepath })],
})

if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new transports.Console({
      format: format.simple(),
    }),
  )
}

export default logger

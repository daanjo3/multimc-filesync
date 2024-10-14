import { createLogger, format, transports } from 'winston'
const { combine, timestamp, prettyPrint } = format

const path = `/home/daanjo3/projects/multimc-filesync/out/file.log`

const logger = createLogger({
  level: 'info',
  format: combine(
    timestamp(),
    prettyPrint()
  ),
  transports: [
    new transports.File({ filename: path })
  ]
})

if (process.env.NODE_ENV !== 'production') {
  logger.add(new transports.Console({
    format: format.simple(),
  }));
}

export default logger

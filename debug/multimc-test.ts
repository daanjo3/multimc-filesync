import { parseArgs } from 'util'
import multimc from '../multimc'
import logger from '../logger'

const { positionals } = parseArgs({
    args: Bun.argv,
    allowPositionals: true,
  })

const context = multimc.getContext()

logger.info(`command: ${positionals}`)
// logger.info('environments', {
//   name: process.env.INST_NAME,
//   id: process.env.INST_ID,
//   instanceDir: process.env.INST_DIR,
//   mcDir: process.env.INST_MC_DIR,
//   javaBin: process.env.INST_JAVA,
//   javaArgs: process.env.INST_JAVA_ARGS
// })

logger.info(`config value of lastLaunchTime: `+multimc.cfg().get('lastLaunchTime'))

multimc.cfg().set('lastSynced', 1728928943582)

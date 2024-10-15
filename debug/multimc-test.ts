import '../src/init'
import { parseArgs } from 'util'
import multimc from '../src/multimc'
import logger from '../src/logger'

// Test file to verify MultiMC running this script

const { positionals } = parseArgs({
  args: Bun.argv,
  allowPositionals: true,
})

const context = multimc.getContext()

logger.info(`command: ${positionals}`)
logger.info('context', { context })
logger.info('environments', {
  environment: {
    name: process.env.INST_NAME,
    id: process.env.INST_ID,
    instanceDir: process.env.INST_DIR,
    mcDir: process.env.INST_MC_DIR,
    javaBin: process.env.INST_JAVA,
    javaArgs: process.env.INST_JAVA_ARGS,
  },
})

logger.info('config (lastLaunchTime)', {
  lastLaunchTime: multimc.cfg().get('lastLaunchTime'),
})

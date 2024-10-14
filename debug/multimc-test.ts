import { parseArgs } from 'util'
import multimc from '../multimc'

const { positionals } = parseArgs({
    args: Bun.argv,
    allowPositionals: true,
  })

const context = multimc.getContext()
console.log()
import './init'
import process from 'process'
import { parseArgs } from 'util'
import { updateRemote, updateLocal } from './sync'

const { positionals } = parseArgs({
  args: Bun.argv,
  allowPositionals: true,
})

// TODO rename to 'remote' / 'local' so the command becomes: `sync remote` or `sync local`
if (positionals.length < 3) {
  throw 'Missing parameter `up` or `down`'
}
if (positionals.length > 3) {
  throw 'Too many arguments'
}
switch (positionals[2]) {
  case 'up':
    await updateRemote()
    process.exit()
  case 'down':
    await updateLocal()
    process.exit()
  default:
    throw 'command argument must be `up` or `down`'
}

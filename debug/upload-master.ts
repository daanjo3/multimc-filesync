import { parseArgs } from 'util'
import { createFile } from '../gdrive'

const { values } = parseArgs({
  args: Bun.argv,
  options: {
    input: {
      short: 'i',
      type: 'string',
    },
    type: {
      short: 't',
      type: 'string', // master | proxy
    },
  },
  strict: true,
  allowPositionals: true,
})

if (!values.input) {
  console.log('Missing input')
  process.exit(1)
}
const input = values.input
const type = values.type ?? 'master'

const file = Bun.file(input)
if (!(await file.exists())) {
  console.log(`File ${file} does not exist`)
  process.exit(1)
}

const MCNAME = 'TestWorld'
const MCHOST = 'TestHost'
const MCINSTANCE = 'FakeTestInstance'

// TODO file.name returns a path instead of a name
if (type == 'master') {
  createFile(file, file.name ?? MCNAME, {
    mcInstance: MCINSTANCE,
    mcType: type,
  }).then((r) => console.log(r.data))
}
if (type == 'proxy') {
  createFile(file, file.name ?? MCNAME, {
    mcInstance: MCINSTANCE,
    mcHost: MCHOST,
    mcType: type,
  }).then((r) => console.log(r.data))
}

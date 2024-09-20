import { parseArgs } from 'util'
import { uploadFile } from '../gdrive'
import fs from 'node:fs'
import path from 'node:path'

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
const fp = values.input
const type = values.type ?? 'master'

if (fs.existsSync(fp)) {
  console.log(`File ${fp} does not exist`)
  process.exit(1)
}
const filename = path.basename(fp)
const fileStream = fs.createReadStream(fp)

const MCNAME = 'TestWorld'
const MCHOST = 'TestHost'
const MCINSTANCE = 'FakeTestInstance'

// TODO file.name returns a path instead of a name
if (type == 'master') {
  uploadFile(fileStream, filename ?? MCNAME, {
    mcInstance: MCINSTANCE,
    mcType: type,
  }).then((data) => console.log(data))
}
if (type == 'proxy') {
  uploadFile(fileStream, filename ?? MCNAME, {
    mcInstance: MCINSTANCE,
    mcHost: MCHOST,
    mcType: type,
  }).then((data) => console.log(data))
}

import { parseArgs } from 'util'
import gdrive from '../src/gdrive/gdrive'
import fs from 'node:fs'
import path from 'node:path'
import { DriveMcWorldFile, LocalMcWorldFile } from '../src/McWorldFile'

// bun run debug/upload-master.ts -i ./data/dummy-archive-file.txt.zip -t proxy

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
if (values.type != 'master' && values.type != 'proxy') {
  throw 'type must be either "proxy" or "master"'
}
const type: 'master' | 'proxy' = values.type ?? 'master'

if (!fs.existsSync(fp)) {
  console.log(`File ${fp} does not exist`)
  process.exit(1)
}

const MCHOST = 'TestHost'
const MCINSTANCE = 'FakeTestInstance'
process.env.INST_NAME = MCINSTANCE

const dirname = path.resolve(fp)
const file = LocalMcWorldFile.fromFile(Bun.file(dirname))

const existing = await gdrive.searchFiles({
  instance: MCINSTANCE,
  host: MCHOST,
  type: 'proxy',
})
const existingRemote = existing.find((f) => f.isSameSave(file))
if (existingRemote) {
  await existingRemote.update(file.zip())
} else {
  DriveMcWorldFile.create(file.zip(), file.getFileName(), {
    mcInstance: MCINSTANCE,
    mcHost: MCHOST,
    mcType: type,
  })
}

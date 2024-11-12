import { parseArgs } from 'util'
import gdrive from '../src/gdrive'
import fs from 'node:fs'
import AdmZip from 'adm-zip'
import logger from '../src/logger'

// bun run debug/download.ts -i instancename -o ./data/

const { values } = parseArgs({
  args: Bun.argv,
  options: {
    instance: {
      short: 'i',
      type: 'string',
    },
    out: {
      short: 'o',
      type: 'string',
    }
  },
  strict: true,
  allowPositionals: true,
})

if (!values.instance) {
  logger.error('Missing instance name')
  process.exit(1)
}
if (!values.out || !fs.existsSync(values.out)) {
  logger.error('Missing output path or path invalid')
  process.exit(1)
}
const fpOut = values.out
const instanceId = values.instance

const masterFiles = await gdrive.searchFiles({
  instance: instanceId,
  type: 'master'
})

if (masterFiles.length == 0) {
  throw `No master files to download for instance ${instanceId}`
}

const masterFile = masterFiles[0]

const filename = `${fpOut}/${masterFile.getFileName()}`
const filenameZipped = `${filename}.zip`

logger.info('File info', { filename, filenameZipped })

const downloadStream = await masterFile.downloadReadable()
const writeStream = fs.createWriteStream(filenameZipped)
downloadStream.pipe(writeStream)

downloadStream.on('end', () => {

  logger.info(`Opening archive and extracting it to file '${filename}'`)
  const archive = new AdmZip(filenameZipped)
  archive.extractAllTo(filename)

})

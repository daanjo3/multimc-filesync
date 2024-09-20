import multimc from './multimc'
import gdrive from './gdrive'
import { Readable } from 'node:stream'
import cp from 'child_process'
import os from 'os'
import { DriveMcWorldFile } from './McWorldFile'

function getComputerName(): string {
  switch (process.platform) {
    case 'win32':
      const winComputerName = process.env.COMPUTERNAME
      if (!winComputerName) {
        throw 'Windows computer name could not be found'
      }
      return winComputerName
    case 'linux':
      const prettyname = cp.execSync('hostnamectl --pretty').toString().trim()
      return prettyname === '' ? os.hostname() : prettyname
    default:
      return os.hostname()
  }
}

async function syncUp() {
  // 1. List all local and remote master files
  const { instance } = multimc.getContext()
  const hostname = getComputerName()

  const localFiles = await multimc.listSaves()
  console.log(
    'Found local instance files:\n' +
      localFiles.map((f) => f.toString()).join('\n'),
  )

  const remoteFiles = await gdrive.searchFiles({
    instance: instance.id,
    host: hostname,
  })
  const remoteMasterFiles = remoteFiles.filter((f) => f.getType() == 'master')
  const remoteProxyFiles = remoteFiles.filter((f) => f.getType() == 'proxy')
  console.log(
    'Found remote instance files:\n' +
      remoteProxyFiles.map((f) => f.toString()),
  )

  // Update proxies on remote
  for (const localFile of localFiles) {
    const remoteFile = remoteProxyFiles.find((rf) => rf.isSameSave(localFile))
    if (remoteFile && remoteFile.isNewerThan(localFile)) {
      console.log(
        `Skipping updating remote (${remoteFile.lastUpdated.toLocaleDateString()}) as it is newer than local (${remoteFile.lastUpdated.toLocaleDateString()})`,
      )
      continue
    }
    const stream = Readable.from(localFile.zip())
    const uploadedFile = await gdrive.uploadFile(
      stream,
      localFile.getFileName() + '.zip',
      { mcHost: hostname, mcInstance: instance.id, mcType: 'proxy' },
    )
    console.log(
      `uploaded proxy file ${localFile.getFileName()} which has now ID ${uploadedFile.id}`,
      { appProperties: uploadedFile.appProperties },
    )
    // TODO Update metadata on remote file
  }

  // TODO Update master from proxies
}

function syncDown() {
  // 1. List all local and remote proxy files
  // 2. Update remote proxy files where local file is newer
  // 3. Upload any local files for which there is no remote proxy file
  // 4. Update any master file where the proxy file is newer
}

syncUp()

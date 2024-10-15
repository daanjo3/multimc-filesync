import './init'
import multimc from './multimc'
import gdrive from './gdrive/gdrive'
import system from './system'
import process from 'process'
import { DriveMcWorldFile, type LocalMcWorldFile } from './McWorldFile'
import { parseArgs } from 'util'

async function syncUp() {
  // 1. List all local and remote master files
  const { instance } = multimc.getContext()
  const hostname = system.getName()

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
    const remoteProxyFile = remoteProxyFiles.find((rf) =>
      rf.isSameSave(localFile),
    )
    const remoteMasterFile = remoteMasterFiles.find((rf) =>
      rf.isSameSave(localFile),
    )
    await syncUpFile(localFile, remoteProxyFile, remoteMasterFile)
  }
}

async function syncUpFile(
  localFile: LocalMcWorldFile,
  remoteProxyFile: DriveMcWorldFile | undefined,
  remoteMasterFile: DriveMcWorldFile | undefined,
) {
  if (remoteProxyFile && remoteProxyFile.isNewerThan(localFile)) {
    console.log(
      `Skipping updating remote (${remoteProxyFile.lastUpdated.toLocaleDateString()}) as it is newer than local (${remoteProxyFile.lastUpdated.toLocaleDateString()})`,
    )
    return
  }

  const { instance } = multimc.getContext()
  const hostname = system.getName()

  if (remoteProxyFile) {
    console.log(`Update proxy file: ${localFile.getFileName()}`)
    await remoteProxyFile.update(localFile.zip())
  } else {
    console.log(`Creating new proxy file: ${localFile.getFileName()}`)
    DriveMcWorldFile.create(localFile.zip(), localFile.getFileName(), {
      mcHost: hostname,
      mcInstance: instance.id,
      mcType: 'proxy',
    })
  }

  if (remoteMasterFile) {
    console.log(`Updating master file: ${localFile.getFileName()}`)
    await remoteMasterFile.update(localFile.zip())
  } else {
    console.log(`Creating new master file: ${localFile.getFileName()}`)
    DriveMcWorldFile.create(localFile.zip(), localFile.getFileName(), {
      mcInstance: instance.id,
      mcType: 'master',
    })
  }
}

async function syncDown() {
  // 1. List all local and remote proxy files
  // 2. Update remote proxy files where local file is newer
  // 3. Upload any local files for which there is no remote proxy file
  // 4. Update any master file where the proxy file is newer
}

const { positionals } = parseArgs({
  args: Bun.argv,
  allowPositionals: true,
})

if (positionals.length < 3) {
  throw 'Missing parameter `up` or `down`'
}
if (positionals.length > 3) {
  throw 'Too many arguments'
}
switch (positionals[2]) {
  case 'up':
    await syncUp()
    process.exit()
  case 'down':
    await syncDown()
    process.exit()
  default:
    throw 'command argument must be `up` or `down`'
}

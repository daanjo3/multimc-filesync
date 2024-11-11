import multimc, { type MultiMcInstance } from './multimc'
import gdrive from './gdrive/gdrive'
import system from './system'
import { DriveMcWorldFile, LocalMcWorldFile, McWorldFile } from './McWorldFile'
import logger from './logger'

async function loadFileIndex(instance: MultiMcInstance, hostname: string) {
  const [localFiles, remoteFiles] = await Promise.all([
    multimc.listSaves(),
    gdrive.searchFiles({
      instance: instance.id,
      host: hostname,
    }),
  ])
  logger.info(
    'Found local instance files:\n' +
      localFiles.map((f) => f.toString()).join('\n'),
  )
  const remoteMasterFiles = remoteFiles.filter((f) => f.getType() == 'master')
  const remoteProxyFiles = remoteFiles.filter((f) => f.getType() == 'proxy')
  logger.info(
    'Found remote instance files:\n' +
      remoteProxyFiles.map((f) => f.toString()),
  )
  return {
    localFiles,
    remoteFiles,
    remoteMasterFiles,
    remoteProxyFiles,
  }
}

export async function updateRemote() {
  // 1. List all local and remote master files
  const { instance } = multimc.getContext()
  const hostname = system.getName()

  const { localFiles, remoteMasterFiles, remoteProxyFiles } =
    await loadFileIndex(instance, hostname)

  // Update proxies on remote
  // TODO wrap in Promise.all(Settled)
  for (const localFile of localFiles) {
    const remoteProxyFile = remoteProxyFiles.find((rf) =>
      rf.isSameSave(localFile),
    )
    const remoteMasterFile = remoteMasterFiles.find((rf) =>
      rf.isSameSave(localFile),
    )
    // Check whether local file is updated / known by remote
    if (remoteProxyFile && remoteProxyFile.isNewerThan(localFile)) {
      logger.info(
        `Skipping updating ${localFile.getFileName()} as remote (${remoteProxyFile.lastUpdated.toLocaleDateString()}) is newer than local (${localFile.lastUpdated.toLocaleDateString()})`,
      )
      return
    }
    await updateRemoteFile(
      localFile,
      remoteProxyFile,
      remoteMasterFile,
      instance,
      hostname,
    )
  }
}

async function updateRemoteFile(
  localFile: LocalMcWorldFile,
  remoteProxyFile: DriveMcWorldFile | undefined,
  remoteMasterFile: DriveMcWorldFile | undefined,
  instance: MultiMcInstance,
  hostname: string,
) {
  // Upsert proxy on remote
  if (remoteProxyFile) {
    logger.info(`Update proxy file: ${localFile.getFileName()}`)
    await remoteProxyFile.update(localFile.zip())
  } else {
    logger.info(`Creating new proxy file: ${localFile.getFileName()}`)
    await DriveMcWorldFile.create(localFile.zip(), localFile.getFileName(), {
      mcHost: hostname,
      mcInstance: instance.id,
      mcType: 'proxy',
    })
  }

  // Upsert master on remote
  if (remoteMasterFile) {
    logger.info(`Updating master file: ${localFile.getFileName()}`)
    await remoteMasterFile.update(localFile.zip())
  } else {
    logger.info(`Creating new master file: ${localFile.getFileName()}`)
    await DriveMcWorldFile.create(localFile.zip(), localFile.getFileName(), {
      mcInstance: instance.id,
      mcType: 'master',
    })
  }
}

export async function updateLocal() {
  // 1. List all local and remote master files
  const { instance } = multimc.getContext()
  const hostname = system.getName()

  const { localFiles, remoteMasterFiles } = await loadFileIndex(
    instance,
    hostname,
  )

  // 2. Update local files where remote master exists and is newer
  for (const remoteMasterFile of remoteMasterFiles) {
    const localFile = localFiles.find((lf) => lf.isSameSave(remoteMasterFile))
    if (localFile && localFile.isNewerThan(remoteMasterFile)) {
      logger.info(
        `Skipping updating ${localFile.getFileName()} as local (${localFile.lastUpdated.toLocaleDateString()}) is newer than remote master (${remoteMasterFile?.lastUpdated.toLocaleDateString()})`,
      )
      return
    }

    const filebuf = await remoteMasterFile.download()
    if (localFile) {
      await localFile.update(filebuf)
    } else {
      LocalMcWorldFile.create(
        remoteMasterFile.getFileName(),
        remoteMasterFile.lastUpdated,
        filebuf,
      )
    }
  }
}

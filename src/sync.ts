import multimc, { type MultiMcInstance } from './multimc'
import gdrive from './gdrive/gdrive'
import system from './system'
import { DriveMcWorldFile, LocalMcWorldFile } from './worldfile'
import logger from './logger'

// TODO split so while uploading skip remote index if there are no local files
async function loadFileIndex(instanceId: string, host: string) {
  const [localFiles, remoteProxyFiles, remoteMasterFiles] = await Promise.all([
    multimc.listSaves(),
    gdrive.searchFiles({
      instance: instanceId,
      host,
      type: 'proxy',
    }),
    gdrive.searchFiles({
      instance: instanceId,
      type: 'master',
    }),
  ])
  logger.debug(
    'Found local instance files:\n' +
      localFiles.map((f) => f.toString()).join('\n'),
  )
  logger.debug(
    'Found remote proxy files:\n' +
      remoteProxyFiles.map((f) => f.toString()).join('\n'),
  )
  logger.debug(
    'Found remote master files:\n' +
      remoteMasterFiles.map((f) => f.toString()).join('\n'),
  )
  return {
    localFiles,
    remoteMasterFiles,
    remoteProxyFiles,
  }
}

export async function updateRemote() {
  // 1. List all local and remote master files
  const { instance } = multimc.getContext()
  const hostname = system.getName()

  const { localFiles, remoteMasterFiles, remoteProxyFiles } =
    await loadFileIndex(instance.id, hostname)

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
        `Skipping updating ${localFile.getFileName()} as remote (${remoteProxyFile.lastUpdated.toISOString()}) is newer than local (${localFile.lastUpdated.toISOString()})`,
      )
      continue
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
  if (!remoteMasterFile) {
    logger.info(`Creating new master file: ${localFile.getFileName()}`)
    remoteMasterFile = await DriveMcWorldFile.create(
      localFile.zip(),
      localFile.getFileName(),
      {
        mcInstance: instance.id,
        mcType: 'master',
      },
    )
  } else if (localFile.isNewerThan(remoteMasterFile)) {
    logger.info(`Updating master file: ${localFile.getFileName()}`)
    await remoteMasterFile.update(localFile.zip())
  }
  // Update local file's lastUpdate to prevent update looping
  // TODO proxy file update is always firing because it updates much earlier than master
  localFile.setLastModified(remoteMasterFile.lastUpdated)
}

export async function updateLocal() {
  // 1. List all local and remote master files
  const { instance } = multimc.getContext()
  const hostname = system.getName()
  const { localFiles, remoteMasterFiles } = await loadFileIndex(
    instance.id,
    hostname,
  )

  // 2. Update local files where remote master exists and is newer
  for (const remoteMasterFile of remoteMasterFiles) {
    const localFile: LocalMcWorldFile | undefined = localFiles.find((lf) =>
      lf.isSameSave(remoteMasterFile),
    )
    // Can't reverse the time comparison as the 1 second leeway will cause this to always fail
    if (localFile && !remoteMasterFile.isNewerThan(localFile)) {
      logger.info(
        `Skipping updating ${localFile.getFileName()} as local (${localFile.lastUpdated.toISOString()}) is newer than remote master (${remoteMasterFile?.lastUpdated.toISOString()})`,
      )
      continue
    }

    logger.info(
      `Downloading new or updated save ${remoteMasterFile.getFileName()}`,
    )
    const filestream = await remoteMasterFile.downloadReadable()
    if (localFile) {
      await localFile.update(filestream, remoteMasterFile.lastUpdated)
    } else {
      await LocalMcWorldFile.create(
        remoteMasterFile.getFileName(),
        filestream,
        remoteMasterFile.lastUpdated,
      )
    }
  }
}

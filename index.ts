import multimc from './multimc'
import gdrive from './gdrive'
import system from './system'
import { Readable } from 'node:stream'
import type { DriveMcWorldFile, LocalMcWorldFile } from './McWorldFile'

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
    const remoteFile = remoteProxyFiles.find((rf) => rf.isSameSave(localFile))
    if (remoteFile) {
      if (remoteFile.isNewerThan(localFile)) {
        console.log(
          `Skipping updating remote (${remoteFile.lastUpdated.toLocaleDateString()}) as it is newer than local (${remoteFile.lastUpdated.toLocaleDateString()})`,
        )
        continue
      }
      // TODO untested
      const stream = Readable.from(localFile.zip())
      const updatedFile = await gdrive.updateFile(stream, remoteFile.sourceData.filedata.id!)
      console.log(
        `updated proxy file ${localFile.getFileName()} with ID ${updatedFile.id}`,
        { appProperties: updatedFile.appProperties }
      )
      
    } else {
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
}

function syncUpFile(localFile: LocalMcWorldFile, remoteFile: DriveMcWorldFile | undefined, remoteMasterFile: DriveMcWorldFile | undefined) {
  if (remoteFile && remoteFile.isNewerThan(localFile)) {
    console.log(
      `Skipping updating remote (${remoteFile.lastUpdated.toLocaleDateString()}) as it is newer than local (${remoteFile.lastUpdated.toLocaleDateString()})`,
    )
    return
  }
  if (remoteFile)
    // TODO untested
    const stream = Readable.from(localFile.zip())
    const updatedFile = await gdrive.updateFile(stream, remoteFile.sourceData.filedata.id!)
    console.log(
      `updated proxy file ${localFile.getFileName()} with ID ${updatedFile.id}`,
      { appProperties: updatedFile.appProperties }
    )
    
  } else {
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

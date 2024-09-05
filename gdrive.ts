import { type drive_v3, google } from 'googleapis'
import authorize from './auth'
import type { GaxiosResponse } from 'gaxios'
import type { BunFile } from 'bun'
import { DriveMcWorldFile } from './McWorldFile'

const DIRNAME_MC_SYNC = 'MinecraftSync'

const getGDriveService = async () =>
  authorize().then((auth) => google.drive({ version: 'v3', auth }))

async function getExistingDir(dirName: string): Promise<string | null> {
  const service = await getGDriveService()
  const res = await service.files.list({
    pageSize: 2,
    q: `mimeType = \'application/vnd.google-apps.folder\' and name = \'${dirName}\'`,
    fields: 'files(id, name)',
  })
  const files = res.data.files
  if ((files?.length ?? 0) > 2) {
    throw new Error(
      `Found more than one directory by this name\nfiles=${files}`,
    )
  }
  if (!files || files.length == 0) {
    return null
  }
  if (!files[0].id) {
    throw new Error('File has no ID (smh)')
  }
  return files[0].id
}

async function createDir(dirName: string, parents?: string[]): Promise<string> {
  const service = await getGDriveService()
  const fileMetadata = {
    name: DIRNAME_MC_SYNC,
    mimeType: 'application/vnd.google-apps.folder',
    parents,
  }
  try {
    const file = await service.files.create({
      requestBody: fileMetadata,
      fields: 'id',
    })
    if (!file.data.id) {
      throw new Error(`Created dir ${dirName} but it didn't got an ID`)
    }
    return file.data.id
  } catch (err) {
    throw err
  }
}

async function listDir(q: string): Promise<drive_v3.Schema$File[]> {
  const service = await getGDriveService()
  const files = []

  console.log(`Looking for files with query: ${q}`)
  const res = await service.files.list({
    pageSize: 100,
    q,
    fields: 'nextPageToken, files(id, name, appProperties, modifiedTime)',
  })
  let data: drive_v3.Schema$FileList | undefined = res.data
  if (data.files) {
    files.push(...data.files)
  }
  while (data?.nextPageToken) {
    const res: GaxiosResponse<drive_v3.Schema$FileList> =
      await service.files.list({ pageToken: data.nextPageToken })
    data = res.data
    if (data.files) {
      files.push(...data.files)
    }
  }
  return files
}

async function listDirAll(): Promise<drive_v3.Schema$File[]> {
  return listDir(`'${DIRNAME_MC_SYNC}' in parents`)
}

async function getInstanceMasterRef(instanceId: string): Promise<drive_v3.Schema$File | null> {
  const files = await listDir(`appProperties has { key='mcInstance' and value='${instanceId}'} and appProperties has { key='mcType' and value='master'}`)
  if (files.length != 1) {
    console.error('Getting instance master file did not result into a single file', { files })
    return null
  }
  return files[0]
}

async function getOrCreateMinecraftSyncDir(): Promise<string> {
  console.log(`Fetching or creating dir ${DIRNAME_MC_SYNC}`)
  let dirId = await getExistingDir(DIRNAME_MC_SYNC)
  if (dirId != null) {
    console.log(`Found pre-existing directory with id: ${dirId}`)
    return dirId
  }
  dirId = await createDir(DIRNAME_MC_SYNC)
  console.log(`Created new directory with id: ${dirId}`)
  return dirId
}

type CreateProperties = { mcInstance: string } & (
  | { mcHost: string; mcType: 'proxy' }
  | { mcType: 'master' }
)
export async function createFile(
  file: BunFile,
  name: string,
  appProperties: CreateProperties,
) {
  const service = await getGDriveService()
  const dirId = await getOrCreateMinecraftSyncDir()

  const fileMetadata: drive_v3.Schema$File = {
    name: name,
    parents: [dirId],
    appProperties,
  }
  const media = {
    mimeType: 'application/zip',
    body: file.readable,
  }

  try {
    const file = await service.files.create({
      requestBody: fileMetadata,
      media,
      fields: 'id, name, appProperties',
    })
    return file
  } catch (err) {
    throw `Failed to create file\nerr=${err}`
  }
}

export async function listRemoteSaves() {
  // const dirId = await getOrCreateMinecraftSyncDir()
  return listDirAll().then((files) => files.filter((f) => !!f.appProperties).map((file) => DriveMcWorldFile.fromFile(file)))
}

async function downloadFile(fileId: string) {
  const service = await getGDriveService()
  const file = await service.files.get({ fileId, alt: 'media' })
  return file.data
}

// Create proxy file (or add revision)
// Update master file (by evaluating proxies)

// Download latest master file
export async function getMasterFileIndex(instance: string) {
  try {
    const instanceMasterRef = await getInstanceMasterRef(instance)
    if (!instanceMasterRef) {
      console.error(`Failed to fetch master ref of instance ${instance}`)
      return null
    }
    const instanceData = await downloadFile(instanceMasterRef.id!)
    if (!instanceData) {
      console.error(`Failed to download master ref with id ${instanceMasterRef.id} of instance ${instance}`)
      return null
    }
  } catch (err) {
    throw err
  }
}

// getMasterFileIndex('FakeTestInstance')
listRemoteSaves()

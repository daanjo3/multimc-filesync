import { type drive_v3, google } from 'googleapis'
import authorize from './auth'
import type { GaxiosResponse } from 'gaxios'
import type { BunFile } from 'bun'

const DIRNAME_MC_SYNC = 'MinecraftSync'

const getGDriveService = async () => authorize().then(auth => google.drive({version: 'v3', auth }))

async function getExistingDir(dirName: string): Promise<string | null> {
  const service = await getGDriveService()
  const res = await service.files.list({
    pageSize: 2,
    q: `mimeType = \'application/vnd.google-apps.folder\' and name = \'${dirName}\'`,
    fields: 'files(id, name)'
  })
  const files = res.data.files
  if ((files?.length ?? 0) > 2) {
    throw new Error(`Found more than one directory by this name\nfiles=${files}`)
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
    parents
  }
  try {
    const file = await service.files.create({
      requestBody: fileMetadata,
      fields: 'id',
    });
    if (!file.data.id) {
      throw new Error(`Created dir ${dirName} but it didn't got an ID`)
    }
    return file.data.id
  } catch (err) {
    throw err;
  }
}

async function listDir(dirId: string): Promise<drive_v3.Schema$File[]> {
  const service = await getGDriveService()
  const files = []
  
  const res = await service.files.list({
    pageSize: 100,
    q: `\'${dirId}\' in parents`,
    fields: 'nextPageToken, files(id, name, appProperties)'
  })
  let data: drive_v3.Schema$FileList | undefined = res.data
  if (data.files) {
    files.push(...data.files)
  }
  while (data?.nextPageToken) {
    const res: GaxiosResponse<drive_v3.Schema$FileList> = await service.files.list({ pageToken: data.nextPageToken })
    data = res.data
    if (data.files) {
      files.push(...data.files)
    }
  }
  return files
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

type CreateProperties = { mcInstance: string } & ({ mcHost: string, mcType: 'proxy' } | { mcType: 'master' })
export async function createFile(file: BunFile, name: string, appProperties: CreateProperties) {
  const service = await getGDriveService()
  const dirId = await getOrCreateMinecraftSyncDir()

  const fileMetadata: drive_v3.Schema$File = {
    name: name,
    parents: [dirId],
    appProperties
  }
  const media = {
    mimeType: 'application/zip',
    body: file.readable
  }

  try {
    const file = await service.files.create({
      requestBody: fileMetadata,
      media,
      fields: 'id, name, appProperties'
    })
    return file
  } catch (err) {
    throw `Failed to create file\nerr=${err}`
  }
}

export async function listRemoteSaves() {
  const dirId = await getOrCreateMinecraftSyncDir()
  return listDir(dirId)
}

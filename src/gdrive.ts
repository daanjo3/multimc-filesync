import { type drive_v3, google } from 'googleapis'
import authorize from './auth'
import type { GaxiosResponse } from 'gaxios'
import { Readable } from 'node:stream'
import { DriveMcWorldFile } from './McWorldFile'

const DIRNAME_MC_SYNC = 'MinecraftSync'

let MC_DIR_ID = ''

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

const q_inMcDir = (dirId: string) => `'${dirId}' in parents`
const q_instance = (instance: string) =>
  `appProperties has { key='mcInstance' and value='${instance}'}`
const q_host = (hostname: string) =>
  `appProperties has { key='mcHost' and value='${hostname}'}`
const q_type = (type: 'proxy' | 'master') =>
  `appProperties has { key='mcType' and value='${type}'}`

async function searchFiles(opts?: {
  instance?: string
  host?: string
  type?: 'master' | 'proxy'
}): Promise<DriveMcWorldFile[]> {
  const dirId = await getOrCreateMinecraftSyncDir()
  const query = [q_inMcDir(dirId)]
  if (opts?.host) query.push(q_host(opts.host))
  if (opts?.instance) query.push(q_instance(opts.instance))
  if (opts?.type) query.push(q_type(opts.type))

  return executeSearchFiles(query.join(' and ')).then((files) =>
    files.map(DriveMcWorldFile.fromFile),
  )
}

async function executeSearchFiles(q: string): Promise<drive_v3.Schema$File[]> {
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
    console.log('Resolving more pages')
    const res: GaxiosResponse<drive_v3.Schema$FileList> =
      await service.files.list({ pageToken: data.nextPageToken })
    data = res.data
    if (data.files) {
      files.push(...data.files)
    }
  }
  console.debug("Found files:\n"+files.map(f => JSON.stringify(f, null, 2)).join('\n'))
  return files
}

async function getOrCreateMinecraftSyncDir(): Promise<string> {
  if (MC_DIR_ID) {
    return MC_DIR_ID
  }
  console.log(`Fetching or creating dir ${DIRNAME_MC_SYNC}`)
  let dirId = await getExistingDir(DIRNAME_MC_SYNC)
  if (dirId != null) {
    console.log(`Found pre-existing directory with id: ${dirId}`)
    return dirId
  }
  MC_DIR_ID = await createDir(DIRNAME_MC_SYNC)
  console.log(`Created new directory with id: ${dirId}`)
  return MC_DIR_ID
}

export type CreateProperties = { mcInstance: string } & (
  | { mcHost: string; mcType: 'proxy' }
  | { mcType: 'master' }
)

// TODO change to make use of resumable update
export async function uploadFile(
  stream: Readable,
  name: string,
  appProperties: CreateProperties,
): Promise<drive_v3.Schema$File> {
  const service = await getGDriveService()
  const dirId = await getOrCreateMinecraftSyncDir()

  const fileMetadata: drive_v3.Schema$File = {
    name: name,
    parents: [dirId],
    appProperties,
  }
  const media = {
    mimeType: 'application/zip',
    body: stream,
  }

  try {
    const response = await service.files.create({
      requestBody: fileMetadata,
      media,
      fields: 'id, name, modifiedTime, appProperties',
    })
    // GDrive returns a 200 OK when creating a file for some reason?
    if (response.status != 200) {
      throw response.statusText
    }
    return response.data
  } catch (err) {
    throw `Failed to create file\nerr=${err}`
  }
}

// TODO change to make use of resumable update
export async function updateFile(
  stream: Readable,
  fileId: string,
): Promise<drive_v3.Schema$File> {
  const service = await getGDriveService()

  const media = {
    mimeType: 'application/zip',
    body: stream,
  }
  try {
    const response = await service.files.update({
      fileId,
      media,
      fields: 'id, name, modifiedTime, appProperties',
    })
    if (response.status != 200) {
      throw response.statusText
    }
    return response.data
  } catch (err) {
    throw `Failed to update file ${fileId}\nerr=${err}`
  }
}

export async function downloadFile(fileId: string) {
  const service = await getGDriveService()
  const file = await service.files.get(
    { fileId, alt: 'media' },
    { responseType: 'stream' },
  ) // Parse stream to file
  return file.data
}

export default {
  searchFiles,
  uploadFile,
  updateFile,
  downloadFile,
}

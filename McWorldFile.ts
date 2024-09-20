import type { BunFile } from 'bun'
import type { drive_v3 } from 'googleapis'
import { downloadFile } from './gdrive'
import AdmZip from 'adm-zip'
import fs from 'node:fs'

type SourceType = 'gdrive' | 'local'
type SourceFile = BunFile | drive_v3.Schema$File

interface SourceData<A = SourceType, B = SourceFile> {
  type: A
  filedata: B
}

interface GDriveAppProperties {
  mcInstance: string
  mcHost: string
  mcType: string
}

type DriveMcFile = drive_v3.Schema$File & {
  appProperties: GDriveAppProperties
} & { name: string; modifiedTime: string }
type GDriveData = SourceData<'gdrive', DriveMcFile>
type LocalData = SourceData<'local', BunFile>

const hasRequiredFields = {
  gDrive: (file: drive_v3.Schema$File): file is DriveMcFile =>
    !!file.name &&
    !!file.modifiedTime &&
    !!file.appProperties?.mcInstance &&
    !!file.appProperties?.mcHost &&
    !!file.appProperties?.mcType,
  local: (
    file: BunFile,
  ): file is BunFile & { name: string; lastModified: Date } =>
    !!file.lastModified && !!file.name,
}

export abstract class McWorldFile<SD extends SourceData> {
  name: string
  lastUpdated: Date
  instance: string
  sourceData: SD

  constructor(
    name: string,
    lastUpdated: Date,
    instance: string,
    sourceData: SD,
  ) {
    this.name = name
    this.lastUpdated = lastUpdated
    this.instance = instance
    this.sourceData = sourceData
  }

  abstract getFileName(): string

  getSource() {
    return this.sourceData.type
  }

  isSameSave(other: McWorldFile<SourceData>) {
    return (
      this.getFileName() == other.getFileName() &&
      this.instance == other.instance
    )
  }

  isNewerThan(other: McWorldFile<SourceData>) {
    return this.lastUpdated > other.lastUpdated
  }

  toString() {
    return JSON.stringify(
      {
        name: this.getFileName(),
        instance: this.instance,
        type: this.getSource(),
        lastUpdated: this.lastUpdated.toISOString(),
      },
      null,
      2,
    )
  }
}

export class LocalMcWorldFile extends McWorldFile<LocalData> {
  constructor(
    name: string,
    lastUpdated: Date,
    instance: string,
    sourceData: LocalData,
  ) {
    super(name, lastUpdated, instance, sourceData)
  }

  static fromFile(file: BunFile) {
    if (!hasRequiredFields.local(file)) {
      console.log({ file: file })
      throw 'Local file does not have all required fields'
    }
    const mcInstance = process.env.INST_NAME
    if (!mcInstance) {
      throw 'Instance name env var not present'
    }
    return new LocalMcWorldFile(
      file.name,
      new Date(file.lastModified),
      mcInstance,
      { type: 'local', filedata: file },
    )
  }

  getFileName() {
    if (this.name.includes('/')) {
      return this.name.split('/').at(-1)!
    }
    return this.name
  }

  getFilePath() {
    if (!this.name.startsWith('/')) {
      throw 'Filename is not absolute path!'
    }
    return this.name
  }

  zip(): Buffer {
    const archive = new AdmZip()
    archive.addLocalFolder(this.getFilePath())
    return archive.toBuffer()
  }
}

export class DriveMcWorldFile extends McWorldFile<GDriveData> {
  constructor(
    name: string,
    lastUpdated: Date,
    instance: string,
    sourceData: GDriveData,
  ) {
    super(name, lastUpdated, instance, sourceData)
  }

  static fromFile(file: drive_v3.Schema$File) {
    if (!hasRequiredFields.gDrive(file)) {
      console.log({ file: JSON.stringify(file, null, 2) })
      throw 'Drive file does not have all required fields'
    }
    return new DriveMcWorldFile(
      file.name,
      new Date(file.modifiedTime),
      file.appProperties.mcInstance,
      { type: 'gdrive', filedata: file },
    )
  }

  getType(): 'proxy' | 'master' {
    const type = this.sourceData.filedata.appProperties.mcType
    if (!type) {
      throw 'app property "type" was not present'
    }
    if (type !== 'proxy' && type !== 'master') {
      throw 'app property "type" was neither proxy nor master'
    }
    return type
  }

  getFileName() {
    if (this.name.includes('.zip')) {
      return this.name.substring(0, this.name.length - '.zip'.length)
    }
    return this.name
  }

  async download(): Promise<Buffer> {
    const stream = await downloadFile(this.sourceData.filedata.id!)
    const _buff = []
    for await (const chunk of stream) {
      _buff.push(chunk)
    }
    return Buffer.from(_buff)
  }
}

class McWorldFilePair {
  local: LocalMcWorldFile
  remote: DriveMcWorldFile

  constructor(local: LocalMcWorldFile, remote: DriveMcWorldFile) {
    this.local = local
    this.remote = remote
  }

  async syncDown() {
    // Download file from drive
    const buffer = await this.remote.download()
    // Remove existing local file
    fs.rmSync(this.local.getFilePath(), { recursive: true, force: true })
    // Unzip into target directory
    const archive = new AdmZip(buffer)
    archive.extractAllTo(this.local.getFilePath())
  }

  async syncUp() {
    // Get zipped version of the folder
    const archive = this.local.zip()
    // TODO upload as new revision
  }
}

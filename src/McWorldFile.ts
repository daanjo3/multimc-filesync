import type { BunFile } from 'bun'
import type { drive_v3 } from 'googleapis'
import { Readable } from 'node:stream'
import gdrive, { type CreateProperties } from './gdrive'
import AdmZip from 'adm-zip'
import path from 'node:path'

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

export abstract class McWorldFile<SF extends SourceFile> {
  name: string
  lastUpdated: Date
  instance: string
  type: SourceType
  data: SF

  constructor(
    name: string,
    lastUpdated: Date,
    instance: string,
    type: SourceType,
    data: SF,
  ) {
    this.name = name
    this.lastUpdated = lastUpdated
    this.instance = instance
    this.type = type
    this.data = data
  }

  abstract getFileName(): string

  getData(): SF {
    return this.data
  }

  getSource(): SourceType {
    return this.type
  }

  isSameSave(other: McWorldFile<SourceFile>): boolean {
    const sameName = this.getFileName() == other.getFileName()
    const sameInstance = this.instance == other.instance
    const sameFile = sameName && sameInstance
    console.debug(`File is equal: ${sameFile}`, 
      { this: { name: this.getFileName(), instance: this.instance }},
      { other: { name: other.getFileName(), instance: other.instance }}
    )
    return sameFile
  }

  isNewerThan(other: McWorldFile<SourceFile>) {
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

export class LocalMcWorldFile extends McWorldFile<BunFile> {
  constructor(
    name: string,
    lastUpdated: Date,
    instance: string,
    data: BunFile,
  ) {
    super(name, lastUpdated, instance, 'local', data)
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
      file
    )
  }

  getFileName() {
    return path.basename(this.name)
  }

  getFilePath() {
    if (!this.name.startsWith('/')) {
      throw 'Filename is not absolute path!'
    }
    return this.name
  }

  // Also include JourneyMap data in main instance folder if present
  zip(): Readable {
    const archive = new AdmZip()
    archive.addLocalFolder(this.getFilePath())
    return Readable.from(archive.toBuffer())
  }
}

export class DriveMcWorldFile extends McWorldFile<drive_v3.Schema$File> {
  constructor(
    name: string,
    lastUpdated: Date,
    instance: string,
    file: drive_v3.Schema$File
  ) {
    super(name, lastUpdated, instance, 'gdrive', file)
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
      file
    )
  }

  static async create(stream: Readable, name: string, appProperties: CreateProperties): Promise<DriveMcWorldFile> {
    try {
      const newFile = await gdrive.uploadFile(stream, name, appProperties)
      const newWorldFile = this.fromFile(newFile)
      console.log(`Created new file ${newWorldFile.getFileName()}`, { meta: newWorldFile.getMeta() })
      return newWorldFile
    } catch (err) {
      throw `Failed to upload new save file\nerr: ${err}`
    }
  }

  async download(): Promise<Buffer> {
    const stream = await gdrive.downloadFile(this.data.id!)
    const _buff = []
    for await (const chunk of stream) {
      _buff.push(chunk)
    }
    console.log(`Downloaded file ${this.getFileName()}`, { meta: this.getMeta() })
    return Buffer.from(_buff)
  }

  async update(stream: Readable): Promise<DriveMcWorldFile> {
    try {
      const updatedFile = await gdrive.updateFile(stream, this.data.id!)
      this.data = updatedFile
      console.log(`Updated file ${this.getFileName()}`, { meta: this.getMeta() })
      return this
    } catch (err) {
      throw `Failed to update file\nerr: ${err}`
    }
  }

  getType(): 'proxy' | 'master' {
    const type = this.data.appProperties!.mcType
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

  getMeta(): Record<string, any> {
    return {
      'name': this.getFileName(),
      'id': this.data.id!,
      'modifiedTime': this.data.modifiedTime,
      'appProperties': this.data.appProperties
    }
  }
}

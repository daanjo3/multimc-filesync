import type { BunFile } from 'bun'
import type { drive_v3 } from 'googleapis'
import { Readable } from 'node:stream'
import gdrive, { type CreateProperties } from './gdrive'
import multimc from './multimc'
import AdmZip from 'adm-zip'
import path from 'node:path'
import fs from 'node:fs'
import logger from './logger'
import config from './config'

type SourceType = 'gdrive' | 'local'
type SourceFile = BunFile | drive_v3.Schema$File

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
    !!file.appProperties?.mcType &&
    // If not master a host needs to be provided
    (file.appProperties.mcType == 'master' || !!file.appProperties.mcHost),
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
    logger.debug(
      `File is equal: ${sameFile}`,
      { this: { name: this.getFileName(), instance: this.instance } },
      { other: { name: other.getFileName(), instance: other.instance } },
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
      file,
    )
  }

  static create(saveName: string, lastModified: Date, filebuf: Buffer) {
    const { instance } = multimc.getContext()
    const filename = `${instance.savesPath}/${saveName}`

    const archive = new AdmZip(filebuf)
    archive.extractAllTo(filename)
    fs.utimesSync(filename, new Date(), lastModified) // set to match remote file's timestamp

    return LocalMcWorldFile.fromFile(Bun.file(filename))
  }

  update(filebuf: Buffer) {
    const { instance } = multimc.getContext()
    const filenameZip = `${instance.savesPath}/${this.getFileName()}.zip`
    const filenameOld = `${instance.savesPath}/${this.getFileName()}.old.zip`
    const filenameTmp = `${instance.savesPath}/${this.getFileName()}.tmp.zip`

    // 1. Move existing TestWorld.old.zip to TestWorld.tmp.zip
    try {
      if (fs.existsSync(filenameOld)) {
        fs.renameSync(filenameOld, filenameTmp)
      }
    } catch (err) {
      logger.error(err)
      throw `Failed to rename ${instance.savesPath}/${this.name}.old.zip to ${instance.savesPath}/${this.name}.tmp.zip`
    }

    try {
      // 2. ZIP existing folder and save as TestWorld.old.zip
      const oldArchive = new AdmZip()
      oldArchive.addLocalFolder(this.getFilePath())
      oldArchive.writeZip(filenameOld)

      try {
        // 3. Save remote buffer to TestWorld.zip
        const archive = new AdmZip(filebuf)
        archive.writeZip(filenameZip)
        // 4. Remove existing folder
        fs.rmSync(this.getFilePath(), { force: true, recursive: true })
        // 5. Unzip
        const unzippingArchive = new AdmZip(filenameZip)
        unzippingArchive.extractAllTo(this.getFilePath())
        // 6. Remove TestWorld.zip
        fs.rmSync(filenameZip)
        // 7. Remove TestWorld.tmp.zip
        if (fs.existsSync(filenameTmp)) {
          fs.rmSync(filenameTmp)
        }
      } catch (err) {
        if (fs.existsSync(this.getFilePath())) {
          fs.rmSync(this.getFilePath(), { force: true, recursive: true })
        }
        const resetOldArchive = new AdmZip(filenameOld)
        resetOldArchive.extractAllTo(this.getFilePath())
        throw err
      }
    } catch (err) {
      if (fs.existsSync(filenameTmp)) {
        fs.renameSync(filenameTmp, filenameOld)
      }
      logger.error(err)
      throw `Failed to upload local file ${this.getFileName()}`
    }
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

  // TODO Also include JourneyMap data in main instance folder if present
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
    file: drive_v3.Schema$File,
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
      file,
    )
  }

  static async create(
    stream: Readable,
    name: string,
    appProperties: CreateProperties,
  ): Promise<DriveMcWorldFile> {
    try {
      const newFile = await gdrive.uploadFile(stream, name, appProperties)
      const newWorldFile = this.fromFile(newFile)
      console.log(`Created new file ${newWorldFile.getFileName()}`, {
        meta: newWorldFile.getMeta(),
      })
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
    console.log(`Downloaded file ${this.getFileName()}`, {
      meta: this.getMeta(),
    })
    return Buffer.from(_buff)
  }

  async update(stream: Readable): Promise<DriveMcWorldFile> {
    try {
      const updatedFile = await gdrive.updateFile(stream, this.data.id!)
      this.data = updatedFile
      console.log(`Updated file ${this.getFileName()}`, {
        meta: this.getMeta(),
      })
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
      name: this.getFileName(),
      id: this.data.id!,
      modifiedTime: this.data.modifiedTime,
      appProperties: this.data.appProperties,
    }
  }
}

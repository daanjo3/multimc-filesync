import type { drive_v3 } from 'googleapis'
import gdrive, { type CreateProperties } from '../gdrive'
import { Readable } from 'node:stream'
import { McWorldFile } from './McWorldFile'
import type { worldfile as wf } from './types'
import logger from '../logger'

const hasRequiredFields = (
  file: drive_v3.Schema$File,
): file is wf.DriveMcFile =>
  !!file.name &&
  !!file.modifiedTime &&
  !!file.appProperties?.mcInstance &&
  !!file.appProperties?.mcType &&
  // If not master a host needs to be provided
  (file.appProperties.mcType == 'master' || !!file.appProperties.mcHost)

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
    if (!hasRequiredFields(file)) {
      logger.debug({ file: JSON.stringify(file, null, 2) })
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
      logger.debug(`Created new file ${newWorldFile.getFileName()}`, {
        meta: newWorldFile.getMeta(),
      })
      return newWorldFile
    } catch (err) {
      throw `Failed to upload new save file\nerr: ${err}`
    }
  }

  async downloadReadable(): Promise<Readable> {
    return await gdrive.downloadFile(this.data.id!)
  }

  async download(): Promise<Buffer> {
    const stream = await gdrive.downloadFile(this.data.id!)
    const _buff = []
    for await (const chunk of stream) {
      _buff.push(chunk)
    }
    logger.debug(`Downloaded file ${this.getFileName()}`, {
      meta: this.getMeta(),
    })
    return Buffer.from(_buff)
  }

  async update(stream: Readable): Promise<DriveMcWorldFile> {
    try {
      const updatedFile = await gdrive.updateFile(stream, this.data.id!)
      this.data = updatedFile
      this.lastUpdated = new Date(this.data.modifiedTime!)
      logger.debug(`Updated remote file ${this.getFileName()}`, {
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

  getMeta() {
    return {
      name: this.getFileName(),
      id: this.data.id!,
      modifiedTime: this.data.modifiedTime,
      appProperties: this.data.appProperties,
    }
  }
}

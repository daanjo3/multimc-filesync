import type { drive_v3 } from 'googleapis'
import gdrive, { type AppProperties } from '../gdrive'
import { Readable } from 'node:stream'
import { McWorldFile } from './McWorldFile'
import type { worldfile as wf } from './types'
import logger from '../logger'

const hasRequiredFields = (
  file: drive_v3.Schema$File,
): file is wf.DriveMcFile =>
  !!file.name &&
  !!file.appProperties?.mcSaveName &&
  !!file.appProperties?.mcInstance &&
  !!file.appProperties?.mcType &&
  // If not master a host needs to be provided
  (file.appProperties.mcType == 'master' || !!file.appProperties.mcHost) &&
  !!file.appProperties?.mcLastModified &&
  !!file.appProperties?.mcVersion // number

const upgradeDriveFile = (file: drive_v3.Schema$File) => {
  let version
  if (!file.appProperties?.mcVersion) {
    version = 1
  }
  version = Number.parseInt(file.appProperties!.mcVersion)
  if (Number.isNaN(version)) {
    throw `mcVersion of file ${file.name} is NaN`
  }
  if (version < 2) {
    throw `This script can't handle files created before version 2 and does not define data migration logic (yet)`
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
    upgradeDriveFile(file)
    if (!hasRequiredFields(file)) {
      logger.debug({ file: JSON.stringify(file, null, 2) })
      throw 'Drive file does not have all required fields'
    }

    return new DriveMcWorldFile(
      file.appProperties.mcSaveName,
      new Date(file.appProperties.mcLastModified),
      file.appProperties.mcInstance,
      file,
    )
  }

  static async create(
    stream: Readable,
    appProperties: AppProperties,
  ): Promise<DriveMcWorldFile> {
    try {
      const name = DriveMcWorldFile.formatDriveName(appProperties)
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

  async downloadReadable(): Promise<Readable> {
    return await gdrive.downloadFile(this.data.id!)
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

  // Indirectly taken from appProperties
  getFileName() {
    return this.name
  }

  getDriveName() {
    return DriveMcWorldFile.formatDriveName(
      this.data.appProperties as AppProperties,
    )
  }

  static formatDriveName(appProperties: AppProperties) {
    return `${appProperties.mcInstance}-${appProperties.mcSaveName}-${appProperties.mcType == 'master' ? 'master' : `proxy:${appProperties.mcHost}`}-${appProperties.mcLastModified}`
  }

  getMeta() {
    return {
      name: this.getFileName(),
      id: this.data.id!,
      modifiedTime: this.data.appProperties!.mcLastModified,
      appProperties: this.data.appProperties,
    }
  }
}

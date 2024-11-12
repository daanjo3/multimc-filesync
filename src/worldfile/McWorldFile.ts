import logger from '../logger'
import type { worldfile as wf } from './types'

export abstract class McWorldFile<SF extends wf.SourceFile> {
  name: string
  lastUpdated: Date
  instance: string
  type: wf.SourceType
  data: SF

  constructor(
    name: string,
    lastUpdated: Date,
    instance: string,
    type: wf.SourceType,
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

  getSource(): wf.SourceType {
    return this.type
  }

  isSameSave(other: McWorldFile<wf.SourceFile>): boolean {
    const sameName = this.getFileName() == other.getFileName()
    const sameInstance = this.instance == other.instance
    const sameFile = sameName && sameInstance
    logger.silly(`File is equal: ${sameFile}`, {
      this: { name: this.getFileName(), instance: this.instance },
      other: { name: other.getFileName(), instance: other.instance },
    })
    return sameFile
  }

  isNewerThan(other: McWorldFile<wf.SourceFile>) {
    return this.lastUpdated > other.lastUpdated
  }

  isNewerOrEqualThan(other: McWorldFile<wf.SourceFile>) {
    return this.lastUpdated >= other.lastUpdated
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

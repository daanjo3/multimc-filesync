import type { BunFile } from 'bun'
import multimc from '../multimc'
import AdmZip from 'adm-zip'
import path from 'node:path'
import fs from 'node:fs'
import logger from '../logger'
import { Readable } from 'node:stream'
import { McWorldFile } from './McWorldFile'
import { pipeline } from 'node:stream/promises'

const hasRequiredFields = (
  file: BunFile,
): file is BunFile & { name: string; lastModified: Date } =>
  !!file.lastModified && !!file.name

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
    if (!hasRequiredFields(file)) {
      logger.debug({ file: file })
      throw `Local file ${file.name ? path.basename(file.name) : '?'} does not have all required fields`
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

  static async create(
    saveName: string,
    downloadStream: Readable,
    lastModified: Date,
  ) {
    logger.info(`Creating new file ${saveName} locally`)

    const { instance } = multimc.getContext()
    const fp = `${instance.savesPath}/${saveName}`
    const fpZip = `${instance.savesPath}/${saveName}.zip`

    // Download procedure
    try {
      // Store downloaded archive as TestWorld.zip
      const writeStream = fs.createWriteStream(fpZip)
      await pipeline(downloadStream, writeStream)

      // Unpack TestWorld.zip to TestWorld
      const archive = new AdmZip(fpZip)
      archive.extractAllTo(fp)

      // set to match remote file's timestamp
      fs.utimesSync(fp, new Date(), lastModified)

      return LocalMcWorldFile.fromFile(Bun.file(fp))
    } catch (err) {
      logger.error(err)
      throw `Failed to download and unpack file ${saveName}`
    } finally {
      if (fs.existsSync(fpZip)) {
        fs.rmSync(fpZip)
      }
    }
  }

  async update(downloadStream: Readable, lastModified: Date) {
    const { instance } = multimc.getContext()

    const fp = this.getFilePath()
    const fpNew = `${instance.savesPath}/${this.getFileName()}-new`
    const fpZipOld = `${instance.savesPath}/${this.getFileName()}.old.zip`
    const fpZipNew = `${instance.savesPath}/${this.getFileName()}.new.zip`
    const fpZipTmp = `${instance.savesPath}/${this.getFileName()}.tmp.zip`

    // Backup preparation procedure
    // 1. Rename TestWorld.old.zip to TestWorld.tmp.zip
    if (fs.existsSync(fpZipOld)) {
      logger.debug(`Renaming ${fpZipOld} to ${fpZipTmp}`)
      fs.renameSync(fpZipOld, fpZipTmp)
    }
    // 2. Pack TestWorld to TestWorld.old.zip
    logger.debug(`Packing ${fp} into ${fpZipOld}`)
    const oldArchive = new AdmZip()
    oldArchive.addLocalFolder(fp)
    oldArchive.writeZip(fpZipOld)

    // Fallback procedure:
    const restore = (resetMain: boolean) => {
      logger.info(`Restoring filesave ${this.getFileName()}`)

      // Remove downloaded data
      if (fs.existsSync(fpZipNew)) {
        fs.rmSync(fpZipNew)
        logger.info('Removed newly downloaded archive')
      }
      if (fs.existsSync(fpNew)) {
        fs.rmSync(fpNew, { force: true, recursive: true })
        logger.info('Removed newly downloaded file')
      }

      // Reset the main file, assuming it has been altered
      if (resetMain) {
        if (!fs.existsSync(fpZipOld)) {
          throw `Severe issue while restoring ${this.getFileName()} as main file needs to be restored but no old archive exists`
        }
        // Remove main file if altered
        if (fs.existsSync(fp)) {
          fs.rmSync(fp, { force: true, recursive: true })
          logger.info('Removed potentially updated main file')
        }
        // TestWorld.old.zip => unpack to TestWorld
        logger.info(`Unpacking ${fpZipOld} into ${fp}`)
        const archive = new AdmZip(fpZipOld)
        archive.extractAllTo(fp)
      }

      // Remove the previous TestWorld.old.zip
      logger.info(`Removing previous ${fpZipOld}`)
      fs.rmSync(fpZipOld)

      // Rename TestWorld.tmp.zip back to TestWorld.old.zip
      if (fs.existsSync(fpZipTmp)) {
        logger.info(`Renaming ${fpZipTmp} to ${fpZipOld}`)
        fs.rmSync(fpZipOld)
        fs.renameSync(fpZipTmp, fpZipOld)
      }
    }

    // Download procedure
    // 1. Store downloaded archive as TestWorld.new.zip
    try {
      logger.debug(`Writing download stream to ${fpZipNew}`)
      const writeStream = fs.createWriteStream(fpZipNew)
      await pipeline(downloadStream, writeStream)

      // 2. Unpack TestWorld.new.zip to TestWorld-new
      logger.debug(`Unpacking ${fpZipNew} into ~${fpNew}`)
      const archive = new AdmZip(fpZipNew)
      archive.extractAllTo(fpNew)
    } catch (err) {
      logger.error(err)
      restore(false)
      throw `Failed to download and unpack new version of file ${this.getFileName()}`
    }

    try {
      // 3. Remove TestWorld (main)
      logger.debug(`Removing old main file ${fp}`)
      fs.rmSync(fp, { force: true, recursive: true })

      // 4. Rename TestWorld-new to TestWorld
      logger.debug(`Renaming ${fpNew} to ${fp}`)
      fs.renameSync(fpNew, fp)

      // 5. Remove TestWorld.tmp.zip and TestWorld.new.zip
      if (fs.existsSync(fpZipTmp)) {
        logger.debug(`Removing temp archive ${fpZipTmp}`)
        fs.rmSync(fpZipTmp)
      }
      logger.debug(`Removing temp archive ${fpZipNew}`)
      fs.rmSync(fpZipNew)

      // 6. set to match remote file's timestamp
      logger.debug(`Updating lastModified to match remote's: ${lastModified}`)
      fs.utimesSync(fp, lastModified, lastModified)
    } catch (err) {
      logger.error(err)
      restore(true)
      throw `Failed to replace file ${this.getFileName()} with new version`
    }

    logger.info(`Updating file ${this.getFileName()} done.`)
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

  setLastModified(lastModified: Date) {
    fs.utimesSync(this.getFilePath(), lastModified, lastModified)
  }

  // TODO Also include JourneyMap data in main instance folder if present
  zip(): Readable {
    const archive = new AdmZip()
    archive.addLocalFolder(this.getFilePath())
    return Readable.from(archive.toBuffer())
  }
}

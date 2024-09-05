import type { BunFile } from "bun";
import type { drive_v3 } from "googleapis";

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

type DriveMcFile = drive_v3.Schema$File & { appProperties: GDriveAppProperties } & { name: string, modifiedTime: string }
type GDriveData = SourceData<'gdrive', DriveMcFile>
type LocalData = SourceData<'local', BunFile>

const hasRequiredFields = {
    gDrive: (file: drive_v3.Schema$File): file is DriveMcFile => !!file.name && !!file.modifiedTime && !!file.appProperties?.mcInstance && !!file.appProperties?.mcHost && !!file.appProperties?.mcType,
    local: (file: BunFile): file is BunFile & { name: string, lastModified: Date } => !!file.lastModified && !!file.name
}

export abstract class McWorldFile<SD extends SourceData> {
    name: string
    lastUpdated: Date
    instance: string
    sourceData: SD

    constructor(name: string, lastUpdated: Date, instance: string, sourceData: SD) {
        this.name = name
        this.lastUpdated = lastUpdated
        this.instance = instance
        this.sourceData = sourceData
    }

    abstract getFileName(): string

    getType() {
        return this.sourceData.type
    }

    isSameSave(other: McWorldFile<SourceData>) {
        return this.getFileName() == other.getFileName() && this.instance == other.instance
    }

    toString() {
        return JSON.stringify({
            name: this.getFileName(),
            instance: this.instance,
            type: this.getType(),
            lastUpdated: this.lastUpdated.toISOString()
        }, null, 2)
    }

}

export class LocalMcWorldFile extends McWorldFile<LocalData> {

    constructor(name: string, lastUpdated: Date, instance: string, sourceData: LocalData) {
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
        return new LocalMcWorldFile(file.name, new Date(file.lastModified), mcInstance, { type: 'local', filedata: file })
    }

    getFileName() {
        if (this.name.includes('/')) {
            return this.name.split('/').at(-1)!
        }
        return this.name
    }

    async zip(): Promise<Uint8Array> {
        const arrBuffer = await this.sourceData.filedata.arrayBuffer()
        const buffer = Buffer.from(arrBuffer)
        return Bun.gzipSync(buffer)
    }
}

export class DriveMcWorldFile extends McWorldFile<GDriveData> {

    constructor(name: string, lastUpdated: Date, instance: string, sourceData: GDriveData) {
        super(name, lastUpdated, instance, sourceData)
    }

    static fromFile(file: drive_v3.Schema$File) {
        if (!hasRequiredFields.gDrive(file)) {
            console.log({ file: JSON.stringify(file, null, 2)})
            throw 'Drive file does not have all required fields'
        }
        return new DriveMcWorldFile(file.name, new Date(file.modifiedTime), file.appProperties.mcInstance, { type: 'gdrive', filedata: file })
    }

    getFileName() {
        if (this.name.includes('.zip')) {
            return this.name.substring(0, this.name.length - '.zip'.length)
        }
        return this.name
    }

    async download(): Promise<ReadableStream> {
        // TODO open the filestream
    }

}

class McWorldFilePair {
    local?: LocalMcWorldFile
    remote?: DriveMcWorldFile

    constructor(local?: LocalMcWorldFile, remote?: DriveMcWorldFile) {
        this.local = local
        this.remote = remote
    }

    syncDown() {
        // Download file from drive
        // Unzip
    }
}
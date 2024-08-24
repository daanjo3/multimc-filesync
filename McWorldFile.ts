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

export default class McWorldFile {
    name: string
    lastUpdated: Date
    instance: string
    sourceData: SourceData

    constructor(name: string, lastUpdated: Date, instance: string, sourceData: SourceData) {
        this.name = name
        this.lastUpdated = lastUpdated
        this.instance = instance
        this.sourceData = sourceData
    }

    static fromGDriveData(file: drive_v3.Schema$File) {
        if (!hasRequiredFields.gDrive(file)) {
            console.log({ file: JSON.stringify(file, null, 2)})
            throw 'Drive file does not have all required fields'
        }
        return new McWorldFile(file.name, new Date(file.modifiedTime), file.appProperties.mcInstance, { type: 'gdrive', filedata: file })
    }

    static fromLocalData(file: BunFile) {
        if (!hasRequiredFields.local(file)) {
            console.log({ file: file })
            throw 'Local file does not have all required fields'
        }
        const mcInstance = process.env.INST_NAME 
        if (!mcInstance) {
            throw 'Instance name env var not present'
        }
        return new McWorldFile(file.name, new Date(file.lastModified), mcInstance, { type: 'local', filedata: file })
    }

    getFileName() {
        return this.sourceData.type == 'local' ? this.getFileNameLocal() : this.getFileNameDrive()
    }

    private getFileNameLocal() {
        if (this.name.includes('/')) {
            return this.name.split('/').at(-1)
        }
        return this.name
    }

    private getFileNameDrive() {
        if (this.name.includes('.zip')) {
            return this.name.substring(0, this.name.length - '.zip'.length)
        }
        return this.name
    }

    getType() {
        return this.sourceData.type
    }

    isSameSave(other: McWorldFile) {
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

class McWorldFilePair {
    local?: McWorldFile
    remote?: McWorldFile

    constructor(local?: McWorldFile, remote?: McWorldFile) {
        this.local = local
        this.remote = remote
    }
}
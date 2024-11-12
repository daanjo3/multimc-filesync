import type { drive_v3 } from 'googleapis'

export namespace worldfile {
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
}



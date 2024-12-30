import type { drive_v3 } from 'googleapis'
import type { AppProperties } from '../gdrive'

export namespace worldfile {
  type SourceType = 'gdrive' | 'local'
  type SourceFile = BunFile | drive_v3.Schema$File

  type DriveMcFile = drive_v3.Schema$File & {
    appProperties: AppProperties
  } & { name: string; modifiedTime: string }
}

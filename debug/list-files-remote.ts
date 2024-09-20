import gdrive from '../gdrive'
import { DriveMcWorldFile } from '../McWorldFile'

gdrive
  .searchFiles()
  .then((files) =>
    files
      .filter((f) => !!f.appProperties)
      .map((file) => DriveMcWorldFile.fromFile(file)),
  )
  .then((files) => console.log(files))

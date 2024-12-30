import cp from 'child_process'
import os from 'os'

function getComputerName(): string {
  switch (process.platform) {
    case 'win32':
      const winComputerName = process.env.COMPUTERNAME
      if (!winComputerName) {
        throw 'Windows computer name could not be found'
      }
      return winComputerName
    case 'linux':
      const prettyname = cp.execSync('hostnamectl --pretty').toString().trim()
      return prettyname === '' ? os.hostname() : prettyname
    default:
      return os.hostname()
  }
}

export default {
  getName: getComputerName,
}

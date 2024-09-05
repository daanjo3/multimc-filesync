import fs from 'node:fs'
import { LocalMcWorldFile } from './McWorldFile'

function mockMultiMcVars() {
  process.env.INST_NAME = '1.19.2'
  process.env.INST_ID = '1.19.2'
  process.env.INST_DIR = '/home/daanjo3/.local/share/multimc/instances/1.19.2'
}
mockMultiMcVars()

export function listLocalSaves(): LocalMcWorldFile[] {
  const savesPath = `${process.env.INST_DIR}/.minecraft/saves`
  const saveNames = fs.readdirSync(savesPath)
  return saveNames.map((saveName) => LocalMcWorldFile.fromFile(Bun.file(`${savesPath}/${saveName}`)))
}

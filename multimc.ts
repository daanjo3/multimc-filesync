import type { BunFile } from 'bun'
import fs from 'node:fs'
import McWorldFile from './McWorldFile'

function mockMultiMcVars() {
  process.env.INST_NAME = '1.19.2'
  process.env.INST_ID = '1.19.2'
  process.env.INST_DIR = '/home/daanjo3/.local/share/multimc/instances/1.19.2'
}
mockMultiMcVars()

export function listLocalSaves(): McWorldFile[] {
  const savesPath = `${process.env.INST_DIR}/.minecraft/saves`
  const saveNames = fs.readdirSync(savesPath)
  return saveNames.map((saveName) => McWorldFile.fromLocalData(Bun.file(`${savesPath}/${saveName}`)))
}

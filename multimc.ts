import type { BunFile } from "bun"
import fs from 'node:fs'

function mockMultiMcVars() {
  process.env.INST_NAME = '1.19.2'
  process.env.INST_ID = '1.19.2'
  process.env.INST_DIR = '/home/daanjo3/.local/share/multimc/instances/1.19.2'
}
mockMultiMcVars()

export function listLocalSaves(): BunFile[] {
  const savesPath = `${process.env.INST_DIR}/.minecraft/saves`
  const saveNames = fs.readdirSync(savesPath)
  return saveNames.map((saveName) => Bun.file(`${savesPath}/${saveName}`))
}

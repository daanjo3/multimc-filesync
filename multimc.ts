import fs from 'node:fs'
import { LocalMcWorldFile } from './McWorldFile'

function mockMultiMcVars() {
  process.env.INST_NAME = '1.19.2'
  process.env.INST_ID = '1.19.2'
  process.env.INST_DIR = '/home/daanjo3/.local/share/multimc/instances/1.19.2'
}
mockMultiMcVars()

interface MultiMcContext {
  instance: {
    name: string
    id: string
    path: string
  }
}

function getContext(): MultiMcContext {
  // Throw if envs not present
  if (!process.env.INST_NAME || !process.env.INST_ID || !process.env.INST_DIR) {
    throw 'MultiMC environment variables were not present'
  }
  return {
    instance: {
      name: process.env.INST_NAME,
      id: process.env.INST_ID,
      path: process.env.INST_DIR,
    },
  }
}

function listSaves(): LocalMcWorldFile[] {
  const { instance } = getContext()
  const savesPath = `${instance.path}/.minecraft/saves`
  const saveNames = fs.readdirSync(savesPath)
  return saveNames.map((saveName) =>
    LocalMcWorldFile.fromFile(Bun.file(`${savesPath}/${saveName}`)),
  )
}

export default {
  getContext,
  listSaves,
}

import fs from 'node:fs'
import { LocalMcWorldFile } from './McWorldFile'

interface MultiMcContext {
  instance: {
    name: string
    id: string
    instPath: string
    mcPath: string
  }
}

function getContext(): MultiMcContext {
  // Throw if envs not present
  if (
    !process.env.INST_NAME ||
    !process.env.INST_ID ||
    !process.env.INST_DIR ||
    !process.env.INST_MC_DIR
  ) {
    throw 'MultiMC environment variables were not present'
  }
  return {
    instance: {
      name: process.env.INST_NAME,
      id: process.env.INST_ID,
      instPath: process.env.INST_DIR,
      mcPath: process.env.INST_MC_DIR,
    },
  }
}

function listSaves(): LocalMcWorldFile[] {
  const { instance } = getContext()
  const savesPath = `${instance.mcPath}/saves`
  const saveNames = fs.readdirSync(savesPath)
  return saveNames.map((saveName) =>
    LocalMcWorldFile.fromFile(Bun.file(`${savesPath}/${saveName}`)),
  )
}

let cfgMap: Map<string, any> | null = null
function cfg() {
  const load = () => {
    const { instance } = getContext()
    const cfgPath = `${instance.instPath}/instance.cfg`
    const cfgFile = fs.readFileSync(cfgPath, { encoding: 'utf-8' })
    const lines = cfgFile.split('\n')
    return lines.reduce<Map<string, any>>((map, line) => {
      const [key, value] = line.split('=')
      map.set(key, value)
      return map
    }, new Map())
  }
  if (!cfgMap) {
    cfgMap = load()
  }

  return {
    get: (key: string) => cfgMap!.get(key),
    refresh: () => {
      cfgMap = load()
    },
  }
}

export default {
  getContext,
  listSaves,
  cfg,
}

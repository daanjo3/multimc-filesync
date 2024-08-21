import { listLocalSaves } from "./multimc"
import { listRemoteSaves } from "./gdrive"

// WIP

async function syncLocal() {
  // 1. List all local and remote master files
  const localFiles = await listLocalSaves()
  const remoteFiles = await listRemoteSaves()
  console.log(localFiles)
  console.log(remoteFiles)
  // 2. Update all local files where remote is newer
  // 3. Download all remote files which don't exist locally
}

function syncRemote() {
  // 1. List all local and remote proxy files
  // 2. Update remote proxy files where local file is newer
  // 3. Upload any local files for which there is no remote proxy file
  // 4. Update any master file where the proxy file is newer
}

syncLocal()

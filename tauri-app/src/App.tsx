import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";
import { InstanceConfigRoot } from "./types";

function App() {
  const [cfg, setCfg] = useState<InstanceConfigRoot>({ instances: [] });
  const [isCfgLoaded, setCfgLoaded] = useState<boolean>(false);

  async function loadConfiguration() {
    try {
      setCfg(await invoke<InstanceConfigRoot>("get_instance_config"))
      setCfgLoaded(true)
      console.log('Configuration loaded\n', JSON.stringify(cfg))
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    if (!isCfgLoaded) {
      console.log('Loading configuration')
      loadConfiguration()
    }
  }, [isCfgLoaded])

  return (
    <main className="container">
      <h1>MultiMC Filesync</h1>

      <button onClick={loadConfiguration}>Fetch config</button>
      <ul>
        {cfg.instances.map((instance) => (<li>{instance.name}</li>))}
      </ul>
      <button>Register new instance</button>
    </main>
  );
}

export default App;

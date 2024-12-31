import { useEffect, useState } from "react";
import reactLogo from "./assets/react.svg";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

interface InstanceConfigRoot {
  instances: InstanceConfig[]
}

interface InstanceConfig {
  name: string,
  saves: InstanceSaveReference[],
  devices: InstanceDeviceConfig[]
}

interface InstanceDeviceConfig {
  id: string,
  location: string,
  saves: InstanceSaveReference[]
}

interface InstanceSaveReference {
  name: string,
  id: string,
  path?: String // Only populated on device save
}

function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [cfg, setCfg] = useState<InstanceConfigRoot>({ instances: [] });
  const [isCfgLoaded, setCfgLoaded] = useState<boolean>(false);
  const [name, setName] = useState("");

  async function greet() {
    // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
    setGreetMsg(await invoke("greet", { name }));
  }

  async function loadConfiguration() {
    try {
      setCfg(await invoke<InstanceConfigRoot>("get_instance_config"))
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
      <h1>Welcome to Tauri + React</h1>

      <button onClick={loadConfiguration}>Fetch config</button>

      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault();
          greet();
        }}
      >
        <input
          id="greet-input"
          onChange={(e) => setName(e.currentTarget.value)}
          placeholder="Enter a name..."
        />
        <button type="submit">Greet</button>
      </form>
      <p>{greetMsg}</p>
    </main>
  );
}

export default App;

import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { InstanceConfigRoot } from "./types";
import { ActionBar, ActionBarContent, ActionBarRoot, ActionBarSelectionTrigger, ActionBarSeparator, HStack, StackSeparator, Text, VStack } from "@chakra-ui/react";
import { Button } from "./components/ui/button";
import { LuShare, LuTrash2 } from "react-icons/lu";

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
        <VStack className="h-screen w-screen px-4">
          
          <Text className="h-5 px-7 my-4 text-3xl font-bold">MultiMC Filesync</Text>
          
          <VStack className="h-full w-full bg-slate-700">  
            <div>
              <ul>
                {cfg.instances.map((instance) => (<li>{instance.name}</li>))}
              </ul>
            </div>
            <Button>Register new instance</Button>
          </VStack>
          
          <ActionBarRoot open={true}>
            <ActionBarContent className="w-full justify-end">
              <Button variant="outline" size="sm" onClick={loadConfiguration}>
                Fetch config
              </Button>
            </ActionBarContent>
          </ActionBarRoot>
                    
        </VStack>    
    </main>
  );
}

export default App;

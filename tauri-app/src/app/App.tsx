import { useEffect, useMemo, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  type InstanceConfigRoot,
  type MMCFileIndex,
  newInstanceConfigRoot,
} from "@/types";
import { Box, Center, Container, HStack, Text, VStack } from "@chakra-ui/react";
import { Button } from "../components/ui/button";
import { ActionBarContent, ActionBarRoot } from "@/components/ui/action-bar";
import { FileSyncContext, newFileSyncMeta } from "@/context/FileSyncContext";
import InstanceList from "./instancelist/InstanceList";
import { ModalProvider } from "@/context/ModalContext";

const DEBUG = true;

function App() {
  const [cfg, setCfg] = useState<InstanceConfigRoot>(newInstanceConfigRoot());
  const [isCfgLoaded, setCfgLoaded] = useState<boolean>(false);
  const [mmcIndex, setMmcIndex] = useState<MMCFileIndex | null>(null);

  async function loadConfiguration() {
    try {
      console.debug("Loading configuration");
      setCfg(await invoke<InstanceConfigRoot>("get_instance_config"));
      setCfgLoaded(true);
      console.debug("Configuration loaded\n", JSON.stringify(cfg));
    } catch (err) {
      console.error(err);
    }
  }

  async function indexMMC() {
    try {
      console.debug("Loading MMC index");
      setMmcIndex(await invoke<MMCFileIndex>("load_mmc_index"));
      console.debug("Fetched MMC index", JSON.stringify(mmcIndex));
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    if (!isCfgLoaded) {
      loadConfiguration();
    }
  }, [isCfgLoaded]);

  const contextVal = useMemo(() => newFileSyncMeta(cfg), [cfg]);
  console.debug(mmcIndex);

  return (
    <main className="container">
      <FileSyncContext.Provider value={contextVal}>
        <ModalProvider>
          <VStack height="vh" width="vw" paddingX="4" paddingBottom="8">
            <Box paddingX="7" marginY="2">
              <Center>
                <Text fontSize="3xl" fontWeight="bold">
                  MultiMC Filesync
                </Text>
              </Center>
            </Box>

            <Container
              height="full"
              padding="3"
              rounded="md"
              borderWidth="2px"
              border="black.800"
            >
              <Center>
                {mmcIndex == null ? (
                  <Button variant="outline" onClick={indexMMC}>
                    Load MultiMC
                  </Button>
                ) : (
                  <InstanceList instances={mmcIndex.instances} />
                )}
              </Center>
            </Container>

            <ActionBarRoot open={!isCfgLoaded || DEBUG}>
              <ActionBarContent
                flexGrow="1"
                marginX="2"
                justifyContent="space-between"
              >
                <Text>Drive config: {isCfgLoaded ? "set" : "unset"}</Text>
                <HStack width="fit">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadConfiguration}
                  >
                    Clear appdata
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadConfiguration}
                  >
                    Fetch config
                  </Button>
                </HStack>
              </ActionBarContent>
            </ActionBarRoot>
          </VStack>
        </ModalProvider>
      </FileSyncContext.Provider>
    </main>
  );
}

export default App;

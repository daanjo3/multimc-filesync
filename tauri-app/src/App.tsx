import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { InstanceConfig, InstanceConfigRoot, InstanceSaveReference, MMCFileIndex, MMCInstance, MMCSave } from "./types";
import { Box, Center, Container, HStack, Text, VStack } from "@chakra-ui/react";
import { Button } from "./components/ui/button";
import { AccordionItem, AccordionItemContent, AccordionItemTrigger, AccordionRoot } from "./components/ui/accordion";
import { ActionBarContent, ActionBarRoot } from "./components/ui/action-bar";

const newInstanceConfigRoot = (): InstanceConfigRoot => ({ instances: [] })

interface FileSyncMeta {
  cfg: InstanceConfigRoot
}

const newFileSyncMeta = (cfg?: InstanceConfigRoot) => ({
  cfg: cfg ?? newInstanceConfigRoot()
})

const FileSyncContext = createContext<FileSyncMeta>(newFileSyncMeta())

const DEBUG = true

function App() {
  const [cfg, setCfg] = useState<InstanceConfigRoot>(newInstanceConfigRoot());
  const [isCfgLoaded, setCfgLoaded] = useState<boolean>(false);
  const [mmcIndex, setMmcIndex] = useState<MMCFileIndex | null>(null)

  async function loadConfiguration() {
    try {
      console.debug('Loading configuration')
      setCfg(await invoke<InstanceConfigRoot>("get_instance_config"))
      setCfgLoaded(true)
      console.debug('Configuration loaded\n', JSON.stringify(cfg))
    } catch (err) {
      console.error(err)
    }
  }

  async function indexMMC() {
    try {
      console.debug('Loading MMC index')
      setMmcIndex(await invoke<MMCFileIndex>("load_mmc_index"))
      console.debug('Fetched MMC index', JSON.stringify(mmcIndex))
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    if (!isCfgLoaded) {
      loadConfiguration()
    }
  }, [isCfgLoaded])

  const contextVal = useMemo(() => newFileSyncMeta(cfg), [cfg])
  console.debug(mmcIndex)

  return (
    <main className="container">
      <FileSyncContext.Provider value={contextVal}>
        <VStack height="vh" width="vw" paddingX="4" paddingBottom="8">
          <Box paddingX="7" marginY="2">
            <Center>
              <Text fontSize="3xl" fontWeight="bold">MultiMC Filesync</Text>
            </Center>
          </Box>

          <Container height="full" padding="3" rounded="md" borderWidth="2px" border="black.800">
            <Center>
              {mmcIndex == null ? <Button variant="outline" onClick={indexMMC}>Load MultiMC</Button> : <InstanceList instances={mmcIndex.instances} />}
            </Center>
          </Container>

          <ActionBarRoot open={!isCfgLoaded || DEBUG}>
            <ActionBarContent flexGrow="1" marginX="2" justifyContent="space-between" >
              <Text>
                Drive config: {isCfgLoaded ? 'set' : 'unset'}
              </Text>
              <HStack width="fit" >
                <Button variant="outline" size="sm" onClick={loadConfiguration}>
                  Clear appdata
                </Button>
                <Button variant="outline" size="sm" onClick={loadConfiguration}>
                  Fetch config
                </Button>
              </HStack>
            </ActionBarContent>
          </ActionBarRoot>

        </VStack>
      </FileSyncContext.Provider>
    </main>
  );
}

function InstanceList(props: { instances: MMCInstance[] }) {
  const filesyncMeta = useContext(FileSyncContext)
  const findRemoteInstance = (instance: MMCInstance): InstanceConfig | undefined => 
    filesyncMeta.cfg.instances.find(i => i.name == instance.name)
  
  return (
    <Container>
      <Text fontSize="l" fontWeight="semibold" paddingBottom="2">
        Local instances
      </Text>
      <AccordionRoot multiple>
        {props.instances.map((instance, index) => {
          const remoteInstance = findRemoteInstance(instance)
          return (
            <AccordionItem key={index} value={instance.name} rounded="md" paddingX="2" paddingY="2" borderWidth="2px" border="black.800">
              <AccordionItemTrigger fontWeight="bold">{instance.name}</AccordionItemTrigger>
              <AccordionItemContent>
                <VStack gapY="2">
                  <Container>
                    <Text width="full">
                      <p>path: {instance.path}</p>
                      <p>registered on drive: {remoteInstance ? 'yes' : 'no'}</p>
                    </Text>
                  </Container>
                  <SavesList instance={instance} saves={instance.saves}/>
                </VStack>
              </AccordionItemContent>
            </AccordionItem>
          )
        })}
      </AccordionRoot>
    </Container> 
  )
}

function SavesList(props: { instance: MMCInstance, saves: MMCSave[] }) {
  const filesyncMeta = useContext(FileSyncContext)
  const findRemoteSave = (save: MMCSave): InstanceSaveReference | undefined => 
    filesyncMeta.cfg.instances
      .find(i => i.name == props.instance.name)?.saves
      .find(s => s.name == save.name)

  return (
    <Container>
      <AccordionRoot multiple>
        {props.saves.map((save, index) => {
          const remoteSave = findRemoteSave(save)
          return (
            <AccordionItem key={index} value={save.name} rounded="md" paddingX="2" paddingY="2" borderWidth="2px" border="black.800">
              <AccordionItemTrigger fontWeight="bold">{save.name}</AccordionItemTrigger>
              <AccordionItemContent>
                <Text width="full">
                    <p>path: {save.path}</p>
                    <p>registered on drive: {remoteSave ? 'yes' : 'no'}</p>
                </Text>
              </AccordionItemContent>
            </AccordionItem>
          )
        })}
      </AccordionRoot>
    </Container> 
  )
}

export default App;

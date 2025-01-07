import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { InstanceConfigRoot, MMCFileIndex, MMCInstance } from "./types";
import { Box, Center, Container, Flex, Text, VStack } from "@chakra-ui/react";
import { Button } from "./components/ui/button";
import { AccordionItem, AccordionItemContent, AccordionItemTrigger, AccordionRoot } from "./components/ui/accordion";
import { ActionBarContent, ActionBarRoot } from "./components/ui/action-bar";

function App() {
  const [cfg, setCfg] = useState<InstanceConfigRoot>({ instances: [] });
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

  console.log(mmcIndex)

  return (
    <main className="container">
      <VStack height="vh" width="vw" paddingX="4" paddingBottom="8">
        <Box paddingX="7" marginY="2">
          <Center>
            <Text fontSize="3xl" fontWeight="bold">MultiMC Filesync</Text>
          </Center>
        </Box>

        <Container height="full" padding="3" rounded="md" borderWidth="2px" border="black.800">
          <Center>
            {mmcIndex == null ? <Button variant="outline" className="py-auto" onClick={indexMMC}>Load MultiMC</Button> : <InstanceList instances={mmcIndex.instances} />}
          </Center>
        </Container>

        {/* <VStack className="h-full w-full p-3 border-2">
          {mmcIndex == null ? <Button variant="outline" className="py-auto" onClick={indexMMC}>Load MultiMC</Button> : <InstanceList instances={mmcIndex.instances} />}
        </VStack> */}

        <ActionBarRoot open={true}>
          <ActionBarContent className="flex-grow mx-2 justify-end">
            <Button variant="outline" size="sm" onClick={loadConfiguration}>
              Fetch config
            </Button>
          </ActionBarContent>
        </ActionBarRoot>

      </VStack>
    </main>
  );
}

function InstanceList(props: { instances: MMCInstance[] }) {
  return (
    <AccordionRoot multiple defaultValue={["b"]}>
      {props.instances.map((instance, index) => (
        <AccordionItem key={index} value={instance.name} className="border-2 p-2">
          <AccordionItemTrigger className="font-bold text-slate-900">{instance.name}</AccordionItemTrigger>
          <AccordionItemContent>
            <p>
              path: {instance.path}
            </p>
            <p>
              saves: {instance.saves.length}
            </p>
          </AccordionItemContent>
        </AccordionItem>
      ))}
    </AccordionRoot>
  )
}

export default App;

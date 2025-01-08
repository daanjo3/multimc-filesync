import { PropsWithChildren, useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { InstanceConfigRoot, MMCFileIndex, MMCInstance, MMCSave } from "./types";
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
            {mmcIndex == null ? <Button variant="outline" onClick={indexMMC}>Load MultiMC</Button> : <InstanceList instances={mmcIndex.instances} />}
          </Center>
        </Container>

        {/* Is in theory never visible (for now) */}
        {!isCfgLoaded && <ActionBarRoot open={true}>
          <ActionBarContent className="flex-grow mx-2 justify-end">
            <Button variant="outline" size="sm" onClick={loadConfiguration}>
              Fetch config
            </Button>
          </ActionBarContent>
        </ActionBarRoot>}

      </VStack>
    </main>
  );
}

function InstanceList(props: { instances: MMCInstance[] }) {
  return (
    <Container>
      <Text fontSize="l" fontWeight="semibold" paddingBottom="2">
        Local instances
      </Text>
      <AccordionRoot multiple>
        {props.instances.map((instance, index) => (
          <AccordionItem key={index} value={instance.name} rounded="md" paddingX="2" paddingY="2" borderWidth="2px" border="black.800">
            <AccordionItemTrigger fontWeight="bold">{instance.name}</AccordionItemTrigger>
            <AccordionItemContent>
              <VStack gapY="2">
                <Container>
                  <Text width="full">
                    path: {instance.path}
                  </Text>
                </Container>
                <SavesList saves={instance.saves}/>
              </VStack>
            </AccordionItemContent>
          </AccordionItem>
        ))}
      </AccordionRoot>
    </Container> 
  )
}

function SavesList(props: { saves: MMCSave[] }) {
  return (
    <Container>
      <AccordionRoot multiple>
        {props.saves.map((save, index) => (
          <AccordionItem key={index} value={save.name} rounded="md" paddingX="2" paddingY="2" borderWidth="2px" border="black.800">
            <AccordionItemTrigger fontWeight="bold">{save.name}</AccordionItemTrigger>
            <AccordionItemContent>
              <Text width="full">
                  path: {save.path}
              </Text>
            </AccordionItemContent>
          </AccordionItem>
        ))}
      </AccordionRoot>
    </Container> 
  )
}

export default App;

import { useContext } from "react";
import { InstanceConfig, MMCInstance } from "@/types";
import { Container, Text, VStack } from "@chakra-ui/react";
import { Button } from "@/components/ui/button";
import {
  AccordionItem,
  AccordionItemContent,
  AccordionItemTrigger,
  AccordionRoot,
} from "@/components/ui/accordion";
import { FileSyncContext } from "@/FileSyncContext";
import SaveList from "./savelist/SaveList";

function InstanceList(props: { instances: MMCInstance[] }) {
  const filesyncMeta = useContext(FileSyncContext);
  const findRemoteInstance = (
    instance: MMCInstance,
  ): InstanceConfig | undefined =>
    filesyncMeta.cfg.instances.find((i) => i.name == instance.name);

  return (
    <Container>
      <Text fontSize="l" fontWeight="semibold" paddingBottom="2">
        Local instances
      </Text>
      <AccordionRoot multiple>
        {props.instances.map((instance, index) => {
          const remoteInstance = findRemoteInstance(instance);
          return (
            <AccordionItem
              key={index}
              value={instance.name}
              rounded="md"
              paddingX="2"
              paddingY="2"
              borderWidth="2px"
              border="black.800"
            >
              <AccordionItemTrigger fontWeight="bold">
                {instance.name}
              </AccordionItemTrigger>
              <AccordionItemContent>
                <VStack gapY="2">
                  <Container>
                    <Text width="full">
                      <p>path: {instance.path}</p>
                      <p>
                        registered on drive: {remoteInstance ? "yes" : "no"}
                      </p>
                      {!remoteInstance && <Button>Link</Button>}
                    </Text>
                  </Container>
                  <SaveList instance={instance} saves={instance.saves} />
                </VStack>
              </AccordionItemContent>
            </AccordionItem>
          );
        })}
      </AccordionRoot>
    </Container>
  );
}

export default InstanceList;

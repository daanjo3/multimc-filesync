import { useContext, useEffect, useMemo, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  type InstanceConfigRoot,
  type InstanceSaveReference,
  type MMCFileIndex,
  type MMCInstance,
  type MMCSave,
  newInstanceConfigRoot,
} from "@/types";
import { Box, Center, Container, HStack, Text, VStack } from "@chakra-ui/react";
import { Button } from "@/components/ui/button";
import {
  AccordionItem,
  AccordionItemContent,
  AccordionItemTrigger,
  AccordionRoot,
} from "@/components/ui/accordion";
import { ActionBarContent, ActionBarRoot } from "@/components/ui/action-bar";
import { FileSyncContext, newFileSyncMeta } from "@/FileSyncContext";

function SaveList(props: { instance: MMCInstance; saves: MMCSave[] }) {
  const filesyncMeta = useContext(FileSyncContext);
  const findRemoteSave = (save: MMCSave): InstanceSaveReference | undefined =>
    filesyncMeta.cfg.instances
      .find((i) => i.name == props.instance.name)
      ?.saves.find((s) => s.name == save.name);

  return (
    <Container>
      <AccordionRoot multiple>
        {props.saves.map((save, index) => {
          const remoteSave = findRemoteSave(save);
          return (
            <AccordionItem
              key={index}
              value={save.name}
              rounded="md"
              paddingX="2"
              paddingY="2"
              borderWidth="2px"
              border="black.800"
            >
              <AccordionItemTrigger fontWeight="bold">
                {save.name}
              </AccordionItemTrigger>
              <AccordionItemContent>
                <Text width="full">
                  <p>path: {save.path}</p>
                  <p>registered on drive: {remoteSave ? "yes" : "no"}</p>
                  {!remoteSave && <Button>Link</Button>}
                </Text>
              </AccordionItemContent>
            </AccordionItem>
          );
        })}
      </AccordionRoot>
    </Container>
  );
}

export default SaveList;

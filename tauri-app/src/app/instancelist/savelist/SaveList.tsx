import { useContext } from "react";
import {
  type InstanceSaveReference,
  type MMCInstance,
  type MMCSave,
} from "@/types";
import { Container, Text } from "@chakra-ui/react";
import { Button } from "@/components/ui/button";
import {
  AccordionItem,
  AccordionItemContent,
  AccordionItemTrigger,
  AccordionRoot,
} from "@/components/ui/accordion";
import { FileSyncContext } from "@/FileSyncContext";

function SaveList(props: { instance: MMCInstance; saves: MMCSave[] }) {
  const filesyncMeta = useContext(FileSyncContext);
  const findRemoteSave = (save: MMCSave): InstanceSaveReference | undefined =>
    filesyncMeta.cfg.instances
      .find((i) => i.name == props.instance.name)
      ?.saves.find((s) => s.name == save.name);

  return (
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
  );
}

export default SaveList;

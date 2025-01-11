import { useContext, useEffect, useMemo, useState } from "react";
import { InstanceConfig, MMCInstance } from "@/types";
import {
  Box,
  Container,
  createListCollection,
  DialogActionTrigger,
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
  HStack,
  Input,
  ListCollection,
  Text,
  VStack,
} from "@chakra-ui/react";
import { Button } from "@/components/ui/button";
import {
  AccordionItem,
  AccordionItemContent,
  AccordionItemTrigger,
  AccordionRoot,
} from "@/components/ui/accordion";
import { FileSyncContext } from "@/FileSyncContext";
import SaveList from "./savelist/SaveList";
import {
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectRoot,
  SelectTrigger,
  SelectValueText,
} from "@/components/ui/select";
import { Field } from "@/components/ui/field";

function InstanceList(props: { instances: MMCInstance[] }) {
  const filesyncMeta = useContext(FileSyncContext);
  const findRemoteInstance = (
    instance: MMCInstance,
  ): InstanceConfig | undefined =>
    filesyncMeta.cfg.instances.find((i) => i.name == instance.name);
  const instanceCollection = useMemo(
    () => createInstanceCollection(filesyncMeta.cfg.instances),
    [filesyncMeta.cfg],
  );

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
                    </Text>
                  </Container>
                  <Container>
                    <Linker
                      remote={remoteInstance}
                      collection={instanceCollection}
                    />
                  </Container>
                  <Container>
                    <Text marginLeft="1">Saves</Text>
                    <SaveList instance={instance} saves={instance.saves} />
                  </Container>
                </VStack>
              </AccordionItemContent>
            </AccordionItem>
          );
        })}
      </AccordionRoot>
    </Container>
  );
}

const VALUE_NONE = "none";
const VALUE_NEW = "new";
interface InstanceElement {
  label: string;
  value: string;
  payload?: InstanceConfig;
}
type InstanceCollection = ListCollection<InstanceElement>;

function createInstanceCollection(
  instances: InstanceConfig[],
): InstanceCollection {
  const items: InstanceElement[] = [{ label: "None", value: VALUE_NONE }];
  items.push(
    ...instances.map((instance) => ({
      label: instance.name,
      value: instance.name,
      payload: instance,
    })),
  );
  items.push({ label: "New", value: VALUE_NEW });
  return createListCollection({ items });
}

function Linker(props: {
  remote?: InstanceConfig;
  collection: InstanceCollection;
}) {
  const [value, setValue] = useState<string[]>([
    props.remote?.name ?? VALUE_NONE,
  ]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const onModalClose = () => {
    setValue([VALUE_NONE]);
    setDialogOpen(false);
  };
  const onValueChange = (e: { value: string[] }) => {
    if (e.value[0] == VALUE_NEW) {
      setDialogOpen(true);
    }
    setValue(e.value);
  };
  return (
    <Box>
      <SelectRoot
        collection={props.collection}
        value={value}
        onValueChange={onValueChange}
      >
        <SelectLabel>Select remote instance</SelectLabel>
        <SelectTrigger rounded="md" borderWidth="2px" border="black.800">
          <SelectValueText marginLeft="2" />
        </SelectTrigger>
        <SelectContent>
          {props.collection.items.map((elem) => (
            <SelectItem item={elem} key={elem.label}>
              {elem.label}
            </SelectItem>
          ))}
        </SelectContent>
      </SelectRoot>
      <Box>
        <LinkerDialog open={dialogOpen} onClose={onModalClose} />
      </Box>
    </Box>
  );
}

const nameToId = (value: string) => value.toLowerCase().replace(/ +/g, "-");

function LinkerDialog(props: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState("");
  const [id, setId] = useState("");

  const onChange = (value: string) => {
    setName(value);
    setId(nameToId(value));
  };

  return (
    <DialogRoot
      open={props.open}
      placement="center"
      onEscapeKeyDown={props.onClose}
    >
      <DialogContent zIndex="modal">
        <DialogHeader>
          <DialogTitle fontWeight="bold">Register new instance</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <VStack>
            <p>
              Fill in the name of your instance below. Note that this name
              cannot be the same as any other registered instance and it will be
              used to uniquely identify your instance
            </p>
            <Field label="name">
              <Input
                variant="subtle"
                placeholder="Unique name of this instance"
                paddingLeft="1"
                value={name}
                onChange={(e) => onChange(e.currentTarget.value)}
              />
            </Field>
            <Field label="id (generated)">
              <Input
                paddingLeft="1"
                disabled
                value={id}
                variant="subtle"
              ></Input>
            </Field>
          </VStack>
        </DialogBody>
        <DialogFooter>
          <DialogActionTrigger asChild>
            <Button onClick={props.onClose} variant="outline">
              Cancel
            </Button>
          </DialogActionTrigger>
          <Button onClick={props.onClose}>Save</Button>
        </DialogFooter>
        <DialogCloseTrigger />
      </DialogContent>
    </DialogRoot>
  );
}

export default InstanceList;

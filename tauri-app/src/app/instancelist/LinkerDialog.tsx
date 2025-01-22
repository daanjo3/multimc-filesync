import { useContext, useState } from "react";
import {
  DialogActionTrigger,
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { ModalContext, modalContext } from "@/context/ModalContext";
import { Input, VStack } from "@chakra-ui/react";

const nameToId = (value: string) => value.toLowerCase().replace(/ +/g, "-");

export function LinkerDialog(props: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState("");
  const [id, setId] = useState("");

  const onChange = (value: string) => {
    setName(value);
    setId(nameToId(value));
  };

  const { ref } = useContext<ModalContext>(modalContext);

  return (
    <DialogRoot
      open={props.open}
      placement="center"
      onEscapeKeyDown={props.onClose}
    >
      <DialogContent portalRef={ref}>
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

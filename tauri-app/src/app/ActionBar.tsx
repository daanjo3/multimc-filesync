import { FC } from "react";
import { HStack, Text } from "@chakra-ui/react";
import { Button } from "../components/ui/button";
import { ActionBarContent, ActionBarRoot } from "@/components/ui/action-bar";
import { DEBUG } from "@/constants";

interface ActionBarProps {
    isCfgLoaded: boolean
    loadConfiguration: () => void
    clearConfiguration: () => void
}

export const ActionBar: FC<ActionBarProps> = (props) => {
    const { isCfgLoaded, loadConfiguration, clearConfiguration } = props
    return <ActionBarRoot open={!isCfgLoaded || DEBUG}>
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
          onClick={clearConfiguration}
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
}
import { createContext } from "react";
import { type InstanceConfigRoot, newInstanceConfigRoot } from "@/types";

export interface FileSyncMeta {
  cfg: InstanceConfigRoot;
}

export const newFileSyncMeta = (cfg?: InstanceConfigRoot) => ({
  cfg: cfg ?? newInstanceConfigRoot(),
});

export const FileSyncContext = createContext<FileSyncMeta>(newFileSyncMeta());

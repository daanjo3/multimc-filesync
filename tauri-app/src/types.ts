export interface InstanceConfigRoot {
    instances: InstanceConfig[]
}

export interface InstanceConfig {
    name: string,
    saves: InstanceSaveReference[],
    devices: InstanceDeviceConfig[]
}

export interface InstanceDeviceConfig {
    id: string,
    location: string,
    saves: InstanceSaveReference[]
}

export interface InstanceSaveReference {
    name: string,
    id: string,
    path?: String // Only populated on device save
}

export interface MMCFileIndex {
    path: string,
    instances: MMCInstance[]
}

export interface MMCInstance {
    name: string,
    path: string,
    saves: MMCSave[]
}

export interface MMCSave {
    name: string,
    path: string
}
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
pub struct InstanceConfigRoot {
    pub instances: Vec<InstanceConfig>,
}

impl InstanceConfigRoot {
    pub fn new() -> InstanceConfigRoot {
        return InstanceConfigRoot {
            instances: Vec::new(),
        };
    }
}

#[derive(Serialize, Deserialize, Debug)]
pub struct InstanceConfig {
    pub name: String,
    pub saves: Vec<InstanceSaveReference>,
    pub devices: Vec<InstanceDeviceConfig>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct InstanceDeviceConfig {
    pub id: String,
    pub location: String,
    pub saves: Vec<InstanceSaveReference>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct InstanceSaveReference {
    pub name: String,
    pub id: Option<String>,   // Only populated on remote save
    pub path: Option<String>, // Only populated on device save
}

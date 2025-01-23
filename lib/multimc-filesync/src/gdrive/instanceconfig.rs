use drive_v3::Drive;
use serde::{Deserialize, Serialize};

use super::appdata::AppData;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct InstanceConfigRoot {
    pub version: usize,
    pub instances: Vec<InstanceConfig>,
}

impl InstanceConfigRoot {
    pub fn new() -> InstanceConfigRoot {
        return InstanceConfigRoot {
            version: 0,
            instances: Vec::new(),
        };
    }
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct InstanceConfig {
    pub name: String,
    pub saves: Vec<InstanceSaveReference>,
    pub devices: Vec<InstanceDeviceConfig>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct InstanceDeviceConfig {
    pub id: String,
    pub location: String,
    pub saves: Vec<InstanceSaveReference>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct InstanceSaveReference {
    pub name: String,
    pub id: Option<String>,   // Only populated on remote save
    pub path: Option<String>, // Only populated on device save
}

pub struct InstanceConfigManager {
    drive: Drive,
    state: Option<InstanceConfigRoot>
}

impl InstanceConfigManager {
    pub fn new(drive: &Drive) -> Self {
        // TODO avoid cloning but use the ref
        Self {
            drive: drive.clone(),
            state: None
        }
    }
}

impl AppData<InstanceConfigRoot> for InstanceConfigManager {
    fn get_name(&self) -> String {
        "instance-config.json".to_string()
    }

    fn get_drive(&self) -> &Drive {
        &self.drive
    }
    
    fn get_mime_type(&self) -> String {
        "application/json".to_string()
    }
    
    fn get_state(&self) -> &Option<InstanceConfigRoot> {
        &self.state
    }
    
    fn set_state(&mut self, data: &InstanceConfigRoot) {
        self.state = Some(data.clone())
    }
}

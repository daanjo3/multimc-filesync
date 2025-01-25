use drive_v3::Drive;
use serde::{Deserialize, Serialize};

use crate::error::{Error, ErrorKind};

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

    fn add_instance(&mut self, instance: &InstanceConfig) {
        self.instances.push(instance.clone());
    }

    fn find_instance(&self, id: &String) -> Option<InstanceConfig> {
        // TODO find a way to do this stuff without cloning
        self.instances
            .iter()
            .find(|instance| instance.id == *id)
            .cloned()
    }
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct InstanceConfig {
    pub name: String,
    pub id: String,
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
    state: Box<Option<InstanceConfigRoot>>
}

impl InstanceConfigManager {
    pub fn new(drive: &Drive, lazy: bool) -> Result<Self, Error> {
        // TODO avoid cloning but use the ref
        let mut instance = Self {
            drive: drive.clone(),
            state: Box::new(None)
        };
        if lazy {
            return Ok(instance);
        }
        instance.fetch_state().map(|_| instance)
    }

    pub fn register_instance(&mut self, instance: &InstanceConfig) -> Result<(), Error> {
        let mut cfg = self.must_get_state("Failed to register instance as no state is loaded.")?;
        if cfg.find_instance(&instance.id).is_some() {
            return Err(Error::new(ErrorKind::FileSync, format!("An instance already exists with id {0}", &instance.id.to_string())))
        }
        cfg.add_instance(instance);
        self.update(&cfg)
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

    fn must_get_state(&self, msg: &str) -> Result<InstanceConfigRoot, Error> {
        self.state.clone().ok_or(Error::new(ErrorKind::FileSync, msg))
    }
    
    fn get_state(&self) -> Option<InstanceConfigRoot> {
        *self.state.clone()
    }
    
    fn set_state(&mut self, data: &InstanceConfigRoot) {
        let _ = self.state.insert(data.clone());
    }
}

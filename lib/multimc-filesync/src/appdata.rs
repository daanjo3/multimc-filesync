pub mod instanceconfig;

use drive_v3::{objects::File, Drive};
use instanceconfig::InstanceConfigRoot;

use crate::{
    error::{Error, ErrorKind},
    json::{create_json_file, download_json_file, update_json_file},
};

const INSTANCE_CFG_NAME: &str = "instance-config.json";
const MIME_TYPE_JSON: &str = "application/json";

pub struct AppDataManager {
    drive: Drive,
}

impl AppDataManager {
    pub fn new(drive: &Drive) -> Self {
        Self {
            drive: drive.clone(),
        }
    }

    pub fn clear(&self) -> Result<usize, Error> {
        let file_list = self
            .drive
            .files
            .list()
            .spaces("appDataFolder")
            .fields("files(name, id, mimeType)") // Set what fields will be returned
            .execute()?;

        let mut deleted: usize = 0;
        if let Some(files) = file_list.files {
            for file in &files {
                let file_id = file.id.as_ref().unwrap();
                self.drive.files.delete(file_id).execute().unwrap();
                deleted += 1;
            }
        }

        Ok(deleted)
    }

    pub fn get_instance_config(&self) -> Result<InstanceConfigRoot, Error> {
        let metadata_option = self.find_instance_config_meta()?;
        match metadata_option {
            Some(metadata) => download_json_file(&self.drive, metadata),
            None => {
                let metadata = self.initialize_instance_config()?;
                download_json_file(&self.drive, metadata)
            }
        }
    }

    pub fn update_instance_config(&self, cfg: InstanceConfigRoot) -> Result<(), Error> {
        match self.find_instance_config_meta()? {
            Some(cfg_metadata) => update_json_file(&self.drive, cfg, cfg_metadata).map(|_| ()),
            None => Err(Error::new(
                ErrorKind::GDrive,
                "There was no instance config to update",
            )),
        }
    }

    fn find_instance_config_meta(&self) -> Result<Option<File>, Error> {
        let file_list = self
            .drive
            .files
            .list()
            .spaces("appDataFolder")
            .fields("files(name, id, mimeType)") // Set what fields will be returned
            .q(format!("name = '{INSTANCE_CFG_NAME}'"))
            .execute()?;

        match file_list.files {
            Some(files) => match files.len() {
                0 => Ok(None),
                1 => Ok(Some(files[0].clone())),
                _ => Err(Error::new(
                    ErrorKind::FileSync,
                    "More than 1 config present",
                )),
            },
            None => {
                return Err(Error::new(
                    ErrorKind::GDrive,
                    "Files response was none instead of empty list",
                ))
            }
        }
    }

    fn initialize_instance_config(&self) -> Result<File, Error> {
        let new_file = create_json_file(
            &self.drive,
            InstanceConfigRoot::new(),
            File {
                name: Some(INSTANCE_CFG_NAME.to_string()),
                mime_type: Some(MIME_TYPE_JSON.to_string()),
                description: Some("Configuration file for MultiMC instances".to_string()),
                parents: Some(vec!["appDataFolder".to_string()]),
                ..Default::default()
            },
        )?;

        Ok(new_file)
    }
}

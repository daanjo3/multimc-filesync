use drive_v3::{objects::File, Drive};
use serde::{de::DeserializeOwned, Serialize};

use crate::error::{Error, ErrorKind};

use super::{instanceconfig::InstanceConfigRoot, json::{create_json_file, download_json_file, update_json_file}};

pub trait AppData<T: DeserializeOwned + Serialize> {
    fn get_name(&self) -> String;
    fn get_mime_type(&self) -> String;
    fn must_get_state(&self, msg: &str) -> Result<T, Error>;
    fn get_state(&self) -> Option<T>;
    fn set_state(&mut self, data: &T);

    fn get_drive(&self) -> &Drive;

    // Updates the internal state and updates the remote
    fn update(&mut self, data: &T) -> Result<(), Error> {
        self.set_state(data);
        self.commit()
    }

    // Updates the remote with the appdata's internal state
    fn commit(&self) -> Result<(), Error> {
        let data = self.get_state().ok_or(Error::new(ErrorKind::FileSync, "Cannot update if appdata state is empty."))?;
        match self.metadata()? {
            Some(cfg_metadata) => update_json_file(&self.get_drive(), data, cfg_metadata).map(|_| ()),
            None => Err(Error::new(
                ErrorKind::GDrive,
                "There was no instance config to update",
            )),
        }
    }

    fn fetch_state(&mut self) -> Result<T, Error> {
        let data = match self.metadata()? {
            Some(metadata) => download_json_file(self.get_drive(), metadata),
            None => {
                let metadata = self.generate_new()?;
                download_json_file(&self.get_drive(), metadata)
            }
        }?;
        self.set_state(&data);
        Ok(data)
    }

    fn generate_new(&self) -> Result<File, Error> {
        let new_file = create_json_file(
            &self.get_drive(),
            InstanceConfigRoot::new(),
            File {
                name: Some(self.get_name()),
                mime_type: Some(self.get_mime_type()),
                description: Some("Configuration file for MultiMC instances".to_string()),
                parents: Some(vec!["appDataFolder".to_string()]),
                ..Default::default()
            },
        )?;

        Ok(new_file)
    }

    fn metadata(&self) -> Result<Option<File>, Error> {
        let filename = self.get_name();
        let file_list = self
        .get_drive()
        .files
        .list()
        .spaces("appDataFolder")
        .fields("files(name, id, mimeType)") // Set what fields will be returned
        .q(format!("name = '{filename}'"))
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

    fn clear(&self) -> Result<(), Error> {
        match self.metadata()? {
            None => Ok(()),
            Some(metadata) => {
                let file_id = metadata.id.ok_or(Error::new(ErrorKind::GDrive, "file id not present in metadata"))?;
                let _ = self.get_drive().files.delete(file_id).execute()?;
                Ok(())
            }
        }
    }
}
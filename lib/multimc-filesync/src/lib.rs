pub mod error;
pub mod config;

use drive_v3::{Credentials, Drive};
use std::path::Path;
use config::Config;

// The OAuth scopes you need
const SCOPES: [&'static str; 3] = [
    "https://www.googleapis.com/auth/drive.metadata.readonly",
    "https://www.googleapis.com/auth/drive.appdata",
    "https://www.googleapis.com/auth/drive.file",
];

fn get_credentials(cfg: &Config) -> Result<Credentials, error::Error> {

    if Path::new(&cfg.credentials_path).exists() {
        let mut stored_credentials = Credentials::from_file(&cfg.credentials_path, &SCOPES)?;
        if !stored_credentials.are_valid() {
            stored_credentials.refresh()?;
            stored_credentials.store("credentials.json")?;
        }
        return Ok(stored_credentials);
    }

    let stored_credentials = Credentials::from_client_secrets_file(&cfg.client_secrets_path, &SCOPES)?;    
    stored_credentials.store("credentials.json")?;

    Ok(stored_credentials)
}

pub fn get_drive(cfg: &Config) -> Result<drive_v3::Drive, error::Error> {
    let credentials = get_credentials(cfg)?;
    Ok(Drive::new(&credentials))
}

pub fn list_files(drive: &Drive) -> Result<(), error::Error> {
    let file_list = drive.files.list()
        .fields("files(name, id, mimeType)") // Set what fields will be returned
        .q("name = 'Enigma.zip' and not trashed") // search for specific files
        .execute()?;

    if let Some(files) = file_list.files {
        for file in &files {
            println!("{}", file);
        }
    }

    Ok(())
}

// pub fn get_json_file<T>() -> Result<T, Error> {
    
// }

// pub fn update_file() -> Result<File, Error> {

// }
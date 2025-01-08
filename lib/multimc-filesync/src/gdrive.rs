use std::path::Path;

use drive_v3::{Credentials, Drive};

use crate::{config::Config, error::Error};

// The OAuth scopes you need
const SCOPES: [&'static str; 3] = [
    "https://www.googleapis.com/auth/drive.metadata",
    "https://www.googleapis.com/auth/drive.appdata",
    "https://www.googleapis.com/auth/drive.file",
];

fn get_credentials(cfg: &Config) -> Result<Credentials, Error> {

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

pub fn get_drive(cfg: &Config) -> Result<drive_v3::Drive, Error> {
    let credentials = get_credentials(cfg)?;
    Ok(Drive::new(&credentials))
}
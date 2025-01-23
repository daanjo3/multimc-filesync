pub mod instanceconfig;
pub mod appdata;
pub mod json;

use log::debug;
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
    let credentials_path = &cfg.credentials_path;
    let secrets_path = &cfg.client_secrets_path;

    if Path::new(credentials_path).exists() {
        let mut stored_credentials = Credentials::from_file(credentials_path, &SCOPES)?;
        if !stored_credentials.are_valid() {
            debug!("Credentials are not valid, refreshing.");
            stored_credentials.refresh()?;
            debug!("Writing refreshed credentials to {credentials_path}.");
            stored_credentials.store(credentials_path)?;
        } else {
            debug!("Credentials are valid, returning as-is.");
        }
        return Ok(stored_credentials);
    }

    debug!("No existing credentials found, starting authentication session.");
    let stored_credentials = Credentials::from_client_secrets_file(secrets_path, &SCOPES)?;
    debug!("Writing newly obtained credentials to {credentials_path}.");
    stored_credentials.store(credentials_path)?;

    Ok(stored_credentials)
}

pub fn get_drive(cfg: &Config) -> Result<drive_v3::Drive, Error> {
    let credentials = get_credentials(cfg)?;
    Ok(Drive::new(&credentials))
}

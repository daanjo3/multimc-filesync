pub mod error;
pub mod config;

use drive_v3::{objects::{File, UploadType}, Credentials, Drive};
use serde::{Serialize, de};
use std::path::Path;
use config::Config;
use error::{Error, ErrorKind};

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

pub fn list_files(drive: &Drive) -> Result<(), Error> {
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

pub fn download_json_file<T: de::DeserializeOwned>(drive: &Drive, file_metadata: File) -> Result<T, Error> {
    let file_id = file_metadata.id.ok_or(Error::new(ErrorKind::FileSync, "No file ID present"))?;

    let file_bytes = drive.files.get_media(&file_id).execute()?;
    return serde_json::from_slice(&file_bytes).map_err(| err| {
        println!("Failed deserializing json file: {:?}", String::from_utf8_lossy(&file_bytes));
        Error::from(err)
    });
}

// Uses multi-part upload method so can handle up to 5MB size
pub fn update_json_file<T: Sized + Serialize>(drive: &Drive, object: T, file_metadata: File) -> Result<File, Error> {
    let file_data = serde_json::to_string(&object)?;
    let file_id = file_metadata.id.ok_or(Error::new(ErrorKind::GDrive, "No file ID present"))?;
    
    let updated_file = drive.files.update(file_id)
        .upload_type(UploadType::Multipart)
        .content_string(file_data)
        .execute()?;

    println!("Updated file {}", file_metadata.name.unwrap());

    Ok(updated_file)
}

// Uses multi-part upload method so can handle up to 5MB size
pub fn create_json_file<T: Sized + Serialize>(drive: &Drive, object: T, file_metadata: File) -> Result<File, Error> {
    let file_data = serde_json::to_string(&object)?;
    
    let new_file = drive.files.create()
        .upload_type(UploadType::Multipart)
        .metadata(&file_metadata)
        .content_string(file_data)
        .execute()?;

    println!("Uploaded new file {}", file_metadata.name.unwrap());

    Ok(new_file)
}
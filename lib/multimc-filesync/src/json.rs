use drive_v3::{objects::{File, UploadType}, Drive};
use serde::{Serialize, de};

use crate::error::{Error, ErrorKind};

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
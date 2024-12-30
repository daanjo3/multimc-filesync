use lib::{error::Error, error::ErrorKind};
use serde::{Serialize, Deserialize};
use drive_v3::{objects::{File, UploadType}, Drive};

#[derive(Serialize, Deserialize, Debug)]
pub struct InstanceConfigRoot {
    pub instances: Vec<InstanceConfig>
}

impl InstanceConfigRoot {
    pub fn new() -> InstanceConfigRoot {
        return InstanceConfigRoot{ instances: Vec::new() }
    }
}

#[derive(Serialize, Deserialize, Debug)]
pub struct InstanceConfig {
    pub name: String,
    pub saves: Vec<InstanceSaveReference>,
    pub devices: Vec<InstanceDeviceConfig>
}

#[derive(Serialize, Deserialize, Debug)]
pub struct InstanceDeviceConfig {
    pub id: String,
    pub location: String,
    pub saves: Vec<InstanceSaveReference>
}

#[derive(Serialize, Deserialize, Debug)]
pub struct InstanceSaveReference {
    pub name: String,
    pub id: String,
    pub path: Option<String> // Only populated on device save
}

const INSTANCE_CFG_NAME: &str = "instance-config.json";
const MIME_TYPE_JSON: &str = "application/json";

fn create_instance_config(drive: &Drive) -> Result<File, Error> {
    let file_data = serde_json::to_string(&InstanceConfigRoot::new())?;

    let file_metadata = File {
        name: Some( INSTANCE_CFG_NAME.to_string() ),
        mime_type: Some( MIME_TYPE_JSON.to_string() ),
        description: Some( "Configuration file for MultiMC instances".to_string() ),
        parents: Some(vec!["appDataFolder".to_string()]),
        spaces: Some(vec!["appDataFolder".to_string()]),
        ..Default::default()
    };

    // File metadata is not being sent along with the file, see: https://stackoverflow.com/questions/42877817/file-upload-via-rest-v3-appears-as-untitled
    let new_file = drive.files.create()
        .upload_type(UploadType::Media)
        .metadata(&file_metadata)
        .content_string(file_data)
        .execute()?;

    println!("Uploaded new file");

    Ok(new_file)
}

fn get_instance_config_ref(drive: &Drive) -> Result<File, Error> {
    let file_list = drive.files.list()
        .spaces("appDataFolder")
        .fields("files(name, id, mimeType)") // Set what fields will be returned
        .q(format!("name = '{INSTANCE_CFG_NAME}'"))
        .execute()?;

    match file_list.files {
        Some(files) => {
            println!("Found {} file while search for instance config", files.len());
            if files.len() == 0 {
                return create_instance_config(drive);
            }
            if files.len() > 1 {
                return Err(Error::new(ErrorKind::FileSync, "More than 1 file present"))
            }
            Ok(files[0].clone())
        },
        None => {
            // Doesn't appear to be called?
            return create_instance_config(drive);
        },
    }
}

pub fn get_instance_config(drive: &Drive) -> Result<InstanceConfigRoot, Error> {
    let cfg_ref = get_instance_config_ref(&drive)?;
    let file_id = cfg_ref.id.ok_or(Error::new(ErrorKind::FileSync, "No file ID present"))?;
    let file_bytes = drive.files.get_media(&file_id).execute()?;
    return serde_json::from_slice(&file_bytes).map_err(| err| {
        println!("Failed deserializing json file: {:?}", String::from_utf8_lossy(&file_bytes));
        Error::from(err)
    });
}

pub fn clear_appdata(drive: &Drive) -> Result<usize, Error> {
    let file_list = drive.files.list()
        .spaces("appDataFolder")
        .fields("files(name, id, mimeType)") // Set what fields will be returned
        .execute()?;

    let mut deleted: usize = 0;
    if let Some(files) = file_list.files {
        for file in &files {
            let file_id = file.id.as_ref().unwrap();
            drive.files.delete(file_id).execute().unwrap();
            deleted += 1;
        }
    }

    Ok(deleted)
}
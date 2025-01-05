use std::{fs::read_dir, path::PathBuf};

use crate::error::{Error, ErrorKind};

#[derive(Debug)]
pub struct MMCFileIndex {
    pub path: String,
    pub instances: Vec<MMCInstance>
}

#[derive(Debug)]
pub struct MMCInstance {
    pub name: String,
    pub path: String,
    pub saves: Vec<MMCSave>
}

#[derive(Debug)]
pub struct MMCSave {
    pub name: String,
    pub path: String,
}

pub fn index_mmc_files(mmc_path: &PathBuf) -> Result<MMCFileIndex, Error> {
    // Assert MultiMC folder
    let mmc_cfg_path = mmc_path.join("multimc.cfg");
    if !mmc_cfg_path.exists() {
        return Err(Error::new(ErrorKind::MultiMcFs, "Selected folder is no MMC folder."))
    }
    Ok(MMCFileIndex {
        path: mmc_cfg_path.into_os_string().into_string().unwrap(),
        instances: index_instances(&mmc_path)?
    })
}

fn index_instances(mmc_path: &PathBuf) -> Result<Vec<MMCInstance>, Error> {
    // Fetch instance name (directory name)
    let instance_dir_path = mmc_path.join("instances");
    if !instance_dir_path.is_dir() {
        let instance_dir_str = instance_dir_path.display();
        return Err(Error::new(ErrorKind::MultiMcFs, format!("{instance_dir_str} is not a directory.")));
    }
    
    read_dir(instance_dir_path)
        .map_err(|_| Error::new(ErrorKind::MultiMcFs, "Failed to list instances"))?
        // TODO actually handle this exception
        .filter(|entry_result| entry_result.is_ok())
        .map(|entry_result| entry_result.unwrap())
        .filter(|entry| entry.path().is_dir() && !entry.file_name().to_str().unwrap().starts_with("_"))
        .map(|entry| {
            // TODO fix unwrapping
            let name = entry.file_name().into_string().unwrap();
            let path = entry.path();
            let saves = index_instance_saves(&path).unwrap();
            Ok(MMCInstance {
                name,
                path: path.into_os_string().into_string().unwrap(),
                saves
            })
        })
        .collect()
}

fn index_instance_saves(instance_path: &PathBuf) -> Result<Vec<MMCSave>, Error> {
    // Fetch instance name (directory name)
    let save_dir_path = instance_path.join(".minecraft").join("saves");
    if !save_dir_path.is_dir() {
        let instance_dir_str = save_dir_path.display();
        return Err(Error::new(ErrorKind::MultiMcFs, format!("{instance_dir_str} is not a directory.")));
    }
    
    read_dir(save_dir_path)
        .map_err(|_| Error::new(ErrorKind::MultiMcFs, "Failed to list saves"))?
        .filter(|entry_result| entry_result.is_ok())
        .map(|entry_result| entry_result.unwrap())
        .map(|entry| {
            let name = entry.file_name().into_string().unwrap();
            let path = entry.path().into_os_string().into_string().unwrap();
            Ok(MMCSave{
                name,
                path
            })
        })
        .collect()
}

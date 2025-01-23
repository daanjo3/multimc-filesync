use multimc_filesync::{
    config::Config,
    error::{Error, ErrorKind},
    gdrive::{appdata::AppData, get_drive, instanceconfig::{InstanceConfigManager, InstanceConfigRoot}},
    local::{index_mmc_files, MMCFileIndex},
};
use rfd::FileDialog;
use std::env;

#[tauri::command]
fn get_instance_config(state: tauri::State<Config>) -> Result<InstanceConfigRoot, Error> {
    let drive = get_drive(&state)?;
    InstanceConfigManager::new(&drive).load()
}

#[tauri::command]
fn load_mmc_index() -> Result<MMCFileIndex, Error> {
    let mmc_path_opt = FileDialog::new().set_directory("/").pick_folder();

    match mmc_path_opt {
        Some(mmc_path) => index_mmc_files(&mmc_path),
        None => Err(Error::new(ErrorKind::MultiMcFs, "No path was selected")),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(Config {
            client_secrets_path: env!("MMFS_CLIENT_SECRETS_PATH").to_string(),
            credentials_path: env!("MMFS_CREDENTIALS_PATH").to_string(),
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            get_instance_config,
            load_mmc_index
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

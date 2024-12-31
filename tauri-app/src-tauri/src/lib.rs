use multimc_filesync::{appdata::{InstanceConfigRoot, get_instance_config as _get_instance_config}, config::Config, error::Error, get_drive};
use std::env;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn get_instance_config(state: tauri::State<Config>) -> Result<InstanceConfigRoot, Error> {
    let drive = get_drive(&state)?;
    return _get_instance_config(&drive);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(Config{ 
            client_secrets_path: env!("MMFS_CLIENT_SECRETS_PATH").to_string(),
            credentials_path: env!("MMFS_CREDENTIALS_PATH").to_string()
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, get_instance_config])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

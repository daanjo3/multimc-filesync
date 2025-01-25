use drive_v3::Drive;
use multimc_filesync::{
    config::Config,
    gdrive::{appdata::AppData, get_drive, instanceconfig::{InstanceConfig, InstanceConfigManager, InstanceDeviceConfig}},
};

use std::{env, fs::{self, File}, io::Write};

const APPDATA_PATH: &str = "./appdata";

fn _drive() -> Drive {
    let cfg = Config {
        client_secrets_path: "./client_secrets.json".to_string(),
        credentials_path: "./credentials.json".to_string(),
    };
    get_drive(&cfg).unwrap()
}

fn main() {
    let args: Vec<String> = env::args().collect();
    if args.len() < 2 {
        panic!("Missing command")
    }
    let command = &args[1];
    match command.as_str() {
        "download" => download_appdata(),
        "instance" => {
            if args.len() < 3 {
                panic!("Missing instance subcommand")
            }
            let subcommand = &args[2];
            match subcommand.as_str() {
                "add" => {
                    if args.len() < 7 {
                        panic!("Missing instance add arguments")
                    }
                    add_instance(&args[3], &args[4], &args[5], &args[6]);
                }
                _ => panic!("Unexpected instance subcommand '{}'", subcommand)
            }
        }
        "clear" => clear_appdata(),
        _ => panic!("Unexpected command '{}'", command)
    }
}

fn download_appdata() {
    // Create folder
    if fs::exists(APPDATA_PATH).unwrap() {
        fs::remove_dir_all(APPDATA_PATH).unwrap();
    }
    fs::create_dir(APPDATA_PATH).unwrap();
    // Download appdata
    let manager = InstanceConfigManager::new(&_drive(), false).unwrap();
    let cfg = manager.get_state();
    let cfg_json = serde_json::to_string_pretty(&cfg).unwrap();
    let path = format!("{}/{}", APPDATA_PATH, manager.get_name());
    let mut file = File::create(path).expect("Could not create file!");
    file.write(cfg_json.as_bytes())
        .expect("Cannot write to the file!");
}

fn clear_appdata() {
    InstanceConfigManager::new(&_drive(), true).unwrap()
        .clear().expect("Failed to clear appdata in drive.");
}

fn add_instance(name: &str, id: &str, device_id: &str, device_loc: &str) {
    let device_cfg = InstanceDeviceConfig {
        id: device_id.to_string(),
        location: device_loc.to_string(),
        saves: Vec::new()
    };

    let instance_cfg = InstanceConfig {
        name: name.to_string(),
        id: id.to_string(),
        saves: Vec::new(),
        devices: vec![device_cfg]
    };

    InstanceConfigManager::new(&_drive(), false).unwrap()
        .register_instance(&instance_cfg).expect("Failed to register instance.");
}
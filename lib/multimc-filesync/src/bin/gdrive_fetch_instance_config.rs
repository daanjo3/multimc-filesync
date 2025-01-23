use multimc_filesync::{
    config::Config,
    gdrive::{appdata::AppData, get_drive, instanceconfig::InstanceConfigManager},
};

fn main() {
    let cfg = Config {
        client_secrets_path: "./client_secrets.json".to_string(),
        credentials_path: "./credentials.json".to_string(),
    };
    let drive = get_drive(&cfg).unwrap();
    let mut manager = InstanceConfigManager::new(&drive);

    let instance_cfg = manager.load().unwrap();
    println!("{:?}", instance_cfg);
}

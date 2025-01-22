use multimc_filesync::{appdata::AppDataManager, config::Config, gdrive::get_drive};

fn main() {
    let cfg = Config {
        client_secrets_path: "./client_secrets.json".to_string(),
        credentials_path: "./credentials.json".to_string(),
    };
    let drive = get_drive(&cfg).unwrap();
    let manager = AppDataManager::new(&drive);

    let instance_cfg = manager.get_instance_config().unwrap();
    println!("{:?}", instance_cfg);
}

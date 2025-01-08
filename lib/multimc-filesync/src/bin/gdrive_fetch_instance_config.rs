use multimc_filesync::{appdata::get_instance_config, config::Config, gdrive::get_drive};

fn main() {
    let cfg = Config{ 
        client_secrets_path: "./client_secrets.json".to_string(),
        credentials_path: "./credentials.json".to_string()
    };
    let drive = get_drive(&cfg).unwrap();

    let instance_cfg = get_instance_config(&drive).unwrap();
    println!("{:?}", instance_cfg);
}
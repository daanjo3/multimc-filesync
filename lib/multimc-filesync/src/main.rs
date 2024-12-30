mod mc_instance;

use lib::{get_drive, list_files, config::Config};
use mc_instance::{get_instance_config, clear_appdata};

fn main() {
    let cfg = Config{ client_secrets_path: "client_secrets.json".to_string(), credentials_path: "credentials.json".to_string() };
    let drive = get_drive(&cfg).unwrap();
    // list_files().unwrap();

    let instance_config = get_instance_config(&drive).unwrap();
    println!("{:?}", instance_config)
    // let deleted = clear_appdata(&drive).unwrap();
    // println!("deleted {} files", deleted);
}

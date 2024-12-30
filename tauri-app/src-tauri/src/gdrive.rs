use drive_v3::{Credentials, Drive, Error};

pub fn get_credentials() -> Result<Credentials, Error> {
    // This is the file downloaded in the Setup section
    let client_secrets_path = "client_secrets.json";

    // The OAuth scopes you need
    let scopes: [&'static str; 2] = [
        "https://www.googleapis.com/auth/drive.metadata.readonly",
        "https://www.googleapis.com/auth/drive.file",
    ];

    let mut stored_credentials = Credentials::from_client_secrets_file(&client_secrets_path, &scopes)?;

    if !stored_credentials.are_valid() {
        stored_credentials.refresh()?;
        stored_credentials.store("credentials.json")?;
    }

    Ok(stored_credentials)
}

pub fn list_files() -> Result<(), Error> {
    let credentials = get_credentials()?;
    let drive = Drive::new(&credentials);

    let file_list = drive.files.list()
        .fields("files(name, id, mimeType)") // Set what fields will be returned
        .q("name = 'Enigma.zip' and not trashed") // search for specific files
        .execute()?;

    if let Some(files) = file_list.files {
        for file in &files {
            println!("{}", file);
        }
    }

    Ok(())
}
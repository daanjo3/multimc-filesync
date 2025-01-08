pub mod error;
pub mod config;
pub mod appdata;
pub mod json;
pub mod instance;
pub mod gdrive;

// pub fn list_files(drive: &Drive) -> Result<(), Error> {
//     let file_list = drive.files.list()
//         .fields("files(name, id, mimeType)") // Set what fields will be returned
//         .q("name = 'Enigma.zip' and not trashed") // search for specific files
//         .execute()?;

//     if let Some(files) = file_list.files {
//         for file in &files {
//             println!("{}", file);
//         }
//     }

//     Ok(())
// }
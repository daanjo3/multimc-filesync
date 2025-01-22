use multimc_filesync::local::index_mmc_files;
use rfd::FileDialog;

fn main() {
    let mmc_path = FileDialog::new().set_directory("/").pick_folder();

    if mmc_path.is_none() {
        panic!("No path selected")
    }
    let result = index_mmc_files(&mmc_path.unwrap()).unwrap();
    println!("{:?}", result)
}

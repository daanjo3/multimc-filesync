// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

extern crate dotenv;

use dotenv::dotenv;
mod gdrive;

// fn main() {
//     tauri_app_lib::run()
// }

fn main() {
    gdrive::list_files().unwrap();
}
// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    // Without this the GUI may be a blank black screen
    std::env::set_var("WEBKIT_DISABLE_COMPOSITING_MODE", "1");
    tauri_app_lib::run()
}
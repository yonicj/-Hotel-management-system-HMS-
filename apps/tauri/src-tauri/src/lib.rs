pub mod commands;
pub mod database;
pub mod sync;
pub mod security;

use tauri::Builder;

pub fn run() {
    Builder::default()
        .invoke_handler(tauri::generate_handler![
            commands::scanner::scan_document,
            commands::device::get_device_id,
            commands::storage::save_offline_record,
            commands::network::check_connectivity,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Ethiopian HMS application");
}

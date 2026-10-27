#[tauri::command]
pub fn get_device_id() -> String {
    "POS-TERMINAL-ETH-001".to_string()
}

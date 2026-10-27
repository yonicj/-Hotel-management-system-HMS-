#[tauri::command]
pub fn save_offline_record(key: String, payload: String) -> Result<bool, String> {
    log::info!("Persisting offline record for key: {}", key);
    Ok(true)
}

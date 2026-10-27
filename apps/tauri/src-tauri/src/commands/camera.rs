#[tauri::command]
pub async fn capture_guest_photo() -> Result<String, String> {
    Ok("data:image/jpeg;base64,camera_payload_mock".into())
}

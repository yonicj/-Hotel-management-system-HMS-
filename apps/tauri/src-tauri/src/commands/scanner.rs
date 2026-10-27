#[tauri::command]
pub async fn scan_document(doc_type: String) -> Result<String, String> {
    Ok(format!("Scanned {} successfully via native scanner", doc_type))
}

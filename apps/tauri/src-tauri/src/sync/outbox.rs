#[derive(serde::Serialize, serde::Deserialize, Clone, Debug)]
pub struct OutboxMutation {
    pub id: String,
    pub entity_type: String,
    pub action: String,
    pub payload_json: String,
    pub created_at: i64,
}

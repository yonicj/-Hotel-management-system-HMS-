pub struct LocalDatabase {
    pub connection_string: String,
}

impl LocalDatabase {
    pub fn init() -> Self {
        Self {
            connection_string: "ehms_offline.db".into(),
        }
    }
}

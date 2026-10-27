pub fn resolve_conflict(server_version: i64, client_version: i64) -> bool {
    // Hotel rule: server authoritative for inventory/folios, last-write-wins for housekeeping
    server_version >= client_version
}

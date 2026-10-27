# Offline Architecture & Local Outbox Sync

In unstable network environments, front desk and POS terminals run natively with Tauri 2 and an embedded SQLite database.
- **Read Operations**: Handled immediately from locally cached rooms, guests, and menus.
- **Write Operations**: Encoded into idempotent `OutboxMutation` records and committed to SQLite.
- **Sync Processor**: Background worker flushes mutations to the NestJS sync endpoint with conflict resolution.

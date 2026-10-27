# Tauri 2 Desktop & Mobile Shell for Ethiopian HMS

This package packages the shared Next.js frontend (`apps/web`) into native desktop (Windows, macOS, Linux) and mobile (Android, iOS) applications with local hardware integrations and offline operations.

### Native Capabilities Provided:
- **Offline SQLite Engine**: Stores local operational snapshots (rooms, guests, menus) and an Outbox queue.
- **Bi-directional Sync Processor**: Syncs offline transactions (payments, room status changes, check-ins) to the NestJS cloud backend when connection resumes.
- **Hardware Integration**:
  - Passport / Kebele ID camera scanner
  - RFID / NFC Keycard encoders
  - Thermal ESC/POS receipt printers
  - Fiscal cash register device serial ports

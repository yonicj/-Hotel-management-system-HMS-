# System Architecture

The Ethiopian Hotel Management System (EHMS) utilizes an enterprise monorepo with:
- **Shared Next.js Frontend**: Used directly via web browser and embedded into Tauri 2.
- **Tauri 2 Native Shell**: Provides native hardware access (keycards, barcode scanners, thermal printers) and SQLite offline store.
- **NestJS Modular Core**: Enforces hotel business policies, immutable financial records, and multi-tenancy.
- **PostgreSQL & Redis**: Authoritative state, ACID financial operations, and fast caching.

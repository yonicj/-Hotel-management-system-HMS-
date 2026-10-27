# Ethiopian Hotel Management System (EHMS)

Enterprise-grade Hospitality Management System tailored for Ethiopian & International hotel operations.
Architected as an enterprise monorepo with **Next.js frontend**, **Tauri 2 cross-platform desktop/mobile shell**, **NestJS backend**, **PostgreSQL database**, and **local SQLite offline outbox engine**.

---

## 🏛 Architecture Overview

```text
                    HOTEL MANAGEMENT SYSTEM
                              │
              ┌───────────────┴───────────────┐
              │                               │
       SHARED FRONTEND                    BACKEND
       Next.js + React                  NestJS API
              │                               │
     ┌────────┼────────┐              ┌───────┼────────┐
     │        │        │              │       │        │
    Web    Desktop   Mobile       PostgreSQL Redis   Workers
             │        │
             └── Tauri 2 ──┐
                            │
                       Native APIs
                            │
              ┌─────────────┼─────────────┐
              │             │             │
           SQLite        Camera/QR    Notifications
              │
          Offline Outbox
              │
              └──── Sync ─────→ NestJS
```

---

## 📁 Repository Layout

- `apps/web`: Shared Next.js App Router frontend organized by hotel domains
- `apps/api`: NestJS modular backend with transactional hotel core & integrations
- `apps/tauri`: Tauri 2 desktop & mobile shell with native device & SQLite offline cache
- `packages/ui`: Shared reusable design system & UI components
- `packages/types`: Shared TypeScript interfaces across full-stack & mobile
- `packages/validation`: Zod schemas for shared frontend/backend/offline validation
- `packages/api-client`: Fully-typed API SDK
- `packages/localization`: Amharic, English, Afaan Oromoo + Ethiopian Ge'ez Calendar & ETB currency
- `packages/config`: Canonical permissions, room statuses, lifecycle constants
- `database/`: Migrations, seed data, and maintenance scripts
- `infrastructure/`: Dockerfiles, Nginx, monitoring, and automated backup
- `docs/`: Enterprise architecture, API specs, security protocols, workflows, and user guides
- `tests/e2e/`: End-to-end hotel lifecycle suites

---

## 🚀 Quick Start

```bash
# Install dependencies across all apps & packages
pnpm install

# Start infrastructure (PostgreSQL, Redis, MinIO)
pnpm docker:up

# Run database migrations and seed default hotel data
pnpm db:migrate
pnpm db:seed

# Start development servers (Next.js + NestJS concurrently)
pnpm dev
```

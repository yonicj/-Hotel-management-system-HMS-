# Hotel Management System (HMS)

A modern, full-stack Property Management System (PMS) built with Node.js, React, and PostgreSQL.

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL + Prisma ORM |
| Cache | Redis |
| Frontend | React + Vite + TypeScript |
| State | Zustand + TanStack Query |
| Real-time | Socket.IO |
| Auth | JWT (Access + Refresh Tokens) |
| Containerization | Docker + Docker Compose |

## Monorepo Structure

```
HMS/
├── apps/
│   ├── api/          # Backend REST API
│   └── web/          # Frontend React App
├── packages/
│   ├── shared-types/ # Shared TypeScript types/interfaces
│   └── shared-utils/ # Shared utility functions
├── docs/             # Documentation
└── docker-compose.yml
```

## Core Modules

- Reservation & Booking Management
- Front Desk (Check-in / Check-out)
- Room Management
- Housekeeping
- Guest Management
- Billing & Payments
- Night Audit
- Reports & Dashboard
- User & Role Management (RBAC)

## Getting Started

### Prerequisites
- Node.js >= 18
- Docker & Docker Compose

### 1. Clone and install
```bash
git clone <repo-url>
cd HMS
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env with your values
```

### 3. Start infrastructure
```bash
docker-compose up postgres redis -d
```

### 4. Run database migrations
```bash
cd apps/api
npx prisma migrate dev
npx prisma db seed
```

### 5. Start development servers
```bash
# Terminal 1 — API
npm run dev:api

# Terminal 2 — Web
npm run dev:web
```

API runs on: http://localhost:5000  
Web runs on: http://localhost:5173

## User Roles

| Role | Description |
|---|---|
| admin | Full system access |
| manager | Hotel operations + reports |
| receptionist | Reservations, check-in/out, billing |
| housekeeping | Room tasks and status updates |
| accountant | Billing, payments, financial reports |

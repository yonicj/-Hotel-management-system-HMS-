# Getting Started

This guide walks you through setting up the HMS development environment from scratch.

---

## Prerequisites

| Tool | Version | Install |
|---|---|---|
| Node.js | >= 18 | https://nodejs.org |
| npm | >= 9 | Included with Node.js |
| Docker | Latest | https://docker.com |
| Docker Compose | Latest | Included with Docker Desktop |
| Git | Latest | https://git-scm.com |

---

## 1. Clone and Install

```bash
git clone <your-repo-url>
cd HMS
npm install
```

This installs dependencies for all workspaces (api, web, shared-types, shared-utils).

---

## 2. Environment Setup

```bash
cp .env.example .env
```

Open `.env` and set:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/hms_db
REDIS_URL=redis://localhost:6379
JWT_ACCESS_SECRET=your-strong-secret-here
JWT_REFRESH_SECRET=another-strong-secret-here
CLIENT_URL=http://localhost:5173
```

---

## 3. Start Infrastructure

Start PostgreSQL and Redis using Docker:

```bash
docker-compose up postgres redis -d
```

Verify both are running:

```bash
docker-compose ps
```

---

## 4. Database Setup

Navigate to the API app and run migrations:

```bash
cd apps/api
npx prisma migrate dev --name init
```

Seed the database with initial data (hotel, roles, admin user, room types):

```bash
npx prisma db seed
```

**Default admin credentials:**
- Email: `admin@grandhotel.com`
- Password: `Admin@1234`

---

## 5. Start Development Servers

Open two terminals:

**Terminal 1 — Backend API**
```bash
npm run dev:api
```
API available at: http://localhost:5000  
Health check: http://localhost:5000/health

**Terminal 2 — Frontend**
```bash
npm run dev:web
```
Web app available at: http://localhost:5173

---

## 6. Optional: Prisma Studio

Browse the database visually:

```bash
cd apps/api
npx prisma studio
```

Opens at: http://localhost:5555

---

## 7. Docker (Full Stack)

To run everything in Docker:

```bash
docker-compose up --build
```

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:5000 |
| PostgreSQL | localhost:5432 |
| Redis | localhost:6379 |

---

## Project Scripts

From the monorepo root:

| Command | Description |
|---|---|
| `npm run dev:api` | Start API in development mode |
| `npm run dev:web` | Start web app in development mode |
| `npm run build:api` | Build API for production |
| `npm run build:web` | Build web app for production |
| `npm run lint` | Lint all workspaces |
| `npm run type-check` | TypeScript check all workspaces |

---

## Folder Quick Reference

```
HMS/
├── apps/api/src/
│   ├── modules/          Feature modules (auth, rooms, reservations, etc.)
│   ├── config/           Database, Redis, Socket.IO, environment config
│   ├── shared/           Shared middleware, utilities, event emitters
│   └── prisma/           Prisma schema and seed script
│
├── apps/web/src/
│   ├── pages/            All page components (organized by feature)
│   ├── components/       Reusable UI and layout components
│   ├── hooks/            Custom React hooks (data fetching + mutations)
│   ├── services/         API service functions (Axios calls)
│   ├── stores/           Zustand global state stores
│   ├── router/           React Router config + auth guards
│   └── lib/              Query client, constants
│
├── packages/
│   ├── shared-types/     TypeScript interfaces, enums (used by both api and web)
│   └── shared-utils/     Utility functions (dates, currency, pagination, etc.)
│
└── docs/
    ├── getting-started.md  ← You are here
    ├── api-spec.md         REST API documentation
    ├── db-schema.md        Database table reference
    └── architecture.md     System design overview
```

---

## Troubleshooting

**Database connection refused**
- Check that the postgres Docker container is running: `docker-compose ps`
- Verify `DATABASE_URL` in `.env` matches Docker Compose settings

**Prisma client not found**
```bash
cd apps/api && npx prisma generate
```

**Port already in use**
- API default: 5000 — change `PORT` in `.env`
- Web default: 5173 — change in `vite.config.ts`

**Redis connection error**
- Ensure Redis container is running: `docker-compose up redis -d`
- Verify `REDIS_URL` in `.env`

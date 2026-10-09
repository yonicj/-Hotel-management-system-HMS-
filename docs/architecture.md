# HMS — System Architecture

## Overview

The Hotel Management System is a full-stack monorepo application built for property management operations. It follows a clean layered architecture with real-time capabilities and role-based access control.

---

## Monorepo Structure

```
HMS/
├── apps/
│   ├── api/          → Node.js + Express + TypeScript backend
│   └── web/          → React + Vite + TypeScript frontend
├── packages/
│   ├── shared-types/ → Shared TypeScript interfaces, enums, and types
│   └── shared-utils/ → Shared utility functions (dates, currency, generators)
├── docs/             → Architecture, API spec, DB schema
├── docker-compose.yml
├── .env.example
└── package.json      → npm workspaces root
```

---

## Backend Architecture

### Layer Responsibilities

```
HTTP Request
    ↓
Rate Limiter / CORS / Helmet
    ↓
authenticate (JWT verification)
    ↓
authorize (RBAC permission check via Redis cache)
    ↓
validate (Zod schema validation)
    ↓
Controller (request/response handling)
    ↓
Service (business logic)
    ↓
Repository / Prisma (database queries)
    ↓
PostgreSQL
```

### Module Structure

Each feature module is self-contained:

```
modules/<feature>/
├── <feature>.schema.ts     Zod validation schemas + TypeScript types
├── <feature>.service.ts    Business logic
├── <feature>.controller.ts Request/response handling
└── <feature>.routes.ts     Express router with middleware chain
```

### Real-time Flow

```
Service mutation (check-in, status change, etc.)
    ↓
Event emitter (shared/events/)
    ↓
Socket.IO broadcast to hotel room (hotel:<hotelId>)
    ↓
All connected clients receive update
```

### Auth Strategy

- Login → JWT access token (15m) + refresh token (7d in Redis + httpOnly cookie)
- Every request → Bearer token verified in `authenticate` middleware
- RBAC → `authorize(resource, action)` checks `role_permissions` (cached in Redis 10min)
- Refresh → `/auth/refresh` endpoint exchanges cookie for new access token

---

## Frontend Architecture

### Data Flow

```
User Action
    ↓
React Component
    ↓
Custom Hook (useReservations, useRooms, etc.)
    ↓
TanStack Query mutation/query
    ↓
Service function (services/api.ts)
    ↓
Axios instance (with Bearer token interceptor)
    ↓
Backend API
```

### State Management

| Concern | Tool |
|---|---|
| Server data (API responses, caching) | TanStack Query |
| Auth session (user, token) | Zustand + localStorage persist |
| Real-time room statuses | Zustand (updated by Socket.IO) |
| Form state + validation | React Hook Form + Zod |
| Toast notifications | Zustand (auto-dismiss) |

### Real-time Update Flow

```
Socket.IO event received (useSocket hook)
    ↓
room.store.ts updated (Zustand)
    ↓
queryClient.invalidateQueries() called
    ↓
Components re-render with fresh data
```

### Route Protection

```
Browser route request
    ↓
AuthGuard → checks isAuthenticated (Zustand)
    ↓ (if unauthenticated) → /login
    ↓ (if authenticated)
AppShell (Sidebar + Topbar + Outlet)
    ↓
Page component renders
```

---

## Database Design Principles

- **UUID primary keys** — avoids sequential ID enumeration attacks
- **ENUM types in PostgreSQL** — enforced at DB level, not just app level
- **JSONB for flexible fields** — amenities, audit change logs
- **Soft deletes for users** — `is_active = false` instead of DELETE
- **Composite unique constraints** — e.g. `(hotel_id, audit_date)` for night audits
- **Indexed foreign keys** — all FK columns used in WHERE clauses are indexed

---

## Security Measures

| Layer | Measure |
|---|---|
| API | Helmet.js HTTP security headers |
| API | CORS restricted to CLIENT_URL |
| API | Rate limiting (200 req/15min global, 20 req/15min for /auth) |
| Auth | bcrypt (cost factor 12) for password hashing |
| Auth | JWT with short-lived access tokens (15min) |
| Auth | Refresh tokens stored server-side in Redis |
| Auth | httpOnly cookies for refresh tokens |
| DB | Parameterized queries via Prisma (no SQL injection) |
| Input | Zod schema validation on all POST/PUT endpoints |
| RBAC | Permission checks cached in Redis to reduce DB load |

---

## Scalability Considerations

- **Stateless API** — no in-memory session state; horizontally scalable
- **Redis caching** — permission cache, refresh token store; can be clustered
- **Socket.IO rooms** — namespaced by `hotel:<hotelId>` for multi-property isolation
- **Multi-property ready** — every table has `hotel_id`; single API instance serves multiple hotels
- **Prisma connection pooling** — managed automatically; PgBouncer can be added for high load

---

## Future Integration Points

| Integration | How It Fits |
|---|---|
| Payment Gateway (Stripe) | New `stripe.service.ts` in billing module + webhook endpoint |
| OTA / Channel Manager | `reservations` source `OTA_BOOKING` + dedicated channel-manager module |
| Email notifications | Event hook on reservation status change → email service |
| SMS notifications | Same event hooks → SMS service (Twilio/Africa's Talking) |
| Online Booking Engine | Public `/api/booking/*` routes using existing availability + rate endpoints |
| Multi-currency | `currency` field on hotels + conversion layer in billing service |

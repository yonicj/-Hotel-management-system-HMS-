# Architectural Decision Record (ADR): Core System Standards

> **Status:** LOCKED / ACCEPTED  
> **Effective Date:** November 2026  
> **Scope:** All apps (`apps/*`), packages (`packages/*`), database migrations, and documentation across the Ethiopian Hotel Management System (EHMS) repository.

---

## 1. Architectural Decisions Summary Table

| Category | Canonical Decision | Rationale & Guidance | Impact / Action Items |
|---|---|---|---|
| **Backend Framework** | **Express Only** | NestJS and `src/legacy/` are dead code. Eliminates dual-stack conflicts, resolves broken TypeScript compilation, and standardizes on the running Express application. | • Remove `src/main.ts`, `src/app.module.ts`, and all 41 `@Module` files.<br>• Remove `apps/api/src/legacy/`<br>• Keep only Express routes, controllers, and services in `apps/api/src/modules/`. |
| **Monorepo Scope** | **`@ehms/*` Single Namespace** | Eliminates split package names (`@hms/*` vs `@ehms/*`). Unifies package management and Turbo pipeline filters. | • Rename `@hms/api` back to `@ehms/api`.<br>• Merge `@hms/shared-types` into `@ehms/types`.<br>• Merge `@hms/shared-utils` into `@ehms/utils` (or `@ehms/shared-utils`).<br>• Fix root `package.json` script filters. |
| **Desktop / Offline** | **Parked (Web-Only for Pilot)** | Tauri 2 and SQLite offline synchronization are excluded from active workspace builds until after the initial production pilot. | • Remove `apps/tauri` from active `pnpm-workspace.yaml` / `turbo.json` build targets.<br>• Focus all UI delivery on the shared Next.js web application. |
| **Room Statuses** | **SRS Enum (7 States, Drop `CLEAN`)**<br>`AVAILABLE`, `RESERVED`, `OCCUPIED`, `CLEANING`, `DIRTY`, `MAINTENANCE`, `OUT_OF_SERVICE` | Aligns directly with Ethiopian hospitality operational standards (SRS). Eliminates redundant intermediate states. | • Update `schema.prisma` `enum RoomStatus`.<br>• Drop `CLEAN` from database and types.<br>• Update room state machines in services. |
| **Housekeeping Workflow** | **Direct to `AVAILABLE` (No Inspection)** | In MVP, completion of room cleaning transitions the room directly to `AVAILABLE` without requiring a supervisor inspection step. | • Update `housekeeping.service.ts` to set room status directly to `AVAILABLE` upon task completion.<br>• Remove or bypass `INSPECTION` task verification gates. |
| **Reservation Statuses** | **`COMPLETED` Replaces `CHECKED_OUT`**<br>`PENDING`, `CONFIRMED`, `CHECKED_IN`, `COMPLETED`, `CANCELLED`, `NO_SHOW` | Clarifies the lifecycle termination of a guest reservation cycle in alignment with enterprise PMS standards. | • Update `schema.prisma` `enum ReservationStatus`.<br>• Replace all code references to `CHECKED_OUT` with `COMPLETED`. |
| **Stays Model** | **No Separate `Stay` Table** | A stay is represented directly by a `Reservation` with populated `actualCheckIn` and `actualCheckOut` timestamps. | • Do not create a `Stay` model or table.<br>• Track in-house occupancy via `actualCheckIn IS NOT NULL AND actualCheckOut IS NULL`. |
| **Roles & RBAC** | **6 Canonical SRS Roles**<br>1. Super Admin<br>2. Hotel Manager<br>3. Receptionist<br>4. Housekeeper<br>5. Accountant<br>6. General Staff | Matches standard hotel organizational hierarchy and operational security boundaries. | • Update `Role` seed data and permission matrix.<br>• Standardize role identifiers in authorization middleware and JWT payloads. |
| **Currency & Arithmetic** | **Decimal Arithmetic (ETB Default)** | Financial records must prevent IEEE-754 floating-point errors. Default base currency is Ethiopian Birr (ETB). | • Store all monetary amounts as `@db.Decimal(10, 2)` or `@db.Decimal(12, 2)`.<br>• Use precision decimal arithmetic in services.<br>• Standardize currency formatting to ETB. |
| **Time & Timezones** | **TIMESTAMPTZ & `Africa/Addis_Ababa`** | Audit runs, financial closeout, and reporting must operate on local Ethiopian time, not UTC. | • Use PostgreSQL `TIMESTAMPTZ` for all timestamp columns.<br>• Force night audit and daily business closeout to evaluate in timezone `Africa/Addis_Ababa`. |

---

## 2. Detailed Decision Specifications

### 2.1. Backend Framework
- **Rule:** Express is the sole backend framework for `@ehms/api`.
- **Enforcement:**
  - `apps/api/src/app.ts` is the application entry point.
  - Delete `apps/api/src/main.ts`, `apps/api/src/app.module.ts`, and all NestJS decorators/modules.
  - Delete `apps/api/src/legacy/` completely; all operational routes live under `apps/api/src/modules/`.
  - `apps/api/package.json` must contain no `@nestjs/*` packages.

### 2.2. Monorepo Scoping & Workspace
- **Rule:** All packages and apps in this repository must use the `@ehms/` prefix.
- **Package Layout:**
  - `apps/api` → `@ehms/api`
  - `apps/web` → `@ehms/web`
  - `packages/types` → `@ehms/types` (absorbs `packages/shared-types`)
  - `packages/utils` → `@ehms/utils` (absorbs `packages/shared-utils`)
  - `packages/config` → `@ehms/config`
  - `packages/validation` → `@ehms/validation`
  - `packages/ui` → `@ehms/ui`
  - `packages/localization` → `@ehms/localization`
  - `packages/api-client` → `@ehms/api-client`

### 2.3. Desktop / Offline (Tauri)
- **Rule:** The system is Web-First for the pilot.
- **Enforcement:**
  - `apps/tauri` is excluded from the default `pnpm build`, `pnpm type-check`, and `pnpm lint` scripts in `turbo.json`.
  - Development and testing target Chrome / modern browsers via `@ehms/web`.
  - Tauri desktop and SQLite outbox engine are parked until Phase 2 (post-pilot).

### 2.4. Canonical Room Status Lifecycle
- **Canonical Enum:**
  ```prisma
  enum RoomStatus {
    AVAILABLE
    RESERVED
    OCCUPIED
    CLEANING
    DIRTY
    MAINTENANCE
    OUT_OF_SERVICE
  }
  ```
- **State Transitions:**
  - `AVAILABLE` → `RESERVED` (upon room allocation to upcoming reservation)
  - `AVAILABLE` / `RESERVED` → `OCCUPIED` (upon check-in)
  - `OCCUPIED` → `DIRTY` (upon check-out)
  - `DIRTY` → `CLEANING` (housekeeper begins cleaning task)
  - `CLEANING` → `AVAILABLE` (housekeeper finishes cleaning task — no inspection required)
  - Any state → `MAINTENANCE` / `OUT_OF_SERVICE` (work order logged)
  - `MAINTENANCE` / `OUT_OF_SERVICE` → `DIRTY` or `AVAILABLE` (repair completed)

### 2.5. Housekeeping Flow (MVP)
- When a room cleaning task status changes to `COMPLETED`, the room's status must update directly to `AVAILABLE`.
- No intermediate `INSPECTION` or `CLEAN` state is required for MVP operations.

### 2.6. Reservation Status Lifecycle
- **Canonical Enum:**
  ```prisma
  enum ReservationStatus {
    PENDING
    CONFIRMED
    CHECKED_IN
    COMPLETED
    CANCELLED
    NO_SHOW
  }
  ```
- Replaces legacy `CHECKED_OUT` with `COMPLETED`.
- A check-out operation transitions the reservation to `COMPLETED` and sets `actualCheckOut = now()`.

### 2.7. Stays Entity Rule
- There is **no separate `Stay` table**.
- A stay is represented by the `Reservation` record:
  - Check-in: `actualCheckIn` timestamp populated, status becomes `CHECKED_IN`.
  - Check-out: `actualCheckOut` timestamp populated, status becomes `COMPLETED`.
  - Active stay query: `status = 'CHECKED_IN' AND actualCheckIn IS NOT NULL AND actualCheckOut IS NULL`.

### 2.8. User Roles & RBAC (SRS 6 Roles)
1. **Super Admin**: Complete system access, tenant management, user lifecycle, and role assignment.
2. **Hotel Manager**: Operations oversight, manager overrides, financial approvals, voiding/cancellations, report generation.
3. **Receptionist**: Front desk operations, reservation lifecycle, guest profiles, check-in, check-out, and folio charge/payment posting.
4. **Housekeeper**: Housekeeping room rack, task status updates (`CLEANING` → `AVAILABLE`), maintenance requests.
5. **Accountant**: Full billing and folio access, payment reconciliation, night audit review, tax/fiscal reporting.
6. **General Staff**: Restricted operations (e.g. POS cashiering, room service order posting).

### 2.9. Currency, Precision, and Temporal Standards
- **Currency:** Ethiopian Birr (ETB) is the base currency.
- **Arithmetic:**
  - Database schema must store monetary values using `@db.Decimal(10, 2)` (or `12, 2` for cumulative audit totals).
  - Calculations must maintain fixed 2-decimal precision without IEEE-754 floating point drift.
- **Timestamps:**
  - All temporal database fields must use PostgreSQL `TIMESTAMPTZ` (`timestamp with time zone`).
- **Night Audit Timezone:**
  - The night audit routine, daily rollover, and business-date transitions must evaluate in the `Africa/Addis_Ababa` timezone (EAT, UTC+3).


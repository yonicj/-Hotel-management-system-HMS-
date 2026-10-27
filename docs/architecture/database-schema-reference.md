# HMS — Database Schema Reference

> PostgreSQL · Prisma ORM · UUID primary keys · TIMESTAMPTZ for all datetime fields

---

## Table of Contents

1. [hotels](#hotels)
2. [room_types](#room_types)
3. [rooms](#rooms)
4. [rate_plans](#rate_plans)
5. [guests](#guests)
6. [reservations](#reservations)
7. [reservation_guests](#reservation_guests)
8. [folios](#folios)
9. [folio_charges](#folio_charges)
10. [payments](#payments)
11. [housekeeping_tasks](#housekeeping_tasks)
12. [users](#users)
13. [roles](#roles)
14. [permissions](#permissions)
15. [role_permissions](#role_permissions)
16. [audit_logs](#audit_logs)
17. [night_audit_logs](#night_audit_logs)
18. [Relationships Diagram](#relationships-diagram)
19. [Enums Reference](#enums-reference)
20. [Index Strategy](#index-strategy)

---

## hotels

Supports multi-property expansion. Every resource (rooms, users, reservations) belongs to a hotel via `hotel_id`.

| Column      | Type         | Constraints       | Notes                          |
|-------------|--------------|-------------------|--------------------------------|
| id          | UUID         | PK, default uuid  |                                |
| name        | VARCHAR(150) | NOT NULL          |                                |
| address     | TEXT         | NOT NULL          |                                |
| city        | VARCHAR(100) | NOT NULL          |                                |
| country     | VARCHAR(100) | NOT NULL          |                                |
| phone       | VARCHAR(30)  | NOT NULL          |                                |
| email       | VARCHAR(150) | NOT NULL          |                                |
| timezone    | VARCHAR(60)  | default 'UTC'     | e.g. `Africa/Nairobi`          |
| created_at  | TIMESTAMPTZ  | default now()     |                                |

---

## room_types

Defines categories of rooms (Single, Double, Suite, etc.).

| Column        | Type          | Constraints      | Notes                          |
|---------------|---------------|------------------|--------------------------------|
| id            | UUID          | PK               |                                |
| hotel_id      | UUID          | FK → hotels      |                                |
| name          | VARCHAR(100)  | NOT NULL         |                                |
| description   | TEXT          | default ''       |                                |
| base_rate     | DECIMAL(10,2) | NOT NULL         | Default nightly rate           |
| max_occupancy | INT           | NOT NULL         |                                |
| amenities     | JSONB         | default '[]'     | Array of strings               |
| created_at    | TIMESTAMPTZ   | default now()    |                                |

**Indexes:** `hotel_id`

---

## rooms

Individual physical rooms in the hotel.

| Column       | Type         | Constraints           | Notes                          |
|--------------|--------------|-----------------------|--------------------------------|
| id           | UUID         | PK                    |                                |
| hotel_id     | UUID         | FK → hotels           |                                |
| room_type_id | UUID         | FK → room_types       |                                |
| room_number  | VARCHAR(20)  | NOT NULL              | e.g. `101`, `2A`               |
| floor        | INT          | NOT NULL              |                                |
| status       | ENUM         | NOT NULL, default AVAILABLE | See RoomStatus enum     |
| is_smoking   | BOOLEAN      | default false         |                                |
| notes        | TEXT         | nullable              |                                |
| created_at   | TIMESTAMPTZ  | default now()         |                                |

**Indexes:** `hotel_id`, `status`, `room_type_id`

---

## rate_plans

Dynamic pricing rules per room type and date range.

| Column        | Type          | Constraints      | Notes                              |
|---------------|---------------|------------------|------------------------------------|
| id            | UUID          | PK               |                                    |
| hotel_id      | UUID          | FK → hotels      |                                    |
| room_type_id  | UUID          | FK → room_types  |                                    |
| name          | VARCHAR(100)  | NOT NULL         | e.g. `Weekend Rate`, `Early Bird`  |
| rate          | DECIMAL(10,2) | NOT NULL         |                                    |
| start_date    | DATE          | NOT NULL         |                                    |
| end_date      | DATE          | NOT NULL         |                                    |
| min_stay      | INT           | default 1        |                                    |
| is_active     | BOOLEAN       | default true     |                                    |

**Indexes:** `room_type_id`, composite `(start_date, end_date)`

---

## guests

Master guest registry. Shared across hotels in a multi-property setup.

| Column       | Type         | Constraints     | Notes                           |
|--------------|--------------|-----------------|---------------------------------|
| id           | UUID         | PK              |                                 |
| first_name   | VARCHAR(100) | NOT NULL        |                                 |
| last_name    | VARCHAR(100) | NOT NULL        |                                 |
| email        | VARCHAR(150) | UNIQUE          |                                 |
| phone        | VARCHAR(30)  | NOT NULL        |                                 |
| nationality  | VARCHAR(100) | nullable        |                                 |
| id_type      | ENUM         | nullable        | passport / national_id / driving_license |
| id_number    | VARCHAR(60)  | nullable        |                                 |
| date_of_birth| DATE         | nullable        |                                 |
| address      | TEXT         | nullable        |                                 |
| vip_level    | ENUM         | default STANDARD| standard / silver / gold / platinum |
| notes        | TEXT         | nullable        |                                 |
| created_at   | TIMESTAMPTZ  | default now()   |                                 |

**Indexes:** `email` (unique), `phone`, `id_number`

---

## reservations

Core booking record. Links guest, room type, room, rate plan, and hotel.

| Column              | Type          | Constraints          | Notes                          |
|---------------------|---------------|----------------------|--------------------------------|
| id                  | UUID          | PK                   |                                |
| confirmation_number | VARCHAR(20)   | UNIQUE, NOT NULL     | e.g. `HMS-20261007-A3F9K`      |
| hotel_id            | UUID          | FK → hotels          |                                |
| room_type_id        | UUID          | FK → room_types      |                                |
| room_id             | UUID          | FK → rooms, nullable | Assigned at check-in or earlier|
| rate_plan_id        | UUID          | FK → rate_plans, nullable |                           |
| check_in_date       | DATE          | NOT NULL             |                                |
| check_out_date      | DATE          | NOT NULL             |                                |
| actual_check_in     | TIMESTAMPTZ   | nullable             | Set on check-in                |
| actual_check_out    | TIMESTAMPTZ   | nullable             | Set on check-out               |
| adults              | INT           | default 1            |                                |
| children            | INT           | default 0            |                                |
| status              | ENUM          | default PENDING      | See ReservationStatus enum     |
| source              | ENUM          | default WALK_IN      | See ReservationSource enum     |
| special_requests    | TEXT          | nullable             |                                |
| total_amount        | DECIMAL(10,2) | NOT NULL             |                                |
| created_by          | UUID          | FK → users           |                                |
| created_at          | TIMESTAMPTZ   | default now()        |                                |

**Indexes:** `hotel_id`, `room_id`, `status`, composite `(check_in_date, check_out_date)`, `confirmation_number`

---

## reservation_guests

Many-to-many join between reservations and guests. Supports multiple guests per booking.

| Column         | Type    | Constraints                           |
|----------------|---------|---------------------------------------|
| id             | UUID    | PK                                    |
| reservation_id | UUID    | FK → reservations                     |
| guest_id       | UUID    | FK → guests                           |
| is_primary     | BOOLEAN | default false — one primary per booking |

**Unique:** `(reservation_id, guest_id)`

---

## folios

Guest billing account. One folio per reservation (or multiple for split billing).

| Column         | Type        | Constraints        |
|----------------|-------------|--------------------|
| id             | UUID        | PK                 |
| reservation_id | UUID        | FK → reservations  |
| folio_number   | VARCHAR(20) | UNIQUE             |
| status         | ENUM        | default OPEN       |
| created_at     | TIMESTAMPTZ | default now()      |

**Indexes:** `reservation_id`

---

## folio_charges

Individual line items posted to a folio (room rate, F&B, minibar, etc.).

| Column      | Type          | Constraints        |
|-------------|---------------|--------------------|
| id          | UUID          | PK                 |
| folio_id    | UUID          | FK → folios        |
| charge_type | ENUM          | NOT NULL           |
| description | TEXT          | NOT NULL           |
| amount      | DECIMAL(10,2) | NOT NULL           |
| quantity    | INT           | default 1          |
| unit_price  | DECIMAL(10,2) | NOT NULL           |
| posted_by   | UUID          | FK → users         |
| posted_at   | TIMESTAMPTZ   | default now()      |

**Indexes:** `folio_id`, `charge_type`, `posted_at`

---

## payments

Payments applied against a folio. Supports multiple payment methods per folio.

| Column           | Type          | Constraints        |
|------------------|---------------|--------------------|
| id               | UUID          | PK                 |
| folio_id         | UUID          | FK → folios        |
| reservation_id   | UUID          | FK → reservations  |
| amount           | DECIMAL(10,2) | NOT NULL           |
| method           | ENUM          | NOT NULL           |
| reference_number | VARCHAR(100)  | nullable           |
| status           | ENUM          | default PENDING    |
| processed_by     | UUID          | FK → users         |
| processed_at     | TIMESTAMPTZ   | default now()      |

**Indexes:** `folio_id`

---

## housekeeping_tasks

Tracks cleaning and maintenance tasks assigned to housekeeping staff.

| Column         | Type        | Constraints          |
|----------------|-------------|----------------------|
| id             | UUID        | PK                   |
| room_id        | UUID        | FK → rooms           |
| assigned_to    | UUID        | FK → users           |
| task_type      | ENUM        | NOT NULL             |
| status         | ENUM        | default PENDING      |
| priority       | ENUM        | default NORMAL       |
| notes          | TEXT        | nullable             |
| scheduled_date | DATE        | NOT NULL             |
| started_at     | TIMESTAMPTZ | nullable             |
| completed_at   | TIMESTAMPTZ | nullable             |
| created_at     | TIMESTAMPTZ | default now()        |

**Indexes:** `room_id`, `assigned_to`, `status`, `scheduled_date`

---

## users

Staff accounts. Belong to a hotel and have a single role.

| Column        | Type         | Constraints        |
|---------------|--------------|--------------------|
| id            | UUID         | PK                 |
| hotel_id      | UUID         | FK → hotels        |
| first_name    | VARCHAR(100) | NOT NULL           |
| last_name     | VARCHAR(100) | NOT NULL           |
| email         | VARCHAR(150) | UNIQUE             |
| password_hash | TEXT         | NOT NULL           |
| role_id       | UUID         | FK → roles         |
| is_active     | BOOLEAN      | default true       |
| last_login    | TIMESTAMPTZ  | nullable           |
| created_at    | TIMESTAMPTZ  | default now()      |

**Indexes:** `hotel_id`, `email` (unique)

---

## roles

Pre-defined system roles. Seeded at startup.

| Column      | Type         | Constraints |
|-------------|--------------|-------------|
| id          | UUID         | PK          |
| name        | VARCHAR(60)  | UNIQUE      |
| description | TEXT         | default ''  |

**Seeded values:** `admin`, `manager`, `receptionist`, `housekeeping`, `accountant`

---

## permissions

Granular permission records using `resource:action` pairs.

| Column   | Type         | Constraints                  |
|----------|--------------|------------------------------|
| id       | UUID         | PK                           |
| resource | VARCHAR(100) | NOT NULL                     |
| action   | VARCHAR(60)  | NOT NULL                     |

**Unique:** `(resource, action)`  
**Examples:** `reservations:create`, `reports:read`, `billing:delete`

---

## role_permissions

Many-to-many join: which permissions each role holds.

| Column        | Type | Constraints           |
|---------------|------|-----------------------|
| role_id       | UUID | FK → roles            |
| permission_id | UUID | FK → permissions      |

**Composite PK:** `(role_id, permission_id)`

---

## audit_logs

Immutable log of all user actions for compliance and debugging.

| Column      | Type        | Constraints   | Notes                              |
|-------------|-------------|---------------|------------------------------------|
| id          | UUID        | PK            |                                    |
| user_id     | UUID        | FK → users    |                                    |
| action      | VARCHAR(100)| NOT NULL      | e.g. `check_in`, `rate_change`     |
| entity_type | VARCHAR(60) | NOT NULL      | e.g. `reservation`, `folio`        |
| entity_id   | UUID        | NOT NULL      |                                    |
| changes     | JSONB       | nullable      | Before/after snapshot              |
| created_at  | TIMESTAMPTZ | default now() |                                    |

**Indexes:** `user_id`, composite `(entity_type, entity_id)`, `created_at`

---

## night_audit_logs

One record per hotel per calendar day. Tracks nightly audit execution.

| Column               | Type          | Constraints              |
|----------------------|---------------|--------------------------|
| id                   | UUID          | PK                       |
| hotel_id             | UUID          | FK → hotels              |
| audit_date           | DATE          | NOT NULL                 |
| status               | ENUM          | default PENDING          |
| total_rooms_occupied | INT           | default 0                |
| total_revenue        | DECIMAL(12,2) | default 0                |
| run_by               | UUID          | FK → users               |
| completed_at         | TIMESTAMPTZ   | nullable                 |

**Unique:** `(hotel_id, audit_date)` — one audit per hotel per day

---

## Relationships Diagram

```
hotels
 ├── room_types (1:M)
 │    ├── rooms (1:M)
 │    └── rate_plans (1:M)
 ├── rooms (1:M)
 │    └── housekeeping_tasks (1:M)
 ├── reservations (1:M)
 │    ├── reservation_guests (M:M ↔ guests)
 │    └── folios (1:M)
 │         ├── folio_charges (1:M)
 │         └── payments (1:M)
 ├── users (1:M)
 │    └── role (M:1)
 │         └── role_permissions (M:M ↔ permissions)
 └── night_audit_logs (1:M)
```

---

## Enums Reference

### RoomStatus
`AVAILABLE` · `OCCUPIED` · `DIRTY` · `CLEAN` · `MAINTENANCE` · `OUT_OF_ORDER`

### ReservationStatus
`PENDING` · `CONFIRMED` · `CHECKED_IN` · `CHECKED_OUT` · `CANCELLED` · `NO_SHOW`

### ReservationSource
`WALK_IN` · `PHONE` · `WEBSITE` · `OTA_BOOKING` · `AGENT`

### GuestIdType
`PASSPORT` · `NATIONAL_ID` · `DRIVING_LICENSE`

### VipLevel
`STANDARD` · `SILVER` · `GOLD` · `PLATINUM`

### HousekeepingTaskType
`CHECKOUT_CLEAN` · `STAYOVER_CLEAN` · `TURNDOWN` · `INSPECTION` · `MAINTENANCE`

### HousekeepingTaskStatus
`PENDING` · `IN_PROGRESS` · `COMPLETED` · `VERIFIED`

### TaskPriority
`LOW` · `NORMAL` · `HIGH` · `URGENT`

### ChargeType
`ROOM_RATE` · `FNB` · `MINIBAR` · `LAUNDRY` · `TAX` · `SERVICE_CHARGE` · `MISC`

### PaymentMethod
`CASH` · `CREDIT_CARD` · `DEBIT_CARD` · `BANK_TRANSFER` · `MPESA` · `VOUCHER`

### PaymentStatus
`PENDING` · `COMPLETED` · `FAILED` · `REFUNDED`

### FolioStatus
`OPEN` · `CLOSED`

### NightAuditStatus
`PENDING` · `RUNNING` · `COMPLETED`

---

## Index Strategy

| Table              | Index                              | Reason                                      |
|--------------------|------------------------------------|---------------------------------------------|
| rooms              | hotel_id, status, room_type_id     | Room rack and availability queries          |
| reservations       | hotel_id, status, check_in_date+check_out_date | Dashboard, arrivals, departures  |
| guests             | email (unique), phone, id_number   | Fast guest lookup                           |
| folio_charges      | folio_id, charge_type, posted_at   | Folio summary aggregations                  |
| housekeeping_tasks | room_id, assigned_to, status, scheduled_date | Daily board and staff views        |
| audit_logs         | user_id, entity_type+entity_id, created_at | Compliance queries               |
| night_audit_logs   | (hotel_id, audit_date) unique      | Prevent duplicate audits per day            |

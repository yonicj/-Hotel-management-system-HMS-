# HMS — API Specification

> Base URL: `http://localhost:5000/api`  
> All endpoints return JSON. All authenticated endpoints require `Authorization: Bearer <token>`.

---

## Table of Contents

1. [Authentication](#authentication)
2. [Users](#users)
3. [Guests](#guests)
4. [Rooms](#rooms)
5. [Room Types](#room-types)
6. [Rate Plans](#rate-plans)
7. [Reservations](#reservations)
8. [Front Desk](#front-desk)
9. [Housekeeping](#housekeeping)
10. [Billing / Folio](#billing--folio)
11. [Night Audit](#night-audit)
12. [Reports](#reports)
13. [Response Format](#response-format)
14. [Error Codes](#error-codes)

---

## Authentication

### POST `/auth/login`
Login with email and password.

**Request Body**
```json
{
  "email": "admin@hotel.com",
  "password": "Admin@1234"
}
```

**Response `200`**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGc...",
    "user": {
      "id": "uuid",
      "email": "admin@hotel.com",
      "firstName": "System",
      "lastName": "Admin",
      "role": "admin",
      "hotelId": "uuid"
    }
  }
}
```
> Refresh token is set as an `httpOnly` cookie.

---

### POST `/auth/refresh`
Exchange the refresh token cookie for a new access token.

**Response `200`**
```json
{ "success": true, "data": { "accessToken": "eyJhbGc..." } }
```

---

### POST `/auth/logout`
🔒 Authenticated. Invalidates the refresh token.

---

### GET `/auth/me`
🔒 Authenticated. Returns the currently authenticated user.

---

## Users

All endpoints require `users:read` / `users:create` / `users:update` / `users:delete` permissions.

| Method | Endpoint     | Description           |
|--------|--------------|-----------------------|
| GET    | /users       | List users (paginated)|
| GET    | /users/:id   | Get user by ID        |
| POST   | /users       | Create user           |
| PUT    | /users/:id   | Update user           |
| DELETE | /users/:id   | Deactivate user       |

**POST /users — Request Body**
```json
{
  "firstName": "Jane",
  "lastName": "Doe",
  "email": "jane@hotel.com",
  "password": "Password@123",
  "roleId": "uuid",
  "hotelId": "uuid"
}
```

---

## Guests

All endpoints require `guests:read` / `guests:create` / `guests:update` permissions.

| Method | Endpoint                   | Description                  |
|--------|----------------------------|------------------------------|
| GET    | /guests?search=&page=&limit=| Search and list guests       |
| GET    | /guests/:id                | Get guest profile            |
| GET    | /guests/:id/reservations   | Guest reservation history    |
| POST   | /guests                    | Create new guest             |
| PUT    | /guests/:id                | Update guest                 |

**POST /guests — Request Body**
```json
{
  "firstName": "John",
  "lastName": "Smith",
  "email": "john.smith@example.com",
  "phone": "+254700123456",
  "nationality": "Kenyan",
  "idType": "PASSPORT",
  "idNumber": "A1234567"
}
```

---

## Rooms

| Method | Endpoint                       | Permission      | Description                    |
|--------|--------------------------------|-----------------|--------------------------------|
| GET    | /rooms                         | rooms:read      | List all rooms with type       |
| GET    | /rooms/availability            | rooms:read      | Available rooms for date range |
| GET    | /rooms/:id                     | rooms:read      | Get room detail                |
| POST   | /rooms                         | rooms:create    | Create room                    |
| PUT    | /rooms/:id/status              | rooms:update    | Update room status             |

**GET /rooms/availability — Query Params**
```
?check_in=2026-10-10&check_out=2026-10-13&room_type_id=uuid
```

**PUT /rooms/:id/status — Request Body**
```json
{ "status": "CLEAN", "notes": "Ready for next guest" }
```

---

## Room Types

| Method | Endpoint          | Permission         | Description      |
|--------|-------------------|--------------------|------------------|
| GET    | /room-types       | room_types:read    | List room types  |
| GET    | /room-types/:id   | room_types:read    | Get by ID        |
| POST   | /room-types       | room_types:create  | Create           |
| PUT    | /room-types/:id   | room_types:update  | Update           |
| DELETE | /room-types/:id   | room_types:delete  | Delete           |

**POST /room-types — Request Body**
```json
{
  "name": "Deluxe Suite",
  "description": "Luxury suite with city view",
  "baseRate": 250.00,
  "maxOccupancy": 3,
  "amenities": ["WiFi", "AC", "Mini Bar", "Jacuzzi"]
}
```

---

## Rate Plans

| Method | Endpoint              | Permission        | Description             |
|--------|-----------------------|-------------------|-------------------------|
| GET    | /rate-plans           | rate_plans:read   | List rate plans         |
| GET    | /rate-plans/compute   | rate_plans:read   | Compute rate for dates  |
| POST   | /rate-plans           | rate_plans:create | Create rate plan        |
| PUT    | /rate-plans/:id       | rate_plans:update | Update rate plan        |

**GET /rate-plans/compute — Query Params**
```
?room_type_id=uuid&check_in=2026-10-10&check_out=2026-10-13
```

**Response**
```json
{
  "nights": 3,
  "ratePerNight": 250.00,
  "totalAmount": 750.00,
  "ratePlan": { "id": "uuid", "name": "Weekend Rate" }
}
```

---

## Reservations

| Method | Endpoint                          | Permission             | Description           |
|--------|-----------------------------------|------------------------|-----------------------|
| GET    | /reservations                     | reservations:read      | List (paginated)      |
| GET    | /reservations/:id                 | reservations:read      | Get detail            |
| POST   | /reservations                     | reservations:create    | Create reservation    |
| PATCH  | /reservations/:id/confirm         | reservations:update    | Confirm               |
| PATCH  | /reservations/:id/assign-room     | reservations:update    | Assign room           |
| DELETE | /reservations/:id                 | reservations:update    | Cancel reservation    |

**POST /reservations — Request Body**
```json
{
  "guestId": "uuid",
  "roomTypeId": "uuid",
  "roomId": "uuid",
  "ratePlanId": "uuid",
  "checkInDate": "2026-10-10",
  "checkOutDate": "2026-10-13",
  "adults": 2,
  "children": 1,
  "source": "PHONE",
  "specialRequests": "High floor preferred"
}
```

**GET /reservations — Query Params**
```
?status=CONFIRMED&date=2026-10-10&page=1&limit=20
```

---

## Front Desk

| Method | Endpoint                                   | Permission        | Description          |
|--------|--------------------------------------------|-------------------|----------------------|
| POST   | /front-desk/check-in/:reservationId        | front_desk:update | Check in guest       |
| POST   | /front-desk/check-out/:reservationId       | front_desk:update | Check out guest      |
| GET    | /front-desk/arrivals?date=                 | front_desk:read   | Today's arrivals     |
| GET    | /front-desk/departures?date=               | front_desk:read   | Today's departures   |
| GET    | /front-desk/in-house                       | front_desk:read   | Currently in-house   |
| GET    | /front-desk/room-rack                      | front_desk:read   | Full room rack       |

> Check-in requires the reservation to have a room assigned and status `CONFIRMED` or `PENDING`.  
> Check-out requires the folio balance to be zero before completing.

---

## Housekeeping

| Method | Endpoint                               | Permission           | Description           |
|--------|----------------------------------------|----------------------|-----------------------|
| GET    | /housekeeping/board                    | housekeeping:read    | Full board (all rooms)|
| GET    | /housekeeping/tasks?date=              | housekeeping:read    | Tasks for a date      |
| POST   | /housekeeping/tasks                    | housekeeping:create  | Create task           |
| PATCH  | /housekeeping/tasks/:id/status         | housekeeping:update  | Update task status    |

**POST /housekeeping/tasks — Request Body**
```json
{
  "roomId": "uuid",
  "assignedTo": "uuid",
  "taskType": "CHECKOUT_CLEAN",
  "priority": "HIGH",
  "scheduledDate": "2026-10-07",
  "notes": "Guest requested extra towels"
}
```

**PATCH /housekeeping/tasks/:id/status — Request Body**
```json
{ "status": "COMPLETED", "notes": "Room cleaned and restocked" }
```

---

## Billing / Folio

| Method | Endpoint                           | Permission      | Description              |
|--------|------------------------------------|-----------------|--------------------------|
| GET    | /billing/:id                       | billing:read    | Get folio with totals    |
| GET    | /billing/:id/invoice               | billing:read    | Get invoice summary      |
| POST   | /billing/:id/charges               | billing:create  | Post a charge            |
| DELETE | /billing/:id/charges/:chargeId     | billing:delete  | Remove a charge          |
| POST   | /billing/:id/payments              | billing:create  | Record a payment         |
| POST   | /billing/:id/close                 | billing:update  | Close folio              |

**POST /billing/:id/charges — Request Body**
```json
{
  "chargeType": "MINIBAR",
  "description": "Minibar consumption",
  "quantity": 2,
  "unitPrice": 15.00
}
```

**POST /billing/:id/payments — Request Body**
```json
{
  "amount": 750.00,
  "method": "CREDIT_CARD",
  "referenceNumber": "TXN-20261007-ABC"
}
```

**GET /billing/:id — Response**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "folioNumber": "FOL-HMS-20261007-A3F9K",
    "status": "OPEN",
    "totalCharges": 780.00,
    "totalPayments": 750.00,
    "balance": 30.00,
    "charges": [...],
    "payments": [...]
  }
}
```

---

## Night Audit

| Method | Endpoint                | Permission          | Description             |
|--------|-------------------------|---------------------|-------------------------|
| GET    | /night-audit/status     | night_audit:read    | Today's audit status    |
| GET    | /night-audit/history    | night_audit:read    | Past 30 audit records   |
| POST   | /night-audit/run        | night_audit:create  | Execute night audit     |

**Night Audit Process:**
1. Posts `ROOM_RATE` charges to all open folios for checked-in guests
2. Marks overdue `CONFIRMED` reservations as `NO_SHOW`
3. Calculates occupancy and revenue totals
4. Emits real-time progress via Socket.IO events

---

## Reports

All endpoints require `reports:read` permission.

| Method | Endpoint                             | Query Params           | Description                      |
|--------|--------------------------------------|------------------------|----------------------------------|
| GET    | /reports/occupancy                   | from=, to=             | Daily occupancy % over date range|
| GET    | /reports/revenue                     | from=, to=             | Daily revenue over date range    |
| GET    | /reports/arrivals-departures         | date=                  | Arrivals & departures for a day  |
| GET    | /reports/housekeeping-summary        | date=                  | Task count by status             |
| GET    | /reports/guest-ledger                | —                      | All open folios with balances    |

**GET /reports/occupancy — Response**
```json
{
  "success": true,
  "data": [
    { "date": "2026-10-01", "roomsOccupied": 42, "totalRooms": 60, "occupancyRate": 70 },
    { "date": "2026-10-02", "roomsOccupied": 55, "totalRooms": 60, "occupancyRate": 92 }
  ]
}
```

---

## Response Format

### Success
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { }
}
```

### Paginated Success
```json
{
  "success": true,
  "data": [ ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

### Error
```json
{
  "success": false,
  "message": "Validation failed",
  "statusCode": 400,
  "errors": {
    "email": ["Enter a valid email address"],
    "checkOutDate": ["Check-out must be after check-in"]
  }
}
```

---

## Error Codes

| Status | Meaning                                              |
|--------|------------------------------------------------------|
| 400    | Bad request / validation error                       |
| 401    | Unauthenticated — missing or invalid access token    |
| 403    | Forbidden — missing RBAC permission                  |
| 404    | Resource not found                                   |
| 409    | Conflict — e.g. email already exists                 |
| 429    | Too many requests (rate limiter)                     |
| 500    | Internal server error                                |

---

## Socket.IO Events

Connect to `ws://localhost:5000` and join your hotel room:

```js
socket.emit('join:hotel', hotelId);
```

### Emitted Events (server → client)

| Event                          | Payload                                          |
|--------------------------------|--------------------------------------------------|
| `room:status:updated`          | `{ roomId, roomNumber, status, updatedBy, updatedAt }` |
| `reservation:checked_in`       | `{ reservationId, confirmationNumber, roomId, roomNumber, guestName }` |
| `reservation:checked_out`      | `{ reservationId, confirmationNumber, roomId, roomNumber }` |
| `reservation:created`          | `{ reservationId, confirmationNumber }`          |
| `reservation:cancelled`        | `{ reservationId, confirmationNumber }`          |
| `housekeeping:task:updated`    | `{ task: HousekeepingTask }`                     |
| `housekeeping:task:assigned`   | `{ task: HousekeepingTask }`                     |
| `night_audit:progress`         | `{ status, step, progress }`                     |

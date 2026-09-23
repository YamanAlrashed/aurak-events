# AURAK Events — API Contract (for the frontend)

Base URL (dev): `http://localhost:5000`
All requests/responses are JSON unless noted. Protected routes need:

```
Authorization: Bearer <token>
```

Every error has the same shape:

```json
{ "error": { "message": "Human readable message", "code": "VALIDATION_ERROR" } }
```

Codes: `VALIDATION_ERROR` (400), `UNAUTHORIZED` (401), `FORBIDDEN` (403), `NOT_FOUND` (404), `CONFLICT` (409), `SERVER_ERROR` (500).

Roles: `admin` (university staff) and `student`. **Prospective students don't have accounts** — they register as guests on public events.

Seed logins (password `password123`): `admin@aurak.ac.ae` (admin), `mudassir@aurak.ac.ae` (student).

---

## Auth

| Method | Route | Auth | Body |
|---|---|---|---|
| POST | `/api/auth/register` | public | `{ name, email, password (8+), student_id?, phone?, program? }` → always creates a **student** |
| POST | `/api/auth/login` | public | `{ email, password }` |
| GET | `/api/auth/me` | any | — |

Response for register/login:

```json
{ "user": { "id": 3, "name": "Mudassir Shahab", "email": "mudassir@aurak.ac.ae", "role": "student" }, "token": "eyJ..." }
```

Store the token (e.g. localStorage) and send it as the Bearer header. On `401` → log the user out.

## Events

| Method | Route | Auth | Notes |
|---|---|---|---|
| GET | `/api/events` | optional | Query: `category`, `upcoming=true`, `search`, `status` (admin only). Students/guests only see `published` + `completed`. |
| GET | `/api/events/:id` | optional | Includes `sessions` (schedule) and `my_registration` if a student is logged in |
| POST | `/api/events` | admin | see body below |
| PUT | `/api/events/:id` | admin | send only the fields to change |
| DELETE | `/api/events/:id` | admin | deletes sessions, registrations, photos too |
| POST | `/api/events/:id/sessions` | admin | `{ title, speaker?, location?, start_time, end_time }` |
| DELETE | `/api/events/:id/sessions/:sessionId` | admin | |

Create event body:

```json
{
  "title": "Fall Open Day 2026",
  "description": "Tour the campus...",
  "category": "open_day",
  "location": "Main Campus - Auditorium",
  "start_time": "2026-10-07T09:00:00+04:00",
  "end_time": "2026-10-07T14:00:00+04:00",
  "capacity": 300,
  "cover_image_url": null,
  "is_public": true,
  "status": "published",
  "sessions": [
    { "title": "Welcome", "speaker": "President", "start_time": "2026-10-07T09:00:00+04:00", "end_time": "2026-10-07T09:45:00+04:00" }
  ]
}
```

- `category`: `marketing | workshop | open_day | fair | activity | seminar | other`
- `status`: `draft | published | cancelled | completed` (drafts are hidden from students)
- `is_public`: `true` = prospective students can register without logging in; `false` = students only
- `capacity`: `null` = unlimited

Event object (list + detail):

```json
{
  "id": 1, "title": "...", "description": "...", "category": "open_day", "location": "...",
  "start_time": "2026-10-07T05:00:00.000Z", "end_time": "...", "capacity": 300,
  "cover_image_url": null, "is_public": true, "status": "published",
  "created_by": 2, "created_by_name": "Marketing Officer",
  "registered_count": 3, "waitlist_count": 0, "attended_count": 0, "spots_left": 297,
  "sessions": [ ... ],            // detail only
  "my_registration": null          // detail only, logged-in student
}
```

Times come back in UTC ISO format — format them in the browser (`new Date(t).toLocaleString()`).

## Registration

| Method | Route | Auth | Notes |
|---|---|---|---|
| POST | `/api/events/:id/register` | optional | Logged-in student → body `{}`. Guest → `{ guest_name, guest_email, guest_phone?, program_interest?, marketing_consent }` |
| GET | `/api/registrations/me` | student | "My Events" list incl. `qr_token` and `checked_in_at` |
| GET | `/api/registrations/ticket/:qrToken` | public | Guest ticket page (show QR code of `qr_token`) |
| DELETE | `/api/registrations/:id` | student (own) / admin | Cancels; first waitlisted person is promoted |
| GET | `/api/events/:id/registrations` | admin | Registrations + attendance. `?status=registered|waitlisted|cancelled` |
| GET | `/api/events/:id/registrations/export` | admin | **CSV download** |

Register response (`201`):

```json
{ "message": "Registered successfully", "registration": { "id": 9, "status": "registered", "qr_token": "0ddb66f4...", ... } }
```

If full: `status: "waitlisted"` and message says so. Already registered → `409 CONFLICT`.

**QR code:** the frontend makes the QR image from `qr_token` (e.g. `npm i qrcode.react` → `<QRCodeSVG value={qr_token} />`).

**Consent checkbox:** show on the guest form — *"I agree that AURAK Admissions may contact me about programs and events."* → `marketing_consent`. Only consenting prospects are sent to Meritto.

## Check-in (admin scanner page)

| Method | Route | Body |
|---|---|---|
| POST | `/api/checkin` | `{ qr_token, event_id? }` — `event_id` makes sure the ticket belongs to the event being scanned |
| POST | `/api/checkin/manual` | `{ registration_id, event_id? }` |
| DELETE | `/api/checkin/:registrationId` | undo |

Success `201`: `{ "message": "Ali Test checked in", "attendee_name": "Ali Test", "event_title": "...", "attendance": {...} }`
Already checked in → `409`. Wrong event / cancelled / waitlisted → `400`.
Scanner library suggestion: `html5-qrcode` or `@yudiel/react-qr-scanner`.

## Gallery

| Method | Route | Auth | Notes |
|---|---|---|---|
| GET | `/api/events/:id/photos` | optional | Public sees `approved` only. Admin sees all, `?status=pending` |
| POST | `/api/events/:id/photos` | any logged-in | **multipart/form-data**: `photo` (jpg/png/webp, ≤8MB) + `caption?`. Students' photos start `pending`, admins' are auto-approved |
| GET | `/api/photos/me` | any | My uploads + status |
| PUT | `/api/photos/:id/review` | admin | `{ "status": "approved" \| "rejected" }` |
| DELETE | `/api/photos/:id` | owner / admin | |

Image URL = `BASE_URL + file_url` (e.g. `http://localhost:5000/uploads/1790...jpg`).

Upload example:

```js
const fd = new FormData();
fd.append('photo', file);
fd.append('caption', caption);
await fetch(`${API}/api/events/${id}/photos`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd });
// don't set Content-Type yourself for FormData
```

## Analytics (admin dashboard)

| Route | Returns |
|---|---|
| GET `/api/analytics/summary` | `{ totalEvents, upcomingEvents, totalRegistrations, totalAttendance, attendanceRate, prospectsCaptured, leadsSyncedToCrm, crmSyncFailures, photosPendingReview }` |
| GET `/api/analytics/registration-trend?days=30` | `[{ date, students, prospects, total }]` — line chart |
| GET `/api/analytics/events` | `[{ id, title, category, startTime, status, capacity, registered, waitlisted, prospects, attended, attendanceRate }]` — table |
| GET `/api/analytics/categories` | `[{ category, events, registrations, attended }]` — bar/pie chart |
| GET `/api/analytics/program-interest` | `[{ program, prospects }]` — what prospects want to study |
| GET `/api/analytics/export` | **CSV download** |

Rates are 0–1 (multiply by 100 for %).

## Users (admin)

| Method | Route | Body |
|---|---|---|
| GET | `/api/users?role=student\|admin` | — |
| POST | `/api/users` | `{ name, email, password, role, student_id?, phone?, program? }` (the only way to create admins) |
| DELETE | `/api/users/:id` | — |

## Meritto sync monitor (admin)

| Method | Route | Notes |
|---|---|---|
| GET | `/api/crm/jobs?status=pending\|synced\|failed` | `{ mode: "mock"\|"live"\|"off", jobs: [...] }` |
| POST | `/api/crm/jobs/:id/retry` | retry a failed job |
| POST | `/api/crm/sync-now` | process pending jobs immediately |

## Health

`GET /api/health` → `{ "status": "API is running" }`

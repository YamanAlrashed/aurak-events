# Data Layer — AURAK Events

## Tables

### users
Admins (university staff) and students. `role` is `admin` or `student`.
Fields: id, name, email, password_hash, role, student_id, phone, program, created_at

### events
Marketing events, workshops, open days, fairs, activities.
Fields: id, title, description, category, location, start_time, end_time, capacity, cover_image_url, is_public, status, created_by, created_at, updated_at

### event_sessions
The schedule inside one event.
Fields: id, event_id, title, speaker, location, start_time, end_time

### registrations
One row per person per event. Either `user_id` (student with an account) or `guest_name` + `guest_email` (prospective student, no account).
Fields: id, event_id, user_id, guest_name, guest_email, guest_phone, program_interest, status, qr_token, marketing_consent, meritto_lead_id, registered_at

### attendance
One check-in per registration (QR scan or manual).
Fields: id, registration_id, event_id, method, checked_in_by, checked_in_at

### photos
Event gallery. Student uploads are `pending` until an admin approves.
Fields: id, event_id, uploaded_by, file_url, caption, status, reviewed_by, reviewed_at, created_at

### crm_sync_jobs
Outbox for the Meritto integration — one row per thing that must be sent to Meritto.
Fields: id, registration_id, action, status, attempts, last_error, response, next_attempt_at, created_at, updated_at

## Relationships

- events.created_by → users.id
- event_sessions.event_id → events.id
- registrations.event_id → events.id
- registrations.user_id → users.id (NULL for guests)
- attendance.registration_id → registrations.id (unique: can't check in twice)
- attendance.event_id → events.id
- attendance.checked_in_by → users.id
- photos.event_id → events.id, photos.uploaded_by / reviewed_by → users.id
- crm_sync_jobs.registration_id → registrations.id

One event → many sessions, many registrations, many photos.
One registration → at most one attendance record, many CRM sync jobs.

## Key rules enforced by the database

- `end_time > start_time` for events and sessions
- A registration must have a user OR a guest name + email
- A student / guest email can only register once per event (`UNIQUE (event_id, user_id)`, `UNIQUE (event_id, guest_email)`)
- `qr_token` is unique (random 48-char hex)
- One attendance row per registration

## Business rules enforced by the backend

- Capacity full → new registrations become `waitlisted`; cancelling promotes the oldest waitlisted
- Guests can only register for `is_public` events; admins can't register
- Only `published` events accept registrations; drafts are hidden from students
- Only consenting prospects (`marketing_consent = true`) are sent to Meritto

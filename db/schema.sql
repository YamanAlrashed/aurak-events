-- =====================================================
-- AURAK Events - University Marketing & Events Platform
-- Data Layer: Core Schema
-- Author: Mudassir Shahab
-- =====================================================

DROP TABLE IF EXISTS crm_sync_jobs;
DROP TABLE IF EXISTS photos;
DROP TABLE IF EXISTS attendance;
DROP TABLE IF EXISTS registrations;
DROP TABLE IF EXISTS event_sessions;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS users;

-- =========================
-- Users Table
-- Stores admins (university staff) and students with login credentials and roles
-- Prospective students do NOT need an account (see registrations.guest_*)
-- =========================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'student' CHECK (role IN ('admin', 'student')),
    student_id VARCHAR(30),
    phone VARCHAR(30),
    program VARCHAR(150),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- Events Table
-- Marketing events, workshops, open days, fairs, university activities
-- =========================
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(30) NOT NULL DEFAULT 'activity'
        CHECK (category IN ('marketing', 'workshop', 'open_day', 'fair', 'activity', 'seminar', 'other')),
    location VARCHAR(200) NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    capacity INTEGER CHECK (capacity IS NULL OR capacity > 0),
    cover_image_url TEXT,
    is_public BOOLEAN NOT NULL DEFAULT TRUE,          -- TRUE = prospects/guests can register without an account
    status VARCHAR(20) NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'published', 'cancelled', 'completed')),
    created_by INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_event_times CHECK (end_time > start_time),

    CONSTRAINT fk_events_created_by
        FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE RESTRICT
);

-- =========================
-- Event Sessions Table
-- Schedule / agenda items inside one event
-- =========================
CREATE TABLE event_sessions (
    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL,
    title VARCHAR(200) NOT NULL,
    speaker VARCHAR(150),
    location VARCHAR(200),
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,

    CONSTRAINT chk_session_times CHECK (end_time > start_time),

    CONSTRAINT fk_sessions_event
        FOREIGN KEY (event_id)
        REFERENCES events(id)
        ON DELETE CASCADE
);

-- =========================
-- Registrations Table
-- One row per person per event.
-- Either user_id (logged-in student) OR guest_email (prospective student) is set.
-- qr_token is the value encoded in the check-in QR code.
-- =========================
CREATE TABLE registrations (
    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL,
    user_id INTEGER,
    guest_name VARCHAR(100),
    guest_email VARCHAR(150),
    guest_phone VARCHAR(30),
    program_interest VARCHAR(150),
    status VARCHAR(20) NOT NULL DEFAULT 'registered'
        CHECK (status IN ('registered', 'waitlisted', 'cancelled')),
    qr_token VARCHAR(64) UNIQUE NOT NULL,
    marketing_consent BOOLEAN NOT NULL DEFAULT FALSE,  -- consent to share details with admissions CRM (Meritto)
    meritto_lead_id VARCHAR(100),
    registered_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_registrant CHECK (user_id IS NOT NULL OR (guest_email IS NOT NULL AND guest_name IS NOT NULL)),

    CONSTRAINT fk_registrations_event
        FOREIGN KEY (event_id)
        REFERENCES events(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_registrations_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT unique_event_user UNIQUE (event_id, user_id),
    CONSTRAINT unique_event_guest UNIQUE (event_id, guest_email)
);

-- =========================
-- Attendance Table
-- One check-in per registration (QR scan or manual by an admin)
-- =========================
CREATE TABLE attendance (
    id SERIAL PRIMARY KEY,
    registration_id INTEGER UNIQUE NOT NULL,
    event_id INTEGER NOT NULL,
    method VARCHAR(20) NOT NULL DEFAULT 'qr' CHECK (method IN ('qr', 'manual')),
    checked_in_by INTEGER,
    checked_in_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_attendance_registration
        FOREIGN KEY (registration_id)
        REFERENCES registrations(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_attendance_event
        FOREIGN KEY (event_id)
        REFERENCES events(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_attendance_checked_in_by
        FOREIGN KEY (checked_in_by)
        REFERENCES users(id)
        ON DELETE SET NULL
);

-- =========================
-- Photos Table
-- Event gallery. Student uploads start as 'pending' until an admin approves them.
-- =========================
CREATE TABLE photos (
    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL,
    uploaded_by INTEGER NOT NULL,
    file_url TEXT NOT NULL,
    caption VARCHAR(300),
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by INTEGER,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_photos_event
        FOREIGN KEY (event_id)
        REFERENCES events(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_photos_uploaded_by
        FOREIGN KEY (uploaded_by)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_photos_reviewed_by
        FOREIGN KEY (reviewed_by)
        REFERENCES users(id)
        ON DELETE SET NULL
);

-- =========================
-- CRM Sync Jobs Table (Meritto outbox)
-- Every registration / check-in that must reach Meritto gets a job row.
-- A background worker sends pending jobs and retries failures.
-- =========================
CREATE TABLE crm_sync_jobs (
    id SERIAL PRIMARY KEY,
    registration_id INTEGER NOT NULL,
    action VARCHAR(30) NOT NULL CHECK (action IN ('upsert_lead', 'log_attendance')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'processing', 'synced', 'failed')),
    attempts INTEGER NOT NULL DEFAULT 0,
    last_error TEXT,
    response JSONB,
    next_attempt_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_crm_jobs_registration
        FOREIGN KEY (registration_id)
        REFERENCES registrations(id)
        ON DELETE CASCADE
);

-- =========================
-- Indexes
-- =========================
CREATE INDEX idx_events_status_start ON events(status, start_time);
CREATE INDEX idx_sessions_event ON event_sessions(event_id);
CREATE INDEX idx_registrations_event ON registrations(event_id);
CREATE INDEX idx_registrations_user ON registrations(user_id);
CREATE INDEX idx_attendance_event ON attendance(event_id);
CREATE INDEX idx_photos_event_status ON photos(event_id, status);
CREATE INDEX idx_crm_jobs_pending ON crm_sync_jobs(status, next_attempt_at);

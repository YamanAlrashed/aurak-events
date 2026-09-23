-- =====================================================
-- AURAK Events - University Marketing & Events Platform
-- Data Layer: Main JOIN Queries (used by the backend API)
-- Author: Mudassir Shahab
-- =====================================================

-- =========================
-- 1. Upcoming published events with live registration counts
-- (GET /api/events?upcoming=true)
-- =========================
SELECT
    e.id, e.title, e.category, e.location, e.start_time, e.end_time, e.capacity,
    admin_user.name AS created_by_admin,
    COUNT(r.id) FILTER (WHERE r.status = 'registered') AS registered_count,
    COUNT(r.id) FILTER (WHERE r.status = 'waitlisted') AS waitlist_count
FROM events AS e
JOIN users AS admin_user ON e.created_by = admin_user.id
LEFT JOIN registrations AS r ON r.event_id = e.id
WHERE e.status = 'published' AND e.end_time >= NOW()
GROUP BY e.id, admin_user.name
ORDER BY e.start_time ASC;

-- =========================
-- 2. Full event view with schedule
-- (GET /api/events/:id)
-- =========================
SELECT
    e.id AS event_id, e.title, e.location, e.start_time AS event_start,
    s.title AS session_title, s.speaker, s.location AS session_location,
    s.start_time AS session_start, s.end_time AS session_end
FROM events AS e
LEFT JOIN event_sessions AS s ON s.event_id = e.id
WHERE e.id = 1
ORDER BY s.start_time;

-- =========================
-- 3. Registrations + attendance for one event (students and prospects together)
-- (GET /api/events/:id/registrations)
-- =========================
SELECT
    r.id AS registration_id,
    CASE WHEN r.user_id IS NULL THEN 'prospect' ELSE 'student' END AS attendee_type,
    COALESCE(u.name, r.guest_name) AS name,
    COALESCE(u.email, r.guest_email) AS email,
    r.status,
    a.checked_in_at,
    a.method AS check_in_method,
    r.meritto_lead_id
FROM registrations AS r
LEFT JOIN users AS u ON u.id = r.user_id
LEFT JOIN attendance AS a ON a.registration_id = r.id
WHERE r.event_id = 1
ORDER BY r.registered_at;

-- =========================
-- 4. A student's "My Events" page
-- (GET /api/registrations/me)
-- =========================
SELECT
    e.title, e.start_time, e.location, r.status, r.qr_token, a.checked_in_at
FROM registrations AS r
JOIN events AS e ON e.id = r.event_id
LEFT JOIN attendance AS a ON a.registration_id = r.id
WHERE r.user_id = 3 AND r.status <> 'cancelled'
ORDER BY e.start_time;

-- =========================
-- 5. Event performance (attendance rate) for the admin dashboard
-- (GET /api/analytics/events)
-- =========================
SELECT
    e.title,
    COUNT(r.id) FILTER (WHERE r.status = 'registered') AS registered,
    COUNT(a.id) AS attended,
    ROUND(COUNT(a.id)::numeric / NULLIF(COUNT(r.id) FILTER (WHERE r.status = 'registered'), 0), 4) AS attendance_rate
FROM events AS e
LEFT JOIN registrations AS r ON r.event_id = e.id
LEFT JOIN attendance AS a ON a.registration_id = r.id
WHERE e.status <> 'draft'
GROUP BY e.id
ORDER BY e.start_time DESC;

-- =========================
-- 6. Approved gallery photos with uploader
-- (GET /api/events/:id/photos)
-- =========================
SELECT p.id, p.file_url, p.caption, u.name AS uploaded_by, p.created_at
FROM photos AS p
JOIN users AS u ON u.id = p.uploaded_by
WHERE p.event_id = 4 AND p.status = 'approved'
ORDER BY p.created_at DESC;

-- =========================
-- 7. Meritto sync status (outbox monitor)
-- (GET /api/crm/jobs)
-- =========================
SELECT
    j.id, j.action, j.status, j.attempts, j.last_error,
    COALESCE(u.name, r.guest_name) AS attendee_name,
    e.title AS event_title,
    r.meritto_lead_id
FROM crm_sync_jobs AS j
JOIN registrations AS r ON r.id = j.registration_id
JOIN events AS e ON e.id = r.event_id
LEFT JOIN users AS u ON u.id = r.user_id
ORDER BY j.created_at DESC;

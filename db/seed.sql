-- =====================================================
-- AURAK Events - University Marketing & Events Platform
-- Data Layer: Sample Seed Data
-- Author: Mudassir Shahab
-- =====================================================

-- Seed users
-- Password for ALL seed users: password123 (testing only)
-- In the real app, passwords are hashed by the backend auth layer.
INSERT INTO users (name, email, password_hash, role, student_id, phone, program)
VALUES
('Events Admin', 'admin@aurak.ac.ae', '$2b$10$C7Vh8FBQslZp8UDxTsCCW.ymvsXCRjnyN7ZRIvlO/UMt/X8n1FxZO', 'admin', NULL, NULL, NULL),
('Marketing Officer', 'marketing@aurak.ac.ae', '$2b$10$C7Vh8FBQslZp8UDxTsCCW.ymvsXCRjnyN7ZRIvlO/UMt/X8n1FxZO', 'admin', NULL, NULL, NULL),
('Mudassir Shahab', 'mudassir@aurak.ac.ae', '$2b$10$C7Vh8FBQslZp8UDxTsCCW.ymvsXCRjnyN7ZRIvlO/UMt/X8n1FxZO', 'student', 'S2023001', '+971500000001', 'BSc Computer Science'),
('Yaman Alrashed', 'yaman@aurak.ac.ae', '$2b$10$C7Vh8FBQslZp8UDxTsCCW.ymvsXCRjnyN7ZRIvlO/UMt/X8n1FxZO', 'student', 'S2023002', '+971500000002', 'BSc Computer Science'),
('Sara Ahmed', 'sara@aurak.ac.ae', '$2b$10$C7Vh8FBQslZp8UDxTsCCW.ymvsXCRjnyN7ZRIvlO/UMt/X8n1FxZO', 'student', 'S2024010', '+971500000003', 'BBA Marketing');

-- Seed events (dates are relative to today so they always show as upcoming/past correctly)
INSERT INTO events (title, description, category, location, start_time, end_time, capacity, is_public, status, created_by)
VALUES
(
    'Fall Open Day 2026',
    'Tour the campus, meet faculty, and learn about undergraduate programs and scholarships.',
    'open_day', 'Main Campus - Auditorium',
    CURRENT_DATE + INTERVAL '14 days 9 hours', CURRENT_DATE + INTERVAL '14 days 14 hours',
    300, TRUE, 'published', 2
),
(
    'AI & Data Science Workshop',
    'Hands-on introduction to machine learning with Python. Laptops required.',
    'workshop', 'Engineering Building - Lab 204',
    CURRENT_DATE + INTERVAL '7 days 13 hours', CURRENT_DATE + INTERVAL '7 days 16 hours',
    40, FALSE, 'published', 1
),
(
    'UAE Higher Education Fair',
    'Meet the AURAK admissions team at the national education fair.',
    'fair', 'Dubai World Trade Centre',
    CURRENT_DATE + INTERVAL '30 days 10 hours', CURRENT_DATE + INTERVAL '30 days 18 hours',
    NULL, TRUE, 'published', 2
),
(
    'Spring Career Day',
    'Employers from across the region meet students and graduates.',
    'activity', 'Student Center',
    CURRENT_DATE - INTERVAL '20 days' + INTERVAL '10 hours', CURRENT_DATE - INTERVAL '20 days' + INTERVAL '15 hours',
    200, FALSE, 'completed', 1
),
(
    'Scholarship Info Session (Draft)',
    'Details about merit and need-based scholarships.',
    'seminar', 'Online - MS Teams',
    CURRENT_DATE + INTERVAL '45 days 17 hours', CURRENT_DATE + INTERVAL '45 days 18 hours',
    100, TRUE, 'draft', 2
);

-- Seed event schedule (sessions)
INSERT INTO event_sessions (event_id, title, speaker, location, start_time, end_time)
VALUES
(1, 'Welcome & President Address', 'University President', 'Auditorium',
    CURRENT_DATE + INTERVAL '14 days 9 hours', CURRENT_DATE + INTERVAL '14 days 9 hours 45 minutes'),
(1, 'Campus Tour', 'Student Ambassadors', 'Main Gate',
    CURRENT_DATE + INTERVAL '14 days 10 hours', CURRENT_DATE + INTERVAL '14 days 11 hours'),
(1, 'Admissions & Scholarships Q&A', 'Admissions Office', 'Auditorium',
    CURRENT_DATE + INTERVAL '14 days 11 hours 30 minutes', CURRENT_DATE + INTERVAL '14 days 12 hours 30 minutes'),
(2, 'Intro to ML', 'Dr. Example', 'Lab 204',
    CURRENT_DATE + INTERVAL '7 days 13 hours', CURRENT_DATE + INTERVAL '7 days 14 hours 30 minutes'),
(2, 'Hands-on Lab', 'Teaching Assistants', 'Lab 204',
    CURRENT_DATE + INTERVAL '7 days 14 hours 30 minutes', CURRENT_DATE + INTERVAL '7 days 16 hours');

-- Seed registrations (students + prospective-student guests)
INSERT INTO registrations (event_id, user_id, guest_name, guest_email, guest_phone, program_interest, status, qr_token, marketing_consent, registered_at)
VALUES
(1, NULL, 'Omar Khalid', 'omar.prospect@example.com', '+971501111111', 'BSc Computer Science', 'registered', 'seedtoken0001', TRUE, CURRENT_TIMESTAMP - INTERVAL '5 days'),
(1, NULL, 'Layla Hassan', 'layla.prospect@example.com', '+971502222222', 'BBA', 'registered', 'seedtoken0002', TRUE, CURRENT_TIMESTAMP - INTERVAL '3 days'),
(1, 3, NULL, NULL, NULL, NULL, 'registered', 'seedtoken0003', FALSE, CURRENT_TIMESTAMP - INTERVAL '2 days'),
(2, 3, NULL, NULL, NULL, NULL, 'registered', 'seedtoken0004', FALSE, CURRENT_TIMESTAMP - INTERVAL '4 days'),
(2, 4, NULL, NULL, NULL, NULL, 'registered', 'seedtoken0005', FALSE, CURRENT_TIMESTAMP - INTERVAL '1 day'),
(4, 3, NULL, NULL, NULL, NULL, 'registered', 'seedtoken0006', FALSE, CURRENT_TIMESTAMP - INTERVAL '25 days'),
(4, 4, NULL, NULL, NULL, NULL, 'registered', 'seedtoken0007', FALSE, CURRENT_TIMESTAMP - INTERVAL '24 days'),
(4, 5, NULL, NULL, NULL, NULL, 'registered', 'seedtoken0008', FALSE, CURRENT_TIMESTAMP - INTERVAL '22 days');

-- Seed attendance for the completed event
INSERT INTO attendance (registration_id, event_id, method, checked_in_by, checked_in_at)
VALUES
(6, 4, 'qr', 1, CURRENT_DATE - INTERVAL '20 days' + INTERVAL '10 hours 5 minutes'),
(7, 4, 'manual', 1, CURRENT_DATE - INTERVAL '20 days' + INTERVAL '10 hours 20 minutes');

-- Seed gallery photos for the completed event
INSERT INTO photos (event_id, uploaded_by, file_url, caption, status, reviewed_by, reviewed_at)
VALUES
(4, 3, '/uploads/sample-career-day-1.jpg', 'Employer booths', 'approved', 1, CURRENT_TIMESTAMP - INTERVAL '19 days'),
(4, 4, '/uploads/sample-career-day-2.jpg', 'Networking session', 'pending', NULL, NULL);

-- Seed CRM sync jobs for the consenting prospects
INSERT INTO crm_sync_jobs (registration_id, action, status)
VALUES
(1, 'upsert_lead', 'pending'),
(2, 'upsert_lead', 'pending');

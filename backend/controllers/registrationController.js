const crypto = require('crypto');
const { Parser } = require('json2csv');
const pool = require('../db');
const { enqueueCrmJob } = require('../services/crmQueue');
const { badRequest, forbidden, notFound, conflict } = require('../utils/errors');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const newQrToken = () => crypto.randomBytes(24).toString('hex');

// @desc    Register for an event.
//          Logged-in student → linked to their account.
//          No token (prospective student) → guest_name + guest_email required, event must be public.
// @route   POST /api/events/:id/register
const registerForEvent = async (req, res, next) => {
    const eventId = req.params.id;
    const isStudent = req.user?.role === 'student';
    if (req.user?.role === 'admin') return next(badRequest('Admins cannot register for events'));

    const { guest_name, guest_email, guest_phone, program_interest, marketing_consent } = req.body;
    if (!isStudent) {
        if (!guest_name || !guest_email) return next(badRequest('guest_name and guest_email are required (or log in as a student)'));
        if (!EMAIL_RE.test(guest_email)) return next(badRequest('Invalid email address'));
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Lock the event row so two people can't grab the last seat at the same time
        const evRes = await client.query('SELECT * FROM events WHERE id = $1 FOR UPDATE', [eventId]);
        const event = evRes.rows[0];
        if (!event || event.status === 'draft') { await client.query('ROLLBACK'); return next(notFound('Event not found')); }
        if (event.status !== 'published') { await client.query('ROLLBACK'); return next(badRequest(`Registration is closed (event is ${event.status})`)); }
        if (new Date(event.end_time) < new Date()) { await client.query('ROLLBACK'); return next(badRequest('This event has already ended')); }
        if (!isStudent && !event.is_public) { await client.query('ROLLBACK'); return next(forbidden('This event is for university students only. Please log in.')); }

        // Existing registration? (re-activate if it was cancelled)
        const existing = await client.query(
            isStudent
                ? 'SELECT * FROM registrations WHERE event_id = $1 AND user_id = $2'
                : 'SELECT * FROM registrations WHERE event_id = $1 AND guest_email = LOWER($2)',
            [eventId, isStudent ? req.user.id : guest_email]
        );
        if (existing.rows[0] && existing.rows[0].status !== 'cancelled') {
            await client.query('ROLLBACK');
            return next(conflict('You are already registered for this event'));
        }

        // Capacity check → waitlist when full
        let status = 'registered';
        if (event.capacity != null) {
            const countRes = await client.query(
                `SELECT COUNT(*)::int AS n FROM registrations WHERE event_id = $1 AND status = 'registered'`, [eventId]
            );
            if (countRes.rows[0].n >= event.capacity) status = 'waitlisted';
        }

        let registration;
        if (existing.rows[0]) {
            const upd = await client.query(
                `UPDATE registrations
                 SET status = $1, qr_token = $2, registered_at = NOW(),
                     guest_name = COALESCE($3, guest_name), guest_phone = COALESCE($4, guest_phone),
                     program_interest = COALESCE($5, program_interest), marketing_consent = $6
                 WHERE id = $7 RETURNING *`,
                [status, newQrToken(), guest_name || null, guest_phone || null, program_interest || null, !!marketing_consent, existing.rows[0].id]
            );
            registration = upd.rows[0];
        } else {
            const ins = await client.query(
                `INSERT INTO registrations
                    (event_id, user_id, guest_name, guest_email, guest_phone, program_interest, status, qr_token, marketing_consent)
                 VALUES ($1, $2, $3, LOWER($4), $5, $6, $7, $8, $9)
                 RETURNING *`,
                [eventId, isStudent ? req.user.id : null,
                 isStudent ? null : guest_name, isStudent ? null : guest_email, isStudent ? null : (guest_phone || null),
                 program_interest || null, status, newQrToken(), !!marketing_consent]
            );
            registration = ins.rows[0];
        }

        // Prospective students who consented → send to Meritto (async, via outbox)
        if (!isStudent && registration.marketing_consent) {
            await enqueueCrmJob(client, registration.id, 'upsert_lead');
        }

        await client.query('COMMIT');
        res.status(201).json({
            message: status === 'waitlisted' ? 'Event is full — you have been added to the waitlist' : 'Registered successfully',
            registration
        });
    } catch (err) {
        await client.query('ROLLBACK');
        if (err.code === '23505') err.friendly = 'You are already registered for this event';
        next(err);
    } finally {
        client.release();
    }
};

// @desc    Logged-in student's registrations (their "My Events" / tickets page)
// @route   GET /api/registrations/me
const getMyRegistrations = async (req, res, next) => {
    try {
        const result = await pool.query(
            `SELECT r.id, r.status, r.qr_token, r.registered_at,
                    e.id AS event_id, e.title, e.category, e.location, e.start_time, e.end_time, e.status AS event_status, e.cover_image_url,
                    a.checked_in_at
             FROM registrations r
             JOIN events e ON e.id = r.event_id
             LEFT JOIN attendance a ON a.registration_id = r.id
             WHERE r.user_id = $1 AND r.status <> 'cancelled'
             ORDER BY e.start_time ASC`,
            [req.user.id]
        );
        res.json(result.rows);
    } catch (err) { next(err); }
};

// @desc    Look up a ticket by its QR token (public — used by guests to view their ticket page)
// @route   GET /api/registrations/ticket/:qrToken
const getTicket = async (req, res, next) => {
    try {
        const result = await pool.query(
            `SELECT r.id, r.status, r.qr_token, r.registered_at,
                    COALESCE(u.name, r.guest_name) AS attendee_name,
                    e.id AS event_id, e.title, e.location, e.start_time, e.end_time,
                    a.checked_in_at
             FROM registrations r
             JOIN events e ON e.id = r.event_id
             LEFT JOIN users u ON u.id = r.user_id
             LEFT JOIN attendance a ON a.registration_id = r.id
             WHERE r.qr_token = $1`,
            [req.params.qrToken]
        );
        if (!result.rows[0]) return next(notFound('Ticket not found'));
        res.json(result.rows[0]);
    } catch (err) { next(err); }
};

// @desc    Cancel a registration. Students cancel their own; admins can cancel any.
//          Frees a seat → the first waitlisted person is promoted automatically.
// @route   DELETE /api/registrations/:id
const cancelRegistration = async (req, res, next) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const regRes = await client.query('SELECT * FROM registrations WHERE id = $1 FOR UPDATE', [req.params.id]);
        const reg = regRes.rows[0];
        if (!reg) { await client.query('ROLLBACK'); return next(notFound('Registration not found')); }
        if (req.user.role !== 'admin' && reg.user_id !== req.user.id) {
            await client.query('ROLLBACK'); return next(forbidden('You can only cancel your own registration'));
        }
        if (reg.status === 'cancelled') { await client.query('ROLLBACK'); return next(badRequest('Registration already cancelled')); }

        await client.query(`UPDATE registrations SET status = 'cancelled' WHERE id = $1`, [reg.id]);

        let promoted = null;
        if (reg.status === 'registered') {
            const next_ = await client.query(
                `UPDATE registrations SET status = 'registered'
                 WHERE id = (SELECT id FROM registrations WHERE event_id = $1 AND status = 'waitlisted'
                             ORDER BY registered_at ASC LIMIT 1 FOR UPDATE)
                 RETURNING id`,
                [reg.event_id]
            );
            promoted = next_.rows[0]?.id || null;
        }

        await client.query('COMMIT');
        res.json({ message: 'Registration cancelled', id: reg.id, promoted_registration_id: promoted });
    } catch (err) {
        await client.query('ROLLBACK');
        next(err);
    } finally {
        client.release();
    }
};

// Shared query for the admin registrations list + CSV export
const EVENT_REGISTRATIONS_SQL = `
    SELECT
        r.id AS registration_id,
        CASE WHEN r.user_id IS NULL THEN 'prospect' ELSE 'student' END AS attendee_type,
        COALESCE(u.name, r.guest_name) AS name,
        COALESCE(u.email, r.guest_email) AS email,
        COALESCE(u.phone, r.guest_phone) AS phone,
        u.student_id,
        COALESCE(r.program_interest, u.program) AS program,
        r.status,
        r.marketing_consent,
        r.meritto_lead_id,
        r.registered_at,
        a.checked_in_at,
        a.method AS check_in_method
    FROM registrations r
    LEFT JOIN users u ON u.id = r.user_id
    LEFT JOIN attendance a ON a.registration_id = r.id
    WHERE r.event_id = $1
    ORDER BY r.registered_at ASC
`;

// @desc    All registrations for one event incl. attendance (Admin only). ?status= filter optional
// @route   GET /api/events/:id/registrations
const getEventRegistrations = async (req, res, next) => {
    try {
        const result = await pool.query(EVENT_REGISTRATIONS_SQL, [req.params.id]);
        const rows = req.query.status ? result.rows.filter((r) => r.status === req.query.status) : result.rows;
        res.json(rows);
    } catch (err) { next(err); }
};

// @desc    CSV export of an event's registrations/attendance (Admin only)
// @route   GET /api/events/:id/registrations/export
const exportEventRegistrations = async (req, res, next) => {
    try {
        const result = await pool.query(EVENT_REGISTRATIONS_SQL, [req.params.id]);
        if (!result.rows.length) return next(notFound('No registrations to export'));
        const csv = new Parser().parse(result.rows);
        res.header('Content-Type', 'text/csv');
        res.attachment(`event-${req.params.id}-registrations.csv`);
        res.send(csv);
    } catch (err) { next(err); }
};

module.exports = {
    registerForEvent, getMyRegistrations, getTicket, cancelRegistration,
    getEventRegistrations, exportEventRegistrations
};

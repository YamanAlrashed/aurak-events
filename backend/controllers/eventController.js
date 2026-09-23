const pool = require('../db');
const { badRequest, notFound } = require('../utils/errors');

const CATEGORIES = ['marketing', 'workshop', 'open_day', 'fair', 'activity', 'seminar', 'other'];
const STATUSES = ['draft', 'published', 'cancelled', 'completed'];
const EDITABLE = ['title', 'description', 'category', 'location', 'start_time', 'end_time', 'capacity', 'cover_image_url', 'is_public', 'status'];

// Shared SELECT that adds live registration / attendance counts to each event
const EVENT_SELECT = `
    SELECT
        e.*,
        u.name AS created_by_name,
        (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id AND r.status = 'registered')::int AS registered_count,
        (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id AND r.status = 'waitlisted')::int AS waitlist_count,
        (SELECT COUNT(*) FROM attendance a WHERE a.event_id = e.id)::int AS attended_count
    FROM events e
    JOIN users u ON u.id = e.created_by
`;

function withSpots(ev) {
    return { ...ev, spots_left: ev.capacity == null ? null : Math.max(ev.capacity - ev.registered_count, 0) };
}

// @desc    List events. Public/students only see published events.
//          Filters: ?category=&upcoming=true&search=&status= (status only for admins)
// @route   GET /api/events
const getEvents = async (req, res, next) => {
    try {
        const isAdmin = req.user?.role === 'admin';
        const { category, upcoming, search, status } = req.query;

        const where = [];
        const params = [];
        const add = (sql, val) => { params.push(val); where.push(sql.replace('?', `$${params.length}`)); };

        if (!isAdmin) where.push(`e.status IN ('published', 'completed')`);
        else if (status) add('e.status = ?', status);
        if (category) add('e.category = ?', category);
        if (upcoming === 'true') where.push('e.end_time >= NOW()');
        if (search) add('(e.title ILIKE ? OR e.description ILIKE $' + (params.length + 1) + ')', `%${search}%`);

        const sql = `${EVENT_SELECT} ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY e.start_time ASC`;
        const result = await pool.query(sql, params);
        res.json(result.rows.map(withSpots));
    } catch (err) { next(err); }
};

// @desc    Single event with its schedule (sessions)
// @route   GET /api/events/:id
const getEventById = async (req, res, next) => {
    try {
        const result = await pool.query(`${EVENT_SELECT} WHERE e.id = $1`, [req.params.id]);
        const event = result.rows[0];
        if (!event || (event.status === 'draft' && req.user?.role !== 'admin')) return next(notFound('Event not found'));

        const sessions = await pool.query(
            'SELECT * FROM event_sessions WHERE event_id = $1 ORDER BY start_time ASC',
            [req.params.id]
        );

        // If a logged-in student is viewing, tell the frontend whether they're registered
        let my_registration = null;
        if (req.user?.role === 'student') {
            const reg = await pool.query(
                `SELECT r.id, r.status, r.qr_token, a.checked_in_at
                 FROM registrations r LEFT JOIN attendance a ON a.registration_id = r.id
                 WHERE r.event_id = $1 AND r.user_id = $2`,
                [req.params.id, req.user.id]
            );
            my_registration = reg.rows[0] || null;
        }

        res.json({ ...withSpots(event), sessions: sessions.rows, my_registration });
    } catch (err) { next(err); }
};

function validateEventBody(body, partial = false) {
    if (!partial) {
        for (const f of ['title', 'description', 'location', 'start_time', 'end_time']) {
            if (!body[f]) return `${f} is required`;
        }
    }
    if (body.category && !CATEGORIES.includes(body.category)) return `category must be one of: ${CATEGORIES.join(', ')}`;
    if (body.status && !STATUSES.includes(body.status)) return `status must be one of: ${STATUSES.join(', ')}`;
    if (body.start_time && body.end_time && new Date(body.end_time) <= new Date(body.start_time)) return 'end_time must be after start_time';
    if (body.capacity != null && body.capacity !== '' && (!Number.isInteger(Number(body.capacity)) || Number(body.capacity) <= 0)) return 'capacity must be a positive whole number';
    return null;
}

// @desc    Create event (Admin only). Optional "sessions" array creates the schedule in one go.
// @route   POST /api/events
const createEvent = async (req, res, next) => {
    const msg = validateEventBody(req.body);
    if (msg) return next(badRequest(msg));

    const { title, description, category, location, start_time, end_time, capacity, cover_image_url, is_public, status, sessions = [] } = req.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await client.query(
            `INSERT INTO events (title, description, category, location, start_time, end_time, capacity, cover_image_url, is_public, status, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
             RETURNING *`,
            [title, description, category || 'activity', location, start_time, end_time,
             capacity || null, cover_image_url || null, is_public ?? true, status || 'draft', req.user.id]
        );
        const event = result.rows[0];

        for (const s of sessions) {
            await client.query(
                `INSERT INTO event_sessions (event_id, title, speaker, location, start_time, end_time)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [event.id, s.title, s.speaker || null, s.location || null, s.start_time, s.end_time]
            );
        }
        await client.query('COMMIT');
        res.status(201).json(event);
    } catch (err) {
        await client.query('ROLLBACK');
        next(err);
    } finally {
        client.release();
    }
};

// @desc    Update event (Admin only) — send only the fields you want to change
// @route   PUT /api/events/:id
const updateEvent = async (req, res, next) => {
    try {
        const msg = validateEventBody(req.body, true);
        if (msg) return next(badRequest(msg));

        const fields = EDITABLE.filter((f) => req.body[f] !== undefined);
        if (!fields.length) return next(badRequest('No valid fields to update'));

        const sets = fields.map((f, i) => `${f} = $${i + 1}`);
        const values = fields.map((f) => (req.body[f] === '' ? null : req.body[f]));
        values.push(req.params.id);

        const result = await pool.query(
            `UPDATE events SET ${sets.join(', ')}, updated_at = NOW() WHERE id = $${values.length} RETURNING *`,
            values
        );
        if (!result.rows[0]) return next(notFound('Event not found'));
        res.json(result.rows[0]);
    } catch (err) { next(err); }
};

// @desc    Delete event (Admin only) — cascades to sessions, registrations, attendance, photos
// @route   DELETE /api/events/:id
const deleteEvent = async (req, res, next) => {
    try {
        const result = await pool.query('DELETE FROM events WHERE id = $1 RETURNING id', [req.params.id]);
        if (!result.rows[0]) return next(notFound('Event not found'));
        res.json({ message: 'Event deleted', id: result.rows[0].id });
    } catch (err) { next(err); }
};

// @desc    Add a schedule session to an event (Admin only)
// @route   POST /api/events/:id/sessions
const addSession = async (req, res, next) => {
    try {
        const { title, speaker, location, start_time, end_time } = req.body;
        if (!title || !start_time || !end_time) return next(badRequest('title, start_time and end_time are required'));
        const result = await pool.query(
            `INSERT INTO event_sessions (event_id, title, speaker, location, start_time, end_time)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [req.params.id, title, speaker || null, location || null, start_time, end_time]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) { next(err); }
};

// @desc    Remove a schedule session (Admin only)
// @route   DELETE /api/events/:id/sessions/:sessionId
const deleteSession = async (req, res, next) => {
    try {
        const result = await pool.query(
            'DELETE FROM event_sessions WHERE id = $1 AND event_id = $2 RETURNING id',
            [req.params.sessionId, req.params.id]
        );
        if (!result.rows[0]) return next(notFound('Session not found'));
        res.json({ message: 'Session deleted', id: result.rows[0].id });
    } catch (err) { next(err); }
};

module.exports = { getEvents, getEventById, createEvent, updateEvent, deleteEvent, addSession, deleteSession };

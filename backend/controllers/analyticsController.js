const { Parser } = require('json2csv');
const pool = require('../db');

// @desc    Dashboard KPI cards (Admin only)
// @route   GET /api/analytics/summary
const getSummary = async (req, res, next) => {
    try {
        const result = await pool.query(`
            SELECT
                (SELECT COUNT(*) FROM events WHERE status <> 'draft') AS total_events,
                (SELECT COUNT(*) FROM events WHERE status = 'published' AND start_time >= NOW()) AS upcoming_events,
                (SELECT COUNT(*) FROM registrations WHERE status = 'registered') AS total_registrations,
                (SELECT COUNT(*) FROM attendance) AS total_attendance,
                (SELECT COUNT(*) FROM registrations WHERE user_id IS NULL AND status <> 'cancelled') AS prospects_captured,
                (SELECT COUNT(*) FROM registrations WHERE meritto_lead_id IS NOT NULL) AS leads_synced_to_crm,
                (SELECT COUNT(*) FROM crm_sync_jobs WHERE status = 'failed') AS crm_sync_failures,
                (SELECT COUNT(*) FROM photos WHERE status = 'pending') AS photos_pending_review,
                COALESCE((
                    -- attendance rate only over events that already happened
                    SELECT ROUND(COUNT(a.id)::numeric / NULLIF(COUNT(r.id), 0), 4)
                    FROM registrations r
                    JOIN events e ON e.id = r.event_id AND e.start_time < NOW()
                    LEFT JOIN attendance a ON a.registration_id = r.id
                    WHERE r.status = 'registered'
                ), 0) AS attendance_rate
        `);
        const r = result.rows[0];
        res.json({
            totalEvents: Number(r.total_events),
            upcomingEvents: Number(r.upcoming_events),
            totalRegistrations: Number(r.total_registrations),
            totalAttendance: Number(r.total_attendance),
            attendanceRate: Number(r.attendance_rate),
            prospectsCaptured: Number(r.prospects_captured),
            leadsSyncedToCrm: Number(r.leads_synced_to_crm),
            crmSyncFailures: Number(r.crm_sync_failures),
            photosPendingReview: Number(r.photos_pending_review)
        });
    } catch (err) { next(err); }
};

// @desc    Registrations per day for a line chart (Admin only)
// @route   GET /api/analytics/registration-trend?days=30
const getRegistrationTrend = async (req, res, next) => {
    try {
        const days = Math.min(Math.max(Number(req.query.days) || 30, 1), 365);
        const result = await pool.query(`
            SELECT d::date AS date,
                   COUNT(r.id) FILTER (WHERE r.user_id IS NOT NULL) AS students,
                   COUNT(r.id) FILTER (WHERE r.user_id IS NULL) AS prospects
            FROM generate_series(CURRENT_DATE - ($1::int - 1), CURRENT_DATE, INTERVAL '1 day') AS d
            LEFT JOIN registrations r ON r.registered_at::date = d::date AND r.status <> 'cancelled'
            GROUP BY d ORDER BY d ASC
        `, [days]);
        res.json(result.rows.map((r) => ({
            date: r.date.toISOString().split('T')[0],
            students: Number(r.students),
            prospects: Number(r.prospects),
            total: Number(r.students) + Number(r.prospects)
        })));
    } catch (err) { next(err); }
};

const EVENT_PERFORMANCE_SQL = `
    SELECT
        e.id, e.title, e.category, e.start_time, e.status, e.capacity,
        COUNT(r.id) FILTER (WHERE r.status = 'registered') AS registered,
        COUNT(r.id) FILTER (WHERE r.status = 'waitlisted') AS waitlisted,
        COUNT(r.id) FILTER (WHERE r.user_id IS NULL AND r.status <> 'cancelled') AS prospects,
        COUNT(a.id) AS attended,
        COALESCE(ROUND(COUNT(a.id)::numeric / NULLIF(COUNT(r.id) FILTER (WHERE r.status = 'registered'), 0), 4), 0) AS attendance_rate
    FROM events e
    LEFT JOIN registrations r ON r.event_id = e.id
    LEFT JOIN attendance a ON a.registration_id = r.id
    WHERE e.status <> 'draft'
    GROUP BY e.id
    ORDER BY e.start_time DESC
`;

// @desc    Per-event performance table (Admin only)
// @route   GET /api/analytics/events
const getEventPerformance = async (req, res, next) => {
    try {
        const result = await pool.query(EVENT_PERFORMANCE_SQL);
        res.json(result.rows.map((r) => ({
            id: r.id, title: r.title, category: r.category, startTime: r.start_time, status: r.status, capacity: r.capacity,
            registered: Number(r.registered), waitlisted: Number(r.waitlisted), prospects: Number(r.prospects),
            attended: Number(r.attended), attendanceRate: Number(r.attendance_rate)
        })));
    } catch (err) { next(err); }
};

// @desc    Totals grouped by event category — for a bar/pie chart (Admin only)
// @route   GET /api/analytics/categories
const getCategoryBreakdown = async (req, res, next) => {
    try {
        const result = await pool.query(`
            SELECT e.category,
                   COUNT(DISTINCT e.id) AS events,
                   COUNT(r.id) FILTER (WHERE r.status = 'registered') AS registrations,
                   COUNT(a.id) AS attended
            FROM events e
            LEFT JOIN registrations r ON r.event_id = e.id
            LEFT JOIN attendance a ON a.registration_id = r.id
            WHERE e.status <> 'draft'
            GROUP BY e.category ORDER BY registrations DESC
        `);
        res.json(result.rows.map((r) => ({
            category: r.category, events: Number(r.events), registrations: Number(r.registrations), attended: Number(r.attended)
        })));
    } catch (err) { next(err); }
};

// @desc    Which programs prospects are interested in — useful for marketing (Admin only)
// @route   GET /api/analytics/program-interest
const getProgramInterest = async (req, res, next) => {
    try {
        const result = await pool.query(`
            SELECT COALESCE(program_interest, 'Not specified') AS program, COUNT(*) AS prospects
            FROM registrations
            WHERE user_id IS NULL AND status <> 'cancelled'
            GROUP BY 1 ORDER BY prospects DESC
        `);
        res.json(result.rows.map((r) => ({ program: r.program, prospects: Number(r.prospects) })));
    } catch (err) { next(err); }
};

// @desc    CSV export of the per-event performance table (Admin only)
// @route   GET /api/analytics/export
const exportAnalytics = async (req, res, next) => {
    try {
        const result = await pool.query(EVENT_PERFORMANCE_SQL);
        if (!result.rows.length) return res.status(404).json({ error: { message: 'No data available to export', code: 'NOT_FOUND' } });
        const csv = new Parser().parse(result.rows);
        res.header('Content-Type', 'text/csv');
        res.attachment('aurak-events-analytics.csv');
        res.send(csv);
    } catch (err) { next(err); }
};

module.exports = { getSummary, getRegistrationTrend, getEventPerformance, getCategoryBreakdown, getProgramInterest, exportAnalytics };

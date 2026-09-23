const pool = require('../db');
const { runCrmWorkerOnce, getMerittoMode } = require('../services/crmWorker');
const { notFound, badRequest } = require('../utils/errors');

// @desc    List Meritto sync jobs (Admin only) — ?status=pending|synced|failed
// @route   GET /api/crm/jobs
const getJobs = async (req, res, next) => {
    try {
        const result = await pool.query(
            `SELECT j.*, COALESCE(u.name, r.guest_name) AS attendee_name, COALESCE(u.email, r.guest_email) AS attendee_email,
                    e.title AS event_title, r.meritto_lead_id
             FROM crm_sync_jobs j
             JOIN registrations r ON r.id = j.registration_id
             JOIN events e ON e.id = r.event_id
             LEFT JOIN users u ON u.id = r.user_id
             WHERE ($1::text IS NULL OR j.status = $1)
             ORDER BY j.created_at DESC
             LIMIT 200`,
            [req.query.status || null]
        );
        res.json({ mode: getMerittoMode(), jobs: result.rows });
    } catch (err) { next(err); }
};

// @desc    Retry a failed job (Admin only)
// @route   POST /api/crm/jobs/:id/retry
const retryJob = async (req, res, next) => {
    try {
        const result = await pool.query(
            `UPDATE crm_sync_jobs SET status = 'pending', attempts = 0, next_attempt_at = NOW(), updated_at = NOW()
             WHERE id = $1 AND status = 'failed' RETURNING *`,
            [req.params.id]
        );
        if (!result.rows[0]) return next(notFound('Failed job not found'));
        res.json(result.rows[0]);
    } catch (err) { next(err); }
};

// @desc    Process pending jobs right now instead of waiting for the timer (Admin only)
// @route   POST /api/crm/sync-now
const syncNow = async (req, res, next) => {
    try {
        if (getMerittoMode() === 'off') return next(badRequest('Meritto sync is turned off (MERITTO_MODE=off)'));
        const summary = await runCrmWorkerOnce();
        res.json(summary);
    } catch (err) { next(err); }
};

module.exports = { getJobs, retryJob, syncNow };

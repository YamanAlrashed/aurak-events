const pool = require('../db');
const { enqueueCrmJob } = require('../services/crmQueue');
const { badRequest, notFound, conflict } = require('../utils/errors');

// Shared logic for QR and manual check-in
async function checkIn(regWhereSql, regParam, method, req, res, next) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const regRes = await client.query(
            `SELECT r.*, e.title AS event_title, e.status AS event_status,
                    COALESCE(u.name, r.guest_name) AS attendee_name
             FROM registrations r
             JOIN events e ON e.id = r.event_id
             LEFT JOIN users u ON u.id = r.user_id
             WHERE ${regWhereSql}`,
            [regParam]
        );
        const reg = regRes.rows[0];
        if (!reg) { await client.query('ROLLBACK'); return next(notFound('Registration not found — invalid QR code')); }

        // Optional safety check: scanner is set to a specific event
        if (req.body.event_id && Number(req.body.event_id) !== reg.event_id) {
            await client.query('ROLLBACK');
            return next(badRequest(`This ticket is for a different event: "${reg.event_title}"`));
        }
        if (reg.status !== 'registered') {
            await client.query('ROLLBACK');
            return next(badRequest(`Cannot check in — registration is ${reg.status}`));
        }

        const ins = await client.query(
            `INSERT INTO attendance (registration_id, event_id, method, checked_in_by)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (registration_id) DO NOTHING
             RETURNING *`,
            [reg.id, reg.event_id, method, req.user.id]
        );
        if (!ins.rows[0]) {
            await client.query('ROLLBACK');
            return next(conflict(`${reg.attendee_name} is already checked in`));
        }

        // Tell Meritto this prospect attended (only if they consented)
        if (!reg.user_id && reg.marketing_consent) {
            await enqueueCrmJob(client, reg.id, 'log_attendance');
        }

        await client.query('COMMIT');
        res.status(201).json({
            message: `${reg.attendee_name} checked in`,
            attendee_name: reg.attendee_name,
            event_title: reg.event_title,
            attendance: ins.rows[0]
        });
    } catch (err) {
        await client.query('ROLLBACK');
        next(err);
    } finally {
        client.release();
    }
}

// @desc    Check in by scanning the QR code (Admin only)
// @route   POST /api/checkin        body: { qr_token, event_id? }
const checkInByQr = (req, res, next) => {
    if (!req.body.qr_token) return next(badRequest('qr_token is required'));
    return checkIn('r.qr_token = $1', req.body.qr_token, 'qr', req, res, next);
};

// @desc    Manual check-in from the registrations list (Admin only)
// @route   POST /api/checkin/manual  body: { registration_id, event_id? }
const checkInManual = (req, res, next) => {
    if (!req.body.registration_id) return next(badRequest('registration_id is required'));
    return checkIn('r.id = $1', req.body.registration_id, 'manual', req, res, next);
};

// @desc    Undo a check-in (Admin only)
// @route   DELETE /api/checkin/:registrationId
const undoCheckIn = async (req, res, next) => {
    try {
        const result = await pool.query('DELETE FROM attendance WHERE registration_id = $1 RETURNING id', [req.params.registrationId]);
        if (!result.rows[0]) return next(notFound('No check-in found for this registration'));
        res.json({ message: 'Check-in removed', registration_id: Number(req.params.registrationId) });
    } catch (err) { next(err); }
};

module.exports = { checkInByQr, checkInManual, undoCheckIn };

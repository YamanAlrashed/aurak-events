// ─────────────────────────────────────────────────────────────────────────────
// Background worker for the Meritto outbox (crm_sync_jobs table).
// Runs every CRM_WORKER_INTERVAL_MS inside the API process. Registration and
// check-in requests never wait for Meritto — if Meritto is slow or down,
// jobs are retried with exponential backoff and show up in /api/crm/jobs.
// ─────────────────────────────────────────────────────────────────────────────
const pool = require('../db');
const meritto = require('./meritto');

const BATCH_SIZE = 20;
const maxAttempts = () => Number(process.env.CRM_MAX_ATTEMPTS) || 5;
let running = false;

// Everything Meritto needs about one registration
async function loadRegistration(registrationId) {
  const result = await pool.query(
    `SELECT r.id, r.meritto_lead_id, r.marketing_consent, r.program_interest,
            COALESCE(u.name, r.guest_name) AS name,
            COALESCE(u.email, r.guest_email) AS email,
            COALESCE(u.phone, r.guest_phone) AS phone,
            e.title AS event_title, e.category AS event_category, e.start_time AS event_start,
            a.checked_in_at
     FROM registrations r
     JOIN events e ON e.id = r.event_id
     LEFT JOIN users u ON u.id = r.user_id
     LEFT JOIN attendance a ON a.registration_id = r.id
     WHERE r.id = $1`,
    [registrationId]
  );
  return result.rows[0];
}

async function processJob(job) {
  const reg = await loadRegistration(job.registration_id);
  if (!reg) throw Object.assign(new Error('Registration no longer exists'), { retryable: false });
  if (!reg.marketing_consent) throw Object.assign(new Error('No marketing consent — not sent'), { retryable: false });

  const result = job.action === 'log_attendance' ? await meritto.logAttendance(reg) : await meritto.upsertLead(reg);

  if (result.leadId && result.leadId !== reg.meritto_lead_id) {
    await pool.query('UPDATE registrations SET meritto_lead_id = $1 WHERE id = $2', [result.leadId, reg.id]);
  }
  return result.body;
}

async function runCrmWorkerOnce() {
  if (running) return { skipped: true };
  running = true;
  const summary = { processed: 0, synced: 0, failed: 0, retrying: 0 };
  try {
    // Claim a batch atomically (safe even if two servers run the worker)
    const claimed = await pool.query(
      `UPDATE crm_sync_jobs SET status = 'processing', attempts = attempts + 1, updated_at = NOW()
       WHERE id IN (
         SELECT id FROM crm_sync_jobs
         WHERE status = 'pending' AND next_attempt_at <= NOW()
         ORDER BY id LIMIT $1 FOR UPDATE SKIP LOCKED
       )
       RETURNING *`,
      [BATCH_SIZE]
    );

    for (const job of claimed.rows) {
      summary.processed++;
      try {
        const body = await processJob(job);
        await pool.query(
          `UPDATE crm_sync_jobs SET status = 'synced', last_error = NULL, response = $1, updated_at = NOW() WHERE id = $2`,
          [JSON.stringify(body ?? {}), job.id]
        );
        summary.synced++;
      } catch (err) {
        const giveUp = err.retryable === false || job.attempts >= maxAttempts();
        // backoff: 1, 2, 4, 8 ... minutes
        const delayMin = Math.pow(2, job.attempts - 1);
        await pool.query(
          `UPDATE crm_sync_jobs
           SET status = $1, last_error = $2, next_attempt_at = NOW() + ($3 || ' minutes')::interval, updated_at = NOW()
           WHERE id = $4`,
          [giveUp ? 'failed' : 'pending', err.message.slice(0, 1000), String(delayMin), job.id]
        );
        giveUp ? summary.failed++ : summary.retrying++;
      }
    }
  } finally {
    running = false;
  }
  return summary;
}

function startCrmWorker() {
  if (meritto.mode() === 'off') {
    console.log('Meritto sync worker disabled (MERITTO_MODE=off)');
    return;
  }
  const interval = Number(process.env.CRM_WORKER_INTERVAL_MS) || 30000;
  // Jobs stuck in 'processing' (e.g. server crashed mid-send) go back to pending on startup
  pool.query(`UPDATE crm_sync_jobs SET status = 'pending' WHERE status = 'processing'`).catch(() => {});
  setInterval(() => {
    runCrmWorkerOnce().catch((err) => console.error('CRM worker error:', err.message));
  }, interval).unref();
  console.log(`Meritto sync worker running every ${interval / 1000}s (mode: ${meritto.mode()})`);
}

module.exports = { startCrmWorker, runCrmWorkerOnce, getMerittoMode: meritto.mode };

// Adds a Meritto sync job to the outbox table.
// Pass the same DB client used for the registration/check-in so both are saved
// in ONE transaction — a registration can never exist without its sync job.
async function enqueueCrmJob(db, registrationId, action) {
  if (process.env.MERITTO_MODE === 'off') return null;
  const result = await db.query(
    `INSERT INTO crm_sync_jobs (registration_id, action) VALUES ($1, $2) RETURNING id`,
    [registrationId, action]
  );
  return result.rows[0].id;
}

module.exports = { enqueueCrmJob };

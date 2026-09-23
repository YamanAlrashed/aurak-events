const { Pool } = require('pg');
require('dotenv').config({ quiet: true });

// Render / Neon / Supabase need SSL for external connections; local Postgres does not.
// Set DB_SSL=true in .env when using a hosted database.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = pool;

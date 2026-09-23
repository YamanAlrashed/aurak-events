// Creates all tables from db/schema.sql (and optionally loads db/seed.sql).
//   npm run db:init   → schema only
//   npm run db:reset  → schema + sample data
// ⚠️ schema.sql DROPS existing tables first.
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');
const pool = require('../db');

(async () => {
  const dbDir = path.join(__dirname, '..', '..', 'db');
  const files = ['schema.sql'];
  if (process.argv.includes('--seed')) files.push('seed.sql');
  try {
    for (const f of files) {
      await pool.query(fs.readFileSync(path.join(dbDir, f), 'utf8'));
      console.log(`✔ ran db/${f}`);
    }
  } catch (err) {
    console.error('Database init failed:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();

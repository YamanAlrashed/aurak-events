const express = require('express');
const router = express.Router();
const { getJobs, retryJob, syncNow } = require('../controllers/crmController');
const { authenticate, requireAdmin } = require('../middleware/auth');

// Meritto integration monitoring — Admin only
router.get('/jobs', authenticate, requireAdmin, getJobs);
router.post('/jobs/:id/retry', authenticate, requireAdmin, retryJob);
router.post('/sync-now', authenticate, requireAdmin, syncNow);

module.exports = router;

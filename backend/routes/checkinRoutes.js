const express = require('express');
const router = express.Router();
const { checkInByQr, checkInManual, undoCheckIn } = require('../controllers/checkinController');
const { authenticate, requireAdmin } = require('../middleware/auth');

// Check-in is done by staff scanning tickets — Admin only
router.post('/', authenticate, requireAdmin, checkInByQr);
router.post('/manual', authenticate, requireAdmin, checkInManual);
router.delete('/:registrationId', authenticate, requireAdmin, undoCheckIn);

module.exports = router;

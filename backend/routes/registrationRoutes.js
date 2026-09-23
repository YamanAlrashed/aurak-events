const express = require('express');
const router = express.Router();
const { getMyRegistrations, getTicket, cancelRegistration } = require('../controllers/registrationController');
const { authenticate, requireStudent } = require('../middleware/auth');

router.get('/me', authenticate, requireStudent, getMyRegistrations);
router.get('/ticket/:qrToken', getTicket);                 // public: guest ticket page
router.delete('/:id', authenticate, cancelRegistration);   // own registration, or any if admin

module.exports = router;

const express = require('express');
const router = express.Router();
const {
    getSummary, getRegistrationTrend, getEventPerformance, getCategoryBreakdown, getProgramInterest, exportAnalytics
} = require('../controllers/analyticsController');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.get('/summary', authenticate, requireAdmin, getSummary);
router.get('/registration-trend', authenticate, requireAdmin, getRegistrationTrend);
router.get('/events', authenticate, requireAdmin, getEventPerformance);
router.get('/categories', authenticate, requireAdmin, getCategoryBreakdown);
router.get('/program-interest', authenticate, requireAdmin, getProgramInterest);
router.get('/export', authenticate, requireAdmin, exportAnalytics);

module.exports = router;

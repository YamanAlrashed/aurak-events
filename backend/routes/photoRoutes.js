const express = require('express');
const router = express.Router();
const { reviewPhoto, getMyPhotos, deletePhoto } = require('../controllers/photoController');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.get('/me', authenticate, getMyPhotos);
router.put('/:id/review', authenticate, requireAdmin, reviewPhoto);
router.delete('/:id', authenticate, deletePhoto);

module.exports = router;

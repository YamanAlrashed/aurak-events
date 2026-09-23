const express = require('express');
const router = express.Router();
const {
    getEvents, getEventById, createEvent, updateEvent, deleteEvent, addSession, deleteSession
} = require('../controllers/eventController');
const {
    registerForEvent, getEventRegistrations, exportEventRegistrations
} = require('../controllers/registrationController');
const { getEventPhotos, uploadEventPhoto } = require('../controllers/photoController');
const { authenticate, optionalAuth, requireAdmin } = require('../middleware/auth');
const { uploadPhoto } = require('../middleware/upload');

// Public (token optional — admins get extra data when logged in)
router.get('/', optionalAuth, getEvents);
router.get('/:id', optionalAuth, getEventById);

// Admin — event management
router.post('/', authenticate, requireAdmin, createEvent);
router.put('/:id', authenticate, requireAdmin, updateEvent);
router.delete('/:id', authenticate, requireAdmin, deleteEvent);
router.post('/:id/sessions', authenticate, requireAdmin, addSession);
router.delete('/:id/sessions/:sessionId', authenticate, requireAdmin, deleteSession);

// Registration — students (logged in) or prospective students (guest)
router.post('/:id/register', optionalAuth, registerForEvent);

// Admin — registrations & attendance list
router.get('/:id/registrations', authenticate, requireAdmin, getEventRegistrations);
router.get('/:id/registrations/export', authenticate, requireAdmin, exportEventRegistrations);

// Gallery
router.get('/:id/photos', optionalAuth, getEventPhotos);
router.post('/:id/photos', authenticate, uploadPhoto, uploadEventPhoto);

module.exports = router;

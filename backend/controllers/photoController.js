const fs = require('fs');
const path = require('path');
const pool = require('../db');
const { UPLOAD_DIR } = require('../middleware/upload');
const { badRequest, forbidden, notFound } = require('../utils/errors');

// @desc    Approved gallery photos for an event (public).
//          Admins see all photos and can filter with ?status=pending
// @route   GET /api/events/:id/photos
const getEventPhotos = async (req, res, next) => {
    try {
        const isAdmin = req.user?.role === 'admin';
        const status = isAdmin ? (req.query.status || null) : 'approved';
        const result = await pool.query(
            `SELECT p.id, p.event_id, p.file_url, p.caption, p.status, p.created_at,
                    u.name AS uploaded_by_name, p.uploaded_by
             FROM photos p JOIN users u ON u.id = p.uploaded_by
             WHERE p.event_id = $1 AND ($2::text IS NULL OR p.status = $2)
             ORDER BY p.created_at DESC`,
            [req.params.id, status]
        );
        res.json(result.rows);
    } catch (err) { next(err); }
};

// @desc    Upload a photo to an event gallery (any logged-in user).
//          multipart/form-data with field "photo" (+ optional "caption").
//          Admin uploads are auto-approved; student uploads wait for moderation.
// @route   POST /api/events/:id/photos
const uploadEventPhoto = async (req, res, next) => {
    try {
        if (!req.file) return next(badRequest('A photo file is required (form field name: "photo")'));

        const ev = await pool.query('SELECT id, status FROM events WHERE id = $1', [req.params.id]);
        if (!ev.rows[0] || ev.rows[0].status === 'draft') {
            fs.unlink(req.file.path, () => {});
            return next(notFound('Event not found'));
        }

        const isAdmin = req.user.role === 'admin';
        const result = await pool.query(
            `INSERT INTO photos (event_id, uploaded_by, file_url, caption, status, reviewed_by, reviewed_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [req.params.id, req.user.id, `/uploads/${req.file.filename}`, req.body.caption || null,
             isAdmin ? 'approved' : 'pending', isAdmin ? req.user.id : null, isAdmin ? new Date() : null]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        if (req.file) fs.unlink(req.file.path, () => {});
        next(err);
    }
};

// @desc    Approve / reject a photo (Admin only)   body: { status: 'approved' | 'rejected' }
// @route   PUT /api/photos/:id/review
const reviewPhoto = async (req, res, next) => {
    try {
        const { status } = req.body;
        if (!['approved', 'rejected'].includes(status)) return next(badRequest("status must be 'approved' or 'rejected'"));
        const result = await pool.query(
            `UPDATE photos SET status = $1, reviewed_by = $2, reviewed_at = NOW() WHERE id = $3 RETURNING *`,
            [status, req.user.id, req.params.id]
        );
        if (!result.rows[0]) return next(notFound('Photo not found'));
        res.json(result.rows[0]);
    } catch (err) { next(err); }
};

// @desc    Photos uploaded by the logged-in user (shows pending/approved status)
// @route   GET /api/photos/me
const getMyPhotos = async (req, res, next) => {
    try {
        const result = await pool.query(
            `SELECT p.*, e.title AS event_title FROM photos p JOIN events e ON e.id = p.event_id
             WHERE p.uploaded_by = $1 ORDER BY p.created_at DESC`,
            [req.user.id]
        );
        res.json(result.rows);
    } catch (err) { next(err); }
};

// @desc    Delete a photo. Uploader can delete their own; admins can delete any.
// @route   DELETE /api/photos/:id
const deletePhoto = async (req, res, next) => {
    try {
        const found = await pool.query('SELECT * FROM photos WHERE id = $1', [req.params.id]);
        const photo = found.rows[0];
        if (!photo) return next(notFound('Photo not found'));
        if (req.user.role !== 'admin' && photo.uploaded_by !== req.user.id) return next(forbidden('You can only delete your own photos'));

        await pool.query('DELETE FROM photos WHERE id = $1', [photo.id]);
        if (photo.file_url.startsWith('/uploads/')) {
            fs.unlink(path.join(UPLOAD_DIR, path.basename(photo.file_url)), () => {});
        }
        res.json({ message: 'Photo deleted', id: photo.id });
    } catch (err) { next(err); }
};

module.exports = { getEventPhotos, uploadEventPhoto, reviewPhoto, getMyPhotos, deletePhoto };

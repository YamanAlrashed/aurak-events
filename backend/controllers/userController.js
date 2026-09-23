const bcrypt = require('bcrypt');
const pool = require('../db');
const { badRequest, notFound } = require('../utils/errors');

// @desc    List users (Admin only) — optional ?role=student|admin
// @route   GET /api/users
const getUsers = async (req, res, next) => {
    try {
        const { role } = req.query;
        const result = await pool.query(
            `SELECT id, name, email, role, student_id, phone, program, created_at
             FROM users
             WHERE ($1::text IS NULL OR role = $1)
             ORDER BY created_at DESC`,
            [role || null]
        );
        res.json(result.rows);
    } catch (err) { next(err); }
};

// @desc    Create an admin or student account (Admin only)
// @route   POST /api/users
const createUser = async (req, res, next) => {
    try {
        const { name, email, password, role, student_id, phone, program } = req.body;
        if (!name || !email || !password) return next(badRequest('name, email and password are required'));
        if (role && !['admin', 'student'].includes(role)) return next(badRequest('role must be admin or student'));

        const password_hash = await bcrypt.hash(password, 10);
        const result = await pool.query(
            `INSERT INTO users (name, email, password_hash, role, student_id, phone, program)
             VALUES ($1, LOWER($2), $3, $4, $5, $6, $7)
             RETURNING id, name, email, role, student_id, phone, program, created_at`,
            [name, email, password_hash, role || 'student', student_id || null, phone || null, program || null]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') err.friendly = 'Email already exists';
        next(err);
    }
};

// @desc    Delete a user (Admin only)
// @route   DELETE /api/users/:id
const deleteUser = async (req, res, next) => {
    try {
        if (Number(req.params.id) === req.user.id) return next(badRequest('You cannot delete your own account'));
        const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [req.params.id]);
        if (!result.rows[0]) return next(notFound('User not found'));
        res.json({ message: 'User deleted', id: result.rows[0].id });
    } catch (err) {
        if (err.code === '23503') {
            err.statusCode = 400; err.code = 'VALIDATION_ERROR';
            err.message = 'This user created events. Reassign or delete those events first.';
            return next(err);
        }
        next(err);
    }
};

module.exports = { getUsers, createUser, deleteUser };

const bcrypt = require('bcrypt');
const pool = require('../db');
const { signToken } = require('../middleware/auth');
const { badRequest, unauthorized, notFound } = require('../utils/errors');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// @desc    Register a new STUDENT account (admins are created by other admins)
// @route   POST /api/auth/register
const register = async (req, res, next) => {
    try {
        const { name, email, password, student_id, phone, program } = req.body;

        if (!name || !email || !password) return next(badRequest('name, email and password are required'));
        if (!EMAIL_RE.test(email)) return next(badRequest('Invalid email address'));
        if (password.length < 8) return next(badRequest('Password must be at least 8 characters'));

        const password_hash = await bcrypt.hash(password, 10);

        const result = await pool.query(
            `INSERT INTO users (name, email, password_hash, role, student_id, phone, program)
             VALUES ($1, LOWER($2), $3, 'student', $4, $5, $6)
             RETURNING id, name, email, role, student_id, phone, program`,
            [name, email, password_hash, student_id || null, phone || null, program || null]
        );

        const user = result.rows[0];
        res.status(201).json({ user, token: signToken(user) });
    } catch (err) {
        if (err.code === '23505') err.friendly = 'Email already exists';
        next(err);
    }
};

// @desc    Login (students and admins)
// @route   POST /api/auth/login
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return next(badRequest('email and password are required'));

        const result = await pool.query('SELECT * FROM users WHERE email = LOWER($1)', [email]);
        const user = result.rows[0];
        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            return next(unauthorized('Invalid credentials'));
        }

        res.status(200).json({
            user: { id: user.id, name: user.name, email: user.email, role: user.role, student_id: user.student_id, program: user.program },
            token: signToken(user)
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Current logged-in user
// @route   GET /api/auth/me
const me = async (req, res, next) => {
    try {
        const result = await pool.query(
            'SELECT id, name, email, role, student_id, phone, program, created_at FROM users WHERE id = $1',
            [req.user.id]
        );
        if (!result.rows[0]) return next(notFound('User not found'));
        res.json({ user: result.rows[0] });
    } catch (err) {
        next(err);
    }
};

module.exports = { register, login, me };

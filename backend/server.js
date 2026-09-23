require('dotenv').config({ quiet: true });
const express = require('express');
const cors = require('cors');
const path = require('path');
const errorHandler = require('./middleware/errorHandler');
const { startCrmWorker } = require('./services/crmWorker');

const app = express();
app.use(express.json({ limit: '1mb' }));
app.use(cors({
    // Next.js frontend (friend's repo) runs on http://localhost:3000 by default
    origin: (process.env.CLIENT_URL || 'http://localhost:3000').split(','),
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Uploaded gallery photos → http://localhost:5000/uploads/<file>
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health Check
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'API is running' });
});

// --- ROUTE MOUNTING SECTION ---
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/events', require('./routes/eventRoutes'));
app.use('/api/registrations', require('./routes/registrationRoutes'));
app.use('/api/checkin', require('./routes/checkinRoutes'));
app.use('/api/photos', require('./routes/photoRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/crm', require('./routes/crmRoutes'));
// ------------------------------

// 404 for unknown API routes
app.use('/api', (req, res) => {
    res.status(404).json({ error: { message: `Route not found: ${req.method} ${req.originalUrl}`, code: 'NOT_FOUND' } });
});

// Global Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`AURAK Events API running on port ${PORT}`);
        startCrmWorker();
    });
}

module.exports = app;

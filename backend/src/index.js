require('dotenv').config();
const express = require('express');
const cors = require('cors');
const totalHeRoutes = require('./routes/totalh&e');
const jobSelectorRoutes = require('./routes/jobselector');
const shiftDetailsRoutes = require('./routes/shiftdetails');
const periodicTotalsRoutes = require('./routes/periodictotals');
const recentActivitiesRoutes = require('./routes/recentactivities');
const jobStatusRoutes = require('./routes/jobstatusroutes');

const app = express();

// Security headers middleware
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    next();
});

// Middleware
app.use(cors({
    origin: ['http://localhost:8888', 'http://localhost:3001'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'X-User-Id', 'X-User-Password']
}));
app.use(express.json());

// Routes
app.use('/api/stats', totalHeRoutes);
app.use('/api/jobs', jobSelectorRoutes);
app.use('/api/shifts', shiftDetailsRoutes);
app.use('/api/periodic', periodicTotalsRoutes);
app.use('/api/recent', recentActivitiesRoutes);
app.use('/api/status', jobStatusRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Something went wrong!'
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./src/config/db');
const corsOptions = require('./src/config/cors');

// Import Routes
const earningsRoutes = require('./src/routes/earningsRoutes');
const hoursRoutes = require('./src/routes/hoursRoutes');
const activityRoutes = require('./src/routes/activityRoutes');
const entryExitRoutes = require('./src/routes/entryExitRoutes');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(cors(corsOptions));

// Routes
app.use('/api/earnings', earningsRoutes);
app.use('/api/hours', hoursRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/entry-exit', entryExitRoutes);

// Test Database Connection
db.connect(err => {
    if (err) {
        console.error('Database connection failed:', err);
    } else {
        console.log('Connected to MySQL database.');
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something broke!' });
});

// Server Listening
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

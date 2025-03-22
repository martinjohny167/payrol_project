require('dotenv').config();
const express = require('express');
const cors = require('cors');
const corsOptions = require('./config/cors');

// Import routes
const activityRoutes = require('./routes/activityRoutes');
const hoursRoutes = require('./routes/hoursRoutes');
const earningsRoutes = require('./routes/earningsRoutes');

const app = express();

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.use('/activities', activityRoutes);
app.use('/hours', hoursRoutes);
app.use('/earnings', earningsRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 
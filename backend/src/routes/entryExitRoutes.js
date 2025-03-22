const express = require('express');
const router = express.Router();
const entryExitController = require('../controllers/entryExitController');

// Get latest entry and exit times for a user
router.get('/latest/:userId', entryExitController.getLatestTimes);

// Get recent activity for a user
router.get('/recent/:userId', entryExitController.getRecentActivity);

// Get daily stats for a user
router.get('/daily/:userId', entryExitController.getDailyStats);

module.exports = router; 
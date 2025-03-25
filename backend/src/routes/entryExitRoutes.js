const express = require('express');
const router = express.Router();
const entryExitController = require('../controllers/entryExitController');

// Get latest entry and exit times for a user
router.get('/latest/:userId', entryExitController.getLatestTimes);

// Get latest entry and exit times for a user by job
router.get('/latest/:userId/job/:jobId', entryExitController.getLatestTimesByJob);

// Get recent activity for a user
router.get('/recent/:userId', entryExitController.getRecentActivity);

// Get recent activity for a user by job
router.get('/recent/:userId/job/:jobId', entryExitController.getRecentActivityByJob);

// Get daily stats for a user
router.get('/daily/:userId', entryExitController.getDailyStats);

// Get daily stats for a user by job
router.get('/daily/:userId/job/:jobId', entryExitController.getDailyStatsByJob);

module.exports = router; 
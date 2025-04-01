const express = require('express');
const router = express.Router();
const { getJobs } = require('../controllers/jobselector');
const { verifyUser } = require('../middleware/authMiddleware');

// Apply auth middleware to all routes
router.use(verifyUser);

// Get jobs for the user
router.get('/list', getJobs);

module.exports = router; 
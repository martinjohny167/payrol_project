const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');

// Get all jobs
router.get('/', jobController.getAllJobs);

// Get single job by ID
router.get('/:id', jobController.getJobById);

module.exports = router; 
const express = require('express');
const router = express.Router();
const { 
    getTotalHours, 
    getWeeklyHours, 
    getBiWeeklyHours,
    getMonthlyHours,
    getBiWeeklyHoursByJob,
    getMonthlyHoursByJob
} = require('../controllers/hoursController');

// Get hours for all jobs
router.get('/total/:userId', getTotalHours);
router.get('/weekly/:userId', getWeeklyHours);
router.get('/biweekly/:userId', getBiWeeklyHours);
router.get('/monthly/:userId', getMonthlyHours);

// Get hours for a specific job
router.get('/biweekly/:userId/job/:jobId', getBiWeeklyHoursByJob);
router.get('/monthly/:userId/job/:jobId', getMonthlyHoursByJob);

module.exports = router;

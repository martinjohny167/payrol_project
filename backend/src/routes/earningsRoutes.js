const express = require('express');
const router = express.Router();
const { 
    getWeeklyEarnings, 
    getBiWeeklyEarnings,
    getMonthlyEarnings,
    getTotalEarnings, 
    getWeeklyEarningsByJob, 
    getBiWeeklyEarningsByJob,
    getMonthlyEarningsByJob,
    getTotalEarningsByJob 
} = require('../controllers/earningsController');

// Get earnings for all jobs
router.get('/weekly/:userId', getWeeklyEarnings);
router.get('/biweekly/:userId', getBiWeeklyEarnings);
router.get('/monthly/:userId', getMonthlyEarnings);
router.get('/total/:userId', getTotalEarnings);

// Get earnings for a specific job
router.get('/weekly/:userId/job/:jobId', getWeeklyEarningsByJob);
router.get('/biweekly/:userId/job/:jobId', getBiWeeklyEarningsByJob);
router.get('/monthly/:userId/job/:jobId', getMonthlyEarningsByJob);
router.get('/total/:userId/job/:jobId', getTotalEarningsByJob);

module.exports = router;
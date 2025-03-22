const express = require('express');
const router = express.Router();
const { getTotalHours, getWeeklyHours } = require('../controllers/hoursController');

router.get('/total/:userId', getTotalHours);
router.get('/weekly/:userId', getWeeklyHours);

module.exports = router;

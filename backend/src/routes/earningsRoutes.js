const express = require('express');
const router = express.Router();
const { getWeeklyEarnings, getTotalEarnings } = require('../controllers/earningsController');

router.get('/weekly/:userId', getWeeklyEarnings);
router.get('/total/:userId', getTotalEarnings);


module.exports = router;
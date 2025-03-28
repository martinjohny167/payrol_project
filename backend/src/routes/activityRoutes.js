const express = require('express');
const router = express.Router();
const timeEntryController = require('../controllers/activityController');

// Get all time entries
router.get('/', timeEntryController.getAllTimeEntries);

// Get single time entry by ID
router.get('/:id', timeEntryController.getTimeEntryById);

// Create new time entry
router.post('/', timeEntryController.createTimeEntry);

// Update time entry
router.put('/:id', timeEntryController.updateTimeEntry);

// Delete time entry
router.delete('/:id', timeEntryController.deleteTimeEntry);

module.exports = router; 
const db = require('../config/db');

const timeEntryController = {
  // Get all time entries
  getAllTimeEntries: async (req, res) => {
    try {
      const query = 'SELECT * FROM time_entry ORDER BY punch_in_time DESC';
      db.query(query, (err, results) => {
        if (err) {
          console.error('Error fetching time entries:', err);
          return res.status(500).json({ error: 'Failed to fetch time entries' });
        }
        res.json(results);
      });
    } catch (error) {
      console.error('Error in getAllTimeEntries:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Create new time entry
  createTimeEntry: async (req, res) => {
    try {
      const { user_id, job_id, punch_in_time, punch_out_time, hours_after_break } = req.body;
      const query = 'INSERT INTO time_entry (user_id, job_id, punch_in_time, punch_out_time, hours_after_break) VALUES (?, ?, ?, ?, ?)';
      
      db.query(query, [user_id, job_id, punch_in_time, punch_out_time, hours_after_break], (err, results) => {
        if (err) {
          console.error('Error creating time entry:', err);
          return res.status(500).json({ error: 'Failed to create time entry' });
        }
        res.status(201).json({ id: results.insertId, ...req.body });
      });
    } catch (error) {
      console.error('Error in createTimeEntry:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Update time entry
  updateTimeEntry: async (req, res) => {
    try {
      const { id } = req.params;
      const { punch_in_time, punch_out_time, hours_after_break } = req.body;
      const query = 'UPDATE time_entry SET punch_in_time = ?, punch_out_time = ?, hours_after_break = ? WHERE id = ?';
      
      db.query(query, [punch_in_time, punch_out_time, hours_after_break, id], (err, results) => {
        if (err) {
          console.error('Error updating time entry:', err);
          return res.status(500).json({ error: 'Failed to update time entry' });
        }
        if (results.affectedRows === 0) {
          return res.status(404).json({ error: 'Time entry not found' });
        }
        res.json({ id, ...req.body });
      });
    } catch (error) {
      console.error('Error in updateTimeEntry:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Delete time entry
  deleteTimeEntry: async (req, res) => {
    try {
      const { id } = req.params;
      const query = 'DELETE FROM time_entry WHERE id = ?';
      
      db.query(query, [id], (err, results) => {
        if (err) {
          console.error('Error deleting time entry:', err);
          return res.status(500).json({ error: 'Failed to delete time entry' });
        }
        if (results.affectedRows === 0) {
          return res.status(404).json({ error: 'Time entry not found' });
        }
        res.json({ message: 'Time entry deleted successfully' });
      });
    } catch (error) {
      console.error('Error in deleteTimeEntry:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

module.exports = timeEntryController; 
const db = require('../config/db');

const jobController = {
  // Get all jobs
  getAllJobs: async (req, res) => {
    try {
      const query = 'SELECT * FROM job ORDER BY id';
      db.query(query, (err, results) => {
        if (err) {
          console.error('Error fetching jobs:', err);
          return res.status(500).json({ error: 'Failed to fetch jobs' });
        }
        res.json(results);
      });
    } catch (error) {
      console.error('Error in getAllJobs:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Get single job by ID
  getJobById: async (req, res) => {
    try {
      const { id } = req.params;
      const query = 'SELECT * FROM job WHERE id = ?';
      
      db.query(query, [id], (err, results) => {
        if (err) {
          console.error('Error fetching job:', err);
          return res.status(500).json({ error: 'Failed to fetch job' });
        }
        if (results.length === 0) {
          return res.status(404).json({ error: 'Job not found' });
        }
        res.json(results[0]);
      });
    } catch (error) {
      console.error('Error in getJobById:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

module.exports = jobController; 
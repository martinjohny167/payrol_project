const db = require('../config/db');

const entryExitController = {
  // Get latest entry and exit times for a user
  getLatestTimes: async (req, res) => {
    try {
      const { userId } = req.params;
      const query = `
        SELECT 
          punch_in_time as entry_time,
          punch_out_time as exit_time,
          DATE(punch_in_time) as entry_date,
          job_id,
          (SELECT name FROM job WHERE id = time_entry.job_id) as job_name
        FROM time_entry 
        WHERE user_id = ? 
        ORDER BY punch_in_time DESC 
        LIMIT 1
      `;

      db.query(query, [userId], (err, results) => {
        if (err) {
          console.error('Error fetching latest times:', err);
          return res.status(500).json({ error: 'Failed to fetch latest times' });
        }
        res.json(results[0] || {});
      });
    } catch (error) {
      console.error('Error in getLatestTimes:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Get latest entry and exit times for a user by job
  getLatestTimesByJob: async (req, res) => {
    try {
      const { userId, jobId } = req.params;
      const query = `
        SELECT 
          punch_in_time as entry_time,
          punch_out_time as exit_time,
          DATE(punch_in_time) as entry_date,
          job_id,
          (SELECT name FROM job WHERE id = time_entry.job_id) as job_name
        FROM time_entry 
        WHERE user_id = ? AND job_id = ?
        ORDER BY punch_in_time DESC 
        LIMIT 1
      `;

      db.query(query, [userId, jobId], (err, results) => {
        if (err) {
          console.error('Error fetching latest times by job:', err);
          return res.status(500).json({ error: 'Failed to fetch latest times' });
        }
        res.json(results[0] || {});
      });
    } catch (error) {
      console.error('Error in getLatestTimesByJob:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Get recent activity for a user
  getRecentActivity: async (req, res) => {
    try {
      const { userId } = req.params;
      const query = `
        SELECT 
          id,
          punch_in_time as entry_time,
          punch_out_time as exit_time,
          DATE(punch_in_time) as activity_date,
          job_id,
          (SELECT name FROM job WHERE id = time_entry.job_id) as job_name
        FROM time_entry 
        WHERE user_id = ? 
        ORDER BY punch_in_time DESC 
        LIMIT 5
      `;

      db.query(query, [userId], (err, results) => {
        if (err) {
          console.error('Error fetching recent activity:', err);
          return res.status(500).json({ error: 'Failed to fetch recent activity' });
        }
        res.json(results);
      });
    } catch (error) {
      console.error('Error in getRecentActivity:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Get recent activity for a user by job
  getRecentActivityByJob: async (req, res) => {
    try {
      const { userId, jobId } = req.params;
      const query = `
        SELECT 
          id,
          punch_in_time as entry_time,
          punch_out_time as exit_time,
          DATE(punch_in_time) as activity_date,
          job_id,
          (SELECT name FROM job WHERE id = time_entry.job_id) as job_name
        FROM time_entry 
        WHERE user_id = ? AND job_id = ?
        ORDER BY punch_in_time DESC 
        LIMIT 5
      `;

      db.query(query, [userId, jobId], (err, results) => {
        if (err) {
          console.error('Error fetching recent activity by job:', err);
          return res.status(500).json({ error: 'Failed to fetch recent activity' });
        }
        res.json(results);
      });
    } catch (error) {
      console.error('Error in getRecentActivityByJob:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Get daily stats for a user
  getDailyStats: async (req, res) => {
    try {
      const { userId } = req.params;
      const query = `
        SELECT 
          DATE(t.punch_in_time) as date,
          t.job_id,
          (SELECT name FROM job WHERE id = t.job_id) as job_name,
          COUNT(*) as entry_count,
          AVG(t.hours_after_break) as avg_hours,
          MIN(t.punch_in_time) as avg_entry_time,
          MAX(t.punch_out_time) as avg_exit_time,
          SUM(p.pay) as daily_pay
        FROM time_entry t
        LEFT JOIN pay p ON t.id = p.time_entry_id
        WHERE t.user_id = ? 
          AND t.punch_in_time >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        GROUP BY DATE(t.punch_in_time), t.job_id
        ORDER BY date DESC
      `;

      db.query(query, [userId], (err, results) => {
        if (err) {
          console.error('Error fetching daily stats:', err);
          return res.status(500).json({ error: 'Failed to fetch daily stats' });
        }
        res.json(results);
      });
    } catch (error) {
      console.error('Error in getDailyStats:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Get daily stats for a user by job
  getDailyStatsByJob: async (req, res) => {
    try {
      const { userId, jobId } = req.params;
      const query = `
        SELECT 
          DATE(t.punch_in_time) as date,
          t.job_id,
          (SELECT name FROM job WHERE id = t.job_id) as job_name,
          COUNT(*) as entry_count,
          AVG(t.hours_after_break) as avg_hours,
          MIN(t.punch_in_time) as avg_entry_time,
          MAX(t.punch_out_time) as avg_exit_time,
          SUM(p.pay) as daily_pay
        FROM time_entry t
        LEFT JOIN pay p ON t.id = p.time_entry_id
        WHERE t.user_id = ? AND t.job_id = ?
          AND t.punch_in_time >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        GROUP BY DATE(t.punch_in_time), t.job_id
        ORDER BY date DESC
      `;

      db.query(query, [userId, jobId], (err, results) => {
        if (err) {
          console.error('Error fetching daily stats by job:', err);
          return res.status(500).json({ error: 'Failed to fetch daily stats' });
        }
        res.json(results);
      });
    } catch (error) {
      console.error('Error in getDailyStatsByJob:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

module.exports = entryExitController; 
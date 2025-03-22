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
          DATE(punch_in_time) as entry_date
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

  // Get recent activity for a user
  getRecentActivity: async (req, res) => {
    try {
      const { userId } = req.params;
      const query = `
        SELECT 
          id,
          punch_in_time as entry_time,
          punch_out_time as exit_time,
          DATE(punch_in_time) as activity_date
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

  // Get daily stats for a user
  getDailyStats: async (req, res) => {
    try {
      const { userId } = req.params;
      const query = `
        SELECT 
          DATE(punch_in_time) as date,
          COUNT(*) as entry_count,
          AVG(hours_after_break) as avg_hours
        FROM time_entry 
        WHERE user_id = ? 
          AND punch_in_time >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        GROUP BY DATE(punch_in_time)
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
  }
};

module.exports = entryExitController; 
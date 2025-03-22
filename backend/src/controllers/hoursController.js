const db = require('../config/db');

exports.getTotalHours = (req, res) => {
    const userId = req.params.userId;

    const query = `
        SELECT j.id AS job_id, j.name AS job_name, SUM(t.hours_after_break) AS total_hours
        FROM time_entry t
        JOIN job j ON t.job_id = j.id
        WHERE t.user_id = ?
        GROUP BY j.id, j.name;
    `;

    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database query failed' });
        }
        res.json({
            jobs: results.map(job => ({
                job_id: job.job_id,
                job_name: job.job_name,
                total_hours: job.total_hours || 0
            }))
        });
    });
};

exports.getWeeklyHours = (req, res) => {
    const userId = req.params.userId;

    const query = `
        SELECT j.id AS job_id, j.name AS job_name,
               SUM(CASE WHEN DATE(t.punch_in_time) >= CURDATE() - INTERVAL 7 DAY THEN t.hours_after_break ELSE 0 END) AS weekly_hours
        FROM time_entry t
        JOIN job j ON t.job_id = j.id
        WHERE t.user_id = ?
        GROUP BY j.id, j.name;
    `;

    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database query failed' });
        }
        res.json({
            jobs: results.map(job => ({
                job_id: job.job_id,
                job_name: job.job_name,
                weekly_hours: job.weekly_hours || 0
            }))
        });
    });
};

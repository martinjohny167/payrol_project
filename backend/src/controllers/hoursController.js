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

exports.getBiWeeklyHours = (req, res) => {
    const userId = req.params.userId;

    const query = `
        SELECT j.id AS job_id, j.name AS job_name,
               SUM(CASE WHEN DATE(t.punch_in_time) >= CURDATE() - INTERVAL 14 DAY THEN t.hours_after_break ELSE 0 END) AS biweekly_hours
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
                biweekly_hours: job.biweekly_hours || 0
            }))
        });
    });
};

exports.getMonthlyHours = (req, res) => {
    const userId = req.params.userId;

    const query = `
        SELECT j.id AS job_id, j.name AS job_name,
               SUM(CASE WHEN DATE(t.punch_in_time) >= CURDATE() - INTERVAL 30 DAY THEN t.hours_after_break ELSE 0 END) AS monthly_hours
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
                monthly_hours: job.monthly_hours || 0
            }))
        });
    });
};

exports.getBiWeeklyHoursByJob = (req, res) => {
    const userId = req.params.userId;
    const jobId = req.params.jobId;

    const query = `
        SELECT SUM(CASE WHEN DATE(t.punch_in_time) >= CURDATE() - INTERVAL 14 DAY THEN t.hours_after_break ELSE 0 END) AS biweekly_hours
        FROM time_entry t
        WHERE t.user_id = ? AND t.job_id = ?;
    `;

    db.query(query, [userId, jobId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database query failed' });
        }
        res.json({ biweekly_hours: results[0]?.biweekly_hours || 0 });
    });
};

exports.getMonthlyHoursByJob = (req, res) => {
    const userId = req.params.userId;
    const jobId = req.params.jobId;

    const query = `
        SELECT SUM(CASE WHEN DATE(t.punch_in_time) >= CURDATE() - INTERVAL 30 DAY THEN t.hours_after_break ELSE 0 END) AS monthly_hours
        FROM time_entry t
        WHERE t.user_id = ? AND t.job_id = ?;
    `;

    db.query(query, [userId, jobId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database query failed' });
        }
        res.json({ monthly_hours: results[0]?.monthly_hours || 0 });
    });
};

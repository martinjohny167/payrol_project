const db = require('../config/db');

exports.getWeeklyEarnings = (req, res) => {
    const userId = req.params.userId;

    const query = `
        SELECT 
            t.job_id,
            j.name AS job_name,
            SUM(CASE WHEN DATE(t.punch_in_time) >= CURDATE() - INTERVAL 7 DAY THEN p.pay ELSE 0 END) AS weekly_earnings
        FROM time_entry t
        JOIN pay p ON t.id = p.time_entry_id
        JOIN job j ON t.job_id = j.id
        WHERE t.user_id = ?
        GROUP BY t.job_id, j.name;
    `;

    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database query failed' });
        }
        res.json({ jobs: results || [] });
    });
};

exports.getBiWeeklyEarnings = (req, res) => {
    const userId = req.params.userId;

    const query = `
        SELECT 
            t.job_id,
            j.name AS job_name,
            SUM(CASE WHEN DATE(t.punch_in_time) >= CURDATE() - INTERVAL 14 DAY THEN p.pay ELSE 0 END) AS biweekly_earnings
        FROM time_entry t
        JOIN pay p ON t.id = p.time_entry_id
        JOIN job j ON t.job_id = j.id
        WHERE t.user_id = ?
        GROUP BY t.job_id, j.name;
    `;

    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database query failed' });
        }
        res.json({ jobs: results || [] });
    });
};

exports.getMonthlyEarnings = (req, res) => {
    const userId = req.params.userId;

    const query = `
        SELECT 
            t.job_id,
            j.name AS job_name,
            SUM(CASE WHEN DATE(t.punch_in_time) >= CURDATE() - INTERVAL 30 DAY THEN p.pay ELSE 0 END) AS monthly_earnings
        FROM time_entry t
        JOIN pay p ON t.id = p.time_entry_id
        JOIN job j ON t.job_id = j.id
        WHERE t.user_id = ?
        GROUP BY t.job_id, j.name;
    `;

    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database query failed' });
        }
        res.json({ jobs: results || [] });
    });
};

exports.getTotalEarnings = (req, res) => {
    const userId = req.params.userId;

    const query = `
        SELECT 
            t.job_id,
            j.name AS job_name,
            SUM(p.pay) AS total_earnings
        FROM time_entry t
        JOIN pay p ON t.id = p.time_entry_id
        JOIN job j ON t.job_id = j.id
        WHERE t.user_id = ?
        GROUP BY t.job_id, j.name;
    `;

    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database query failed' });
        }
        res.json({ jobs: results || [] });
    });
};

exports.getWeeklyEarningsByJob = (req, res) => {
    const userId = req.params.userId;
    const jobId = req.params.jobId;

    const query = `
        SELECT 
            SUM(CASE WHEN DATE(t.punch_in_time) >= CURDATE() - INTERVAL 7 DAY THEN p.pay ELSE 0 END) AS weekly_earnings
        FROM time_entry t
        JOIN pay p ON t.id = p.time_entry_id
        WHERE t.user_id = ? AND t.job_id = ?;
    `;

    db.query(query, [userId, jobId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database query failed' });
        }
        res.json({ weekly_earnings: results[0]?.weekly_earnings || 0 });
    });
};

exports.getBiWeeklyEarningsByJob = (req, res) => {
    const userId = req.params.userId;
    const jobId = req.params.jobId;

    const query = `
        SELECT 
            SUM(CASE WHEN DATE(t.punch_in_time) >= CURDATE() - INTERVAL 14 DAY THEN p.pay ELSE 0 END) AS biweekly_earnings
        FROM time_entry t
        JOIN pay p ON t.id = p.time_entry_id
        WHERE t.user_id = ? AND t.job_id = ?;
    `;

    db.query(query, [userId, jobId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database query failed' });
        }
        res.json({ biweekly_earnings: results[0]?.biweekly_earnings || 0 });
    });
};

exports.getMonthlyEarningsByJob = (req, res) => {
    const userId = req.params.userId;
    const jobId = req.params.jobId;

    const query = `
        SELECT 
            SUM(CASE WHEN DATE(t.punch_in_time) >= CURDATE() - INTERVAL 30 DAY THEN p.pay ELSE 0 END) AS monthly_earnings
        FROM time_entry t
        JOIN pay p ON t.id = p.time_entry_id
        WHERE t.user_id = ? AND t.job_id = ?;
    `;

    db.query(query, [userId, jobId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database query failed' });
        }
        res.json({ monthly_earnings: results[0]?.monthly_earnings || 0 });
    });
};

exports.getTotalEarningsByJob = (req, res) => {
    const userId = req.params.userId;
    const jobId = req.params.jobId;

    const query = `
        SELECT 
            SUM(p.pay) AS total_earnings
        FROM time_entry t
        JOIN pay p ON t.id = p.time_entry_id
        WHERE t.user_id = ? AND t.job_id = ?;
    `;

    db.query(query, [userId, jobId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database query failed' });
        }
        res.json({ total_earnings: results[0]?.total_earnings || 0 });
    });
};

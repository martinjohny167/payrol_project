const db = require('../config/db');

exports.getWeeklyEarnings = (req, res) => {
    const userId = req.params.userId;

    const query = `
        SELECT SUM(CASE WHEN DATE(t.punch_in_time) >= CURDATE() - INTERVAL 7 DAY THEN p.pay ELSE 0 END) AS weekly_earnings
        FROM time_entry t
        JOIN pay p ON t.id = p.time_entry_id
        WHERE t.user_id = ?;
    `;

    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database query failed' });
        }
        res.json({ weekly_earnings: results[0]?.weekly_earnings || 0 });
    });
};

exports.getTotalEarnings = (req, res) => {
    const userId = req.params.userId;

    const query = `
        SELECT SUM(p.pay) AS total_earned
        FROM time_entry t
        JOIN pay p ON t.id = p.time_entry_id
        WHERE t.user_id = ?;
    `;

    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database query failed' });
        }
        res.json({ total_earned: results[0]?.total_earned || 0 });
    });
};

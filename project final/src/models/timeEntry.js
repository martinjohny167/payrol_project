const db = require('../config/db');

const TimeEntry = {
    getAllEntries: (userId, callback) => {
        db.query('SELECT * FROM time_entry WHERE user_id = ?', [userId], callback);
    },

    getTimeEntryById: (entryId, callback) => {
        db.query('SELECT * FROM time_entry WHERE id = ?', [entryId], callback);
    },

    createTimeEntry: (userId, jobId, punchInTime, punchOutTime, hoursAfterBreak, callback) => {
        db.query(
            'INSERT INTO time_entry (user_id, job_id, punch_in_time, punch_out_time, hours_after_break) VALUES (?, ?, ?, ?, ?)',
            [userId, jobId, punchInTime, punchOutTime, hoursAfterBreak],
            callback
        );
    },

    deleteTimeEntry: (entryId, callback) => {
        db.query('DELETE FROM time_entry WHERE id = ?', [entryId], callback);
    }
};

module.exports = TimeEntry;

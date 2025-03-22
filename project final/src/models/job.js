const db = require('../config/db');

const Job = {
    getAllJobs: (callback) => {
        db.query('SELECT * FROM job', callback);
    },

    getJobById: (jobId, callback) => {
        db.query('SELECT * FROM job WHERE id = ?', [jobId], callback);
    },

    createJob: (name, callback) => {
        db.query('INSERT INTO job (name) VALUES (?)', [name], callback);
    },

    deleteJob: (jobId, callback) => {
        db.query('DELETE FROM job WHERE id = ?', [jobId], callback);
    }
};

module.exports = Job;

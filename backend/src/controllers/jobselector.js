const db = require('../config/db');

const getJobs = async (req, res) => {
    try {
        const userId = req.userId;

        // Get all active jobs for the user
        const [jobs] = await db.query(
            'SELECT job_id, job_title FROM JOBS WHERE user_id = ? AND is_current = 1',
            [userId]
        );

        if (jobs.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No active jobs found'
            });
        }

        // Simplify response to only include job_id and job_title
        res.json({
            success: true,
            data: jobs
        });
    } catch (error) {
        console.error('Error fetching jobs:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

module.exports = {
    getJobs
}; 
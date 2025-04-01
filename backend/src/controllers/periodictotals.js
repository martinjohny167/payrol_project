const db = require('../config/db');

const getAllJobsPeriodicTotals = async (req, res) => {
    try {
        const userId = req.userId;
        const period = req.query.period || 'week'; // Default to weekly

        // Get all active jobs for the user
        const [jobs] = await db.query(
            'SELECT job_id, job_title, is_current FROM JOBS WHERE user_id = ? AND is_current = 1',
            [userId]
        );

        if (jobs.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No active jobs found'
            });
        }

        // If user has only one job, redirect to single job endpoint
        if (jobs.length === 1) {
            req.jobDetails = jobs[0]; // Store job details to avoid another query
            return getPeriodicTotals(req, res);
        }

        // Get periodic totals for each job
        const jobPromises = jobs.map(async (job) => {
            let query = '';
            
            if (period === 'day') {
                // Daily totals
                query = `
                    SELECT 
                        DATE_FORMAT(DATE(start_time), '%Y-%m-%d') as period,
                        SUM(total_hours) as total_hours,
                        SUM(total_earnings) as total_earnings,
                        COUNT(*) as total_shifts
                    FROM SHIFTS 
                    WHERE user_id = ? 
                    AND job_id = ?
                    AND start_time >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
                    GROUP BY DATE(start_time)
                    ORDER BY period DESC
                `;
            } else if (period === 'week') {
                // Weekly totals (calendar weeks - Monday to Sunday)
                query = `
                    SELECT 
                        CONCAT(YEAR(start_time), '-W', WEEK(start_time, 1)) as period,
                        SUM(total_hours) as total_hours,
                        SUM(total_earnings) as total_earnings,
                        COUNT(*) as total_shifts,
                        MIN(DATE(start_time)) as week_start,
                        MAX(DATE(start_time)) as week_end
                    FROM SHIFTS 
                    WHERE user_id = ? 
                    AND job_id = ?
                    AND start_time >= DATE_SUB(CURDATE(), INTERVAL 12 WEEK)
                    GROUP BY YEAR(start_time), WEEK(start_time, 1)
                    ORDER BY YEAR(start_time) DESC, WEEK(start_time, 1) DESC
                `;
            } else if (period === 'biweekly') {
                // Bi-weekly totals (every two weeks)
                query = `
                    SELECT 
                        CONCAT(YEAR(start_time), '-W', FLOOR((WEEK(start_time, 1) + 1) / 2)) as period,
                        SUM(total_hours) as total_hours,
                        SUM(total_earnings) as total_earnings,
                        COUNT(*) as total_shifts,
                        MIN(DATE(start_time)) as period_start,
                        MAX(DATE(start_time)) as period_end
                    FROM SHIFTS 
                    WHERE user_id = ? 
                    AND job_id = ?
                    AND start_time >= DATE_SUB(CURDATE(), INTERVAL 24 WEEK)
                    GROUP BY YEAR(start_time), FLOOR((WEEK(start_time, 1) + 1) / 2)
                    ORDER BY YEAR(start_time) DESC, FLOOR((WEEK(start_time, 1) + 1) / 2) DESC
                `;
            } else if (period === 'month') {
                // Monthly totals (calendar months)
                query = `
                    SELECT 
                        DATE_FORMAT(DATE(start_time), '%Y-%m') as period,
                        SUM(total_hours) as total_hours,
                        SUM(total_earnings) as total_earnings,
                        COUNT(*) as total_shifts,
                        MIN(DATE(start_time)) as month_start,
                        MAX(DATE(start_time)) as month_end
                    FROM SHIFTS 
                    WHERE user_id = ? 
                    AND job_id = ?
                    AND start_time >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
                    GROUP BY YEAR(start_time), MONTH(start_time)
                    ORDER BY YEAR(start_time) DESC, MONTH(start_time) DESC
                `;
            } else if (period === 'year') {
                // Yearly totals
                query = `
                    SELECT 
                        YEAR(start_time) as period,
                        SUM(total_hours) as total_hours,
                        SUM(total_earnings) as total_earnings,
                        COUNT(*) as total_shifts,
                        MIN(DATE(start_time)) as year_start,
                        MAX(DATE(start_time)) as year_end
                    FROM SHIFTS 
                    WHERE user_id = ? 
                    AND job_id = ?
                    AND start_time >= DATE_SUB(CURDATE(), INTERVAL 5 YEAR)
                    GROUP BY YEAR(start_time)
                    ORDER BY period DESC
                `;
            }

            const [totals] = await db.query(query, [userId, job.job_id]);

            // Calculate summary totals for this job
            const jobTotals = totals.reduce((acc, entry) => {
                acc.total_hours += parseFloat(entry.total_hours || 0);
                acc.total_earnings += parseFloat(entry.total_earnings || 0);
                acc.total_shifts += parseInt(entry.total_shifts || 0);
                return acc;
            }, { total_hours: 0, total_earnings: 0, total_shifts: 0 });

            return {
                job_id: job.job_id,
                job_title: job.job_title,
                is_active: job.is_current === 1,
                summary: {
                    total_hours: parseFloat(jobTotals.total_hours.toFixed(2)),
                    total_earnings: parseFloat(jobTotals.total_earnings.toFixed(2)),
                    total_shifts: jobTotals.total_shifts
                },
                periodic_totals: totals.map(entry => ({
                    period: entry.period,
                    period_start: entry.week_start || entry.month_start || entry.year_start || entry.period_start,
                    period_end: entry.week_end || entry.month_end || entry.year_end || entry.period_end,
                    total_hours: parseFloat(entry.total_hours || 0),
                    total_earnings: parseFloat(entry.total_earnings || 0),
                    total_shifts: parseInt(entry.total_shifts || 0)
                }))
            };
        });

        const jobsTotals = await Promise.all(jobPromises);

        // Calculate overall totals
        const overallTotals = jobsTotals.reduce((acc, job) => {
            acc.total_hours += job.summary.total_hours;
            acc.total_earnings += job.summary.total_earnings;
            acc.total_shifts += job.summary.total_shifts;
            return acc;
        }, { total_hours: 0, total_earnings: 0, total_shifts: 0 });

        // Get the date ranges based on the period type
        let periodStart, periodEnd = new Date().toISOString().split('T')[0];
        
        switch(period) {
            case 'day':
                periodStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                break;
            case 'week':
                periodStart = new Date(Date.now() - 12 * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                break;
            case 'biweekly':
                periodStart = new Date(Date.now() - 24 * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                break;
            case 'month':
                periodStart = new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                break;
            case 'year':
                periodStart = new Date(Date.now() - 5 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                break;
            default:
                periodStart = new Date(Date.now() - 12 * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        }

        res.json({
            success: true,
            data: {
                period_type: period,
                period_start: periodStart,
                period_end: periodEnd,
                jobs: jobsTotals,
                overall_summary: {
                    total_jobs: jobs.length,
                    total_hours: parseFloat(overallTotals.total_hours.toFixed(2)),
                    total_earnings: parseFloat(overallTotals.total_earnings.toFixed(2)),
                    total_shifts: overallTotals.total_shifts
                }
            }
        });
    } catch (error) {
        console.error('Error fetching all jobs periodic totals:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const getPeriodicTotals = async (req, res) => {
    try {
        const userId = req.userId;
        let jobId = req.params.jobId;
        const period = req.query.period || 'week'; // Default to weekly

        // If no job ID provided, check if user has only one job
        if (!jobId) {
            const [jobs] = await db.query(
                'SELECT job_id, job_title, is_current FROM JOBS WHERE user_id = ? AND is_current = 1',
                [userId]
            );

            if (jobs.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'No active jobs found'
                });
            }

            if (jobs.length === 1) {
                jobId = jobs[0].job_id;
                req.singleJobUser = true; // Flag to indicate this is a single-job user
                req.jobDetails = jobs[0]; // Store job details to avoid another query
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'Job ID is required as you have multiple jobs'
                });
            }
        }

        // Get job details if not already fetched
        let jobDetails;
        if (req.singleJobUser) {
            jobDetails = req.jobDetails;
        } else {
            const [details] = await db.query(
                'SELECT job_title, is_current FROM JOBS WHERE job_id = ? AND user_id = ?',
                [jobId, userId]
            );
            jobDetails = details[0];
        }

        // Build query based on period type
        let query = '';
        
        if (period === 'day') {
            // Daily totals
            query = `
                SELECT 
                    DATE_FORMAT(DATE(start_time), '%Y-%m-%d') as period,
                    SUM(total_hours) as total_hours,
                    SUM(total_earnings) as total_earnings,
                    COUNT(*) as total_shifts
                FROM SHIFTS 
                WHERE user_id = ? 
                AND job_id = ?
                AND start_time >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
                GROUP BY DATE(start_time)
                ORDER BY period DESC
            `;
        } else if (period === 'week') {
            // Weekly totals (calendar weeks - Monday to Sunday)
            query = `
                SELECT 
                    CONCAT(YEAR(start_time), '-W', WEEK(start_time, 1)) as period,
                    SUM(total_hours) as total_hours,
                    SUM(total_earnings) as total_earnings,
                    COUNT(*) as total_shifts,
                    MIN(DATE(start_time)) as week_start,
                    MAX(DATE(start_time)) as week_end
                FROM SHIFTS 
                WHERE user_id = ? 
                AND job_id = ?
                AND start_time >= DATE_SUB(CURDATE(), INTERVAL 12 WEEK)
                GROUP BY YEAR(start_time), WEEK(start_time, 1)
                ORDER BY YEAR(start_time) DESC, WEEK(start_time, 1) DESC
            `;
        } else if (period === 'biweekly') {
            // Bi-weekly totals (every two weeks)
            query = `
                SELECT 
                    CONCAT(YEAR(start_time), '-W', FLOOR((WEEK(start_time, 1) + 1) / 2)) as period,
                    SUM(total_hours) as total_hours,
                    SUM(total_earnings) as total_earnings,
                    COUNT(*) as total_shifts,
                    MIN(DATE(start_time)) as period_start,
                    MAX(DATE(start_time)) as period_end
                FROM SHIFTS 
                WHERE user_id = ? 
                AND job_id = ?
                AND start_time >= DATE_SUB(CURDATE(), INTERVAL 24 WEEK)
                GROUP BY YEAR(start_time), FLOOR((WEEK(start_time, 1) + 1) / 2)
                ORDER BY YEAR(start_time) DESC, FLOOR((WEEK(start_time, 1) + 1) / 2) DESC
            `;
        } else if (period === 'month') {
            // Monthly totals (calendar months)
            query = `
                SELECT 
                    DATE_FORMAT(DATE(start_time), '%Y-%m') as period,
                    SUM(total_hours) as total_hours,
                    SUM(total_earnings) as total_earnings,
                    COUNT(*) as total_shifts,
                    MIN(DATE(start_time)) as month_start,
                    MAX(DATE(start_time)) as month_end
                FROM SHIFTS 
                WHERE user_id = ? 
                AND job_id = ?
                AND start_time >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
                GROUP BY YEAR(start_time), MONTH(start_time)
                ORDER BY YEAR(start_time) DESC, MONTH(start_time) DESC
            `;
        } else if (period === 'year') {
            // Yearly totals
            query = `
                SELECT 
                    YEAR(start_time) as period,
                    SUM(total_hours) as total_hours,
                    SUM(total_earnings) as total_earnings,
                    COUNT(*) as total_shifts,
                    MIN(DATE(start_time)) as year_start,
                    MAX(DATE(start_time)) as year_end
                FROM SHIFTS 
                WHERE user_id = ? 
                AND job_id = ?
                AND start_time >= DATE_SUB(CURDATE(), INTERVAL 5 YEAR)
                GROUP BY YEAR(start_time)
                ORDER BY period DESC
            `;
        }

        const [totals] = await db.query(query, [userId, jobId]);

        // Calculate summary totals
        const totalStats = totals.reduce((acc, entry) => {
            acc.total_hours += parseFloat(entry.total_hours || 0);
            acc.total_earnings += parseFloat(entry.total_earnings || 0);
            acc.total_shifts += parseInt(entry.total_shifts || 0);
            return acc;
        }, { total_hours: 0, total_earnings: 0, total_shifts: 0 });

        // Get the date ranges based on the period type
        let periodStart, periodEnd = new Date().toISOString().split('T')[0];
        
        switch(period) {
            case 'day':
                periodStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                break;
            case 'week':
                periodStart = new Date(Date.now() - 12 * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                break;
            case 'biweekly':
                periodStart = new Date(Date.now() - 24 * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                break;
            case 'month':
                periodStart = new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                break;
            case 'year':
                periodStart = new Date(Date.now() - 5 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                break;
            default:
                periodStart = new Date(Date.now() - 12 * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        }

        res.json({
            success: true,
            data: {
                job_id: parseInt(jobId),
                job_title: jobDetails.job_title,
                is_active: jobDetails.is_current === 1,
                period_type: period,
                period_start: periodStart,
                period_end: periodEnd,
                summary: {
                    total_hours: parseFloat(totalStats.total_hours.toFixed(2)),
                    total_earnings: parseFloat(totalStats.total_earnings.toFixed(2)),
                    total_shifts: totalStats.total_shifts
                },
                periodic_totals: totals.map(entry => ({
                    period: entry.period,
                    period_start: entry.week_start || entry.month_start || entry.year_start || entry.period_start,
                    period_end: entry.week_end || entry.month_end || entry.year_end || entry.period_end,
                    total_hours: parseFloat(entry.total_hours || 0),
                    total_earnings: parseFloat(entry.total_earnings || 0),
                    total_shifts: parseInt(entry.total_shifts || 0)
                }))
            }
        });
    } catch (error) {
        console.error('Error fetching periodic totals:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

module.exports = {
    getPeriodicTotals,
    getAllJobsPeriodicTotals
}; 
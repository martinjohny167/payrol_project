'use client';

import { useState, useEffect } from 'react';
import { format, subDays } from 'date-fns';
import { api, type EntryExit, type DailyStat, type Job } from '../app/api/apiClient';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend 
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface EntryExitDashboardProps {
  selectedJobId: number | null;
}

export default function EntryExitDashboard({ selectedJobId }: EntryExitDashboardProps) {
  const [latestActivity, setLatestActivity] = useState<EntryExit | null>(null);
  const [dailyStats, setDailyStats] = useState<DailyStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);

  // Hardcoded user ID for demonstration
  const userId = 4;

  // Fetch jobs first to use job names later
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await api.jobs.getAll();
        setJobs(response.data);
      } catch (err) {
        console.error('Error fetching jobs:', err);
      }
    };

    fetchJobs();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      if (selectedJobId === null) {
        // For "All Jobs" view, get all data and combine
        const jobsResponse = await api.jobs.getAll();
        const allJobs = jobsResponse.data;
        
        // Get data for all jobs
        const allJobsPromises = allJobs.map(job => 
          Promise.all([
            api.entryExit.getLatestByJob(userId, job.id),
            api.entryExit.getDailyStatsByJob(userId, job.id)
          ])
        );
        
        const jobsData = await Promise.all(allJobsPromises);
        
        // Find the latest activity across all jobs
        let latestEntryExit: EntryExit | null = null;
        let latestDate = new Date(0);
        
        // Combine daily stats from all jobs
        let allDailyStats: DailyStat[] = [];
        
        jobsData.forEach(([activityRes, statsRes], index) => {
          const jobActivity = activityRes.data;
          const jobStats = statsRes.data || [];
          
          // Add job stats to combined stats
          allDailyStats = [...allDailyStats, ...jobStats];
          
          // Check if this job has the latest activity
          if (jobActivity && jobActivity.entry_time) {
            const entryDate = new Date(jobActivity.entry_time);
            if (entryDate > latestDate) {
              latestDate = entryDate;
              latestEntryExit = jobActivity;
            }
          }
        });
        
        // Sort stats by date (newest first)
        allDailyStats.sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        
        setLatestActivity(latestEntryExit);
        setDailyStats(allDailyStats);
      } else {
        // Use job-specific endpoints
        const [activityRes, statsRes] = await Promise.all([
          api.entryExit.getLatestByJob(userId, selectedJobId),
          api.entryExit.getDailyStatsByJob(userId, selectedJobId)
        ]);

        setLatestActivity(activityRes.data || null);
        setDailyStats(statsRes.data || []);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching entry/exit data:', err);
      setError('Failed to load entry/exit data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Refresh data every minute
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [selectedJobId]);

  // Get job name by ID
  const getJobName = (jobId: number): string => {
    const job = jobs.find(j => j.id === jobId);
    return job?.name || 'Unknown Job';
  };
  
  // Prepare chart data from daily stats
  const prepareChartData = () => {
    // Sort stats by date (oldest first for the chart)
    const sortedStats = [...dailyStats].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    // Limit to last 7 days worth of data
    const recentStats = sortedStats.slice(-7);
    
    // If we have multiple jobs in total view, prepare data differently
    if (selectedJobId === null) {
      // Group by date first
      const dateGroups: {[key: string]: {[key: number]: number}} = {};
      
      recentStats.forEach(stat => {
        const dateKey = format(new Date(stat.date), 'MM/dd');
        if (!dateGroups[dateKey]) {
          dateGroups[dateKey] = {};
        }
        dateGroups[dateKey][stat.job_id] = stat.avg_hours;
      });
      
      // Prepare datasets for each job
      const jobsInStats = Array.from(new Set(recentStats.map(stat => stat.job_id)));
      const jobDatasets = jobsInStats.map((jobId, index) => {
        const jobName = getJobName(jobId);
        // Pick colors for different jobs
        const colors = [
          'rgba(54, 162, 235, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(255, 159, 64, 0.6)',
          'rgba(255, 99, 132, 0.6)',
        ];
        
        return {
          label: jobName,
          data: Object.keys(dateGroups).map(date => dateGroups[date][jobId] || 0),
          backgroundColor: colors[index % colors.length],
        }
      });
      
      return {
        labels: Object.keys(dateGroups),
        datasets: jobDatasets,
      };
    } else {
      // Single job view is simpler
      return {
        labels: recentStats.map(stat => format(new Date(stat.date), 'MM/dd')),
        datasets: [
          {
            label: 'Hours Worked',
            data: recentStats.map(stat => stat.avg_hours),
            backgroundColor: 'rgba(54, 162, 235, 0.6)',
          },
        ],
      };
    }
  };
  
  // Chart options
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Hours Worked By Day',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Hours',
        }
      },
      x: {
        title: {
          display: true,
          text: 'Date',
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse bg-white rounded-lg shadow-sm p-6">
        <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
        <div className="h-32 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-6 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Entry/Exit Times</h2>
      
      {latestActivity ? (
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Latest Activity</h3>
          <div className="bg-blue-50 p-4 rounded-lg">
            {selectedJobId === null && (
              <p className="text-sm font-medium text-blue-600">
                {getJobName(latestActivity.job_id)}
              </p>
            )}
            <p className="text-sm text-gray-600">
              Entry: {format(new Date(latestActivity.entry_time), 'MMM d, h:mm a')}
            </p>
            {latestActivity.exit_time && (
              <p className="text-sm text-gray-600">
                Exit: {format(new Date(latestActivity.exit_time), 'MMM d, h:mm a')}
              </p>
            )}
          </div>
        </div>
      ) : (
        <p className="text-gray-500 mb-8">
          {selectedJobId === null ? 'No recent activity' : 'No recent activity for this job'}
        </p>
      )}

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Daily Statistics</h3>
        {dailyStats.length > 0 ? (
          <div className="h-64">
            <Bar data={prepareChartData()} options={chartOptions} />
          </div>
        ) : (
          <p className="text-gray-500">
            {selectedJobId === null ? 'No statistics available' : 'No statistics available for this job'}
          </p>
        )}
      </div>
    </div>
  );
} 
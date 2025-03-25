'use client';

import { useState, useEffect, useRef } from 'react';
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

interface DetailedDayStat {
  date: string;
  formattedDate: string;
  jobId: number;
  jobName: string;
  hours: number;
  entryTime: string;
  exitTime: string;
  earnings: number;
}

export default function EntryExitDashboard({ selectedJobId }: EntryExitDashboardProps) {
  const [latestActivity, setLatestActivity] = useState<EntryExit | null>(null);
  const [dailyStats, setDailyStats] = useState<DailyStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedDay, setSelectedDay] = useState<DetailedDayStat | null>(null);
  const [timeRangeFilter, setTimeRangeFilter] = useState<'weekly' | 'monthly'>('weekly');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Hardcoded user ID for demonstration
  const userId = 4;

  // Clear any existing timer when component unmounts
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

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
      // Clear selected day when data changes
      clearSelectedDay();
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
  
  // Calculate days to show based on time range filter
  const getDaysToShow = (): number => {
    return timeRangeFilter === 'weekly' ? 7 : 30;
  };
  
  // Format time for display
  const formatTime = (timeString: string): string => {
    try {
      return format(new Date(timeString), 'h:mm a');
    } catch (e) {
      return 'N/A';
    }
  };
  
  // Clear the selected day and any existing timer
  const clearSelectedDay = () => {
    setSelectedDay(null);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };
  
  // Handle chart click
  const handleChartClick = (event: any, elements: any[]) => {
    // Clear any existing timeout first
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    
    if (elements.length === 0) {
      clearSelectedDay();
      return;
    }
    
    const clickedIndex = elements[0].index;
    const clickedDatasetIndex = elements[0].datasetIndex;
    
    // Different logic for all jobs vs single job
    if (selectedJobId === null) {
      // All jobs view - get the job from the dataset
      const sortedStats = [...dailyStats].sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      
      const recentStats = sortedStats.slice(-getDaysToShow());
      const labels = Array.from(new Set(recentStats.map(stat => 
        format(new Date(stat.date), 'MM/dd')
      ))).sort();
      
      const dateLabel = labels[clickedIndex];
      const jobsInStats = Array.from(new Set(recentStats.map(stat => stat.job_id)));
      const jobId = jobsInStats[clickedDatasetIndex];
      
      // Find matching stat
      const matchingStat = recentStats.find(stat => 
        format(new Date(stat.date), 'MM/dd') === dateLabel && 
        stat.job_id === jobId
      );
      
      if (matchingStat) {
        setSelectedDay({
          date: matchingStat.date,
          formattedDate: format(new Date(matchingStat.date), 'MMMM d, yyyy'),
          jobId: matchingStat.job_id,
          jobName: getJobName(matchingStat.job_id),
          hours: matchingStat.avg_hours,
          entryTime: matchingStat.avg_entry_time,
          exitTime: matchingStat.avg_exit_time,
          earnings: matchingStat.daily_pay
        });
        
        // Set a timeout to clear the selected day after 5 seconds
        timerRef.current = setTimeout(() => {
          setSelectedDay(null);
          timerRef.current = null;
        }, 5000);
      }
    } else {
      // Single job view
      const sortedStats = [...dailyStats]
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(-getDaysToShow());
      
      if (sortedStats[clickedIndex]) {
        const stat = sortedStats[clickedIndex];
        setSelectedDay({
          date: stat.date,
          formattedDate: format(new Date(stat.date), 'MMMM d, yyyy'),
          jobId: stat.job_id,
          jobName: getJobName(stat.job_id),
          hours: stat.avg_hours,
          entryTime: stat.avg_entry_time,
          exitTime: stat.avg_exit_time,
          earnings: stat.daily_pay
        });
        
        // Set a timeout to clear the selected day after 5 seconds
        timerRef.current = setTimeout(() => {
          setSelectedDay(null);
          timerRef.current = null;
        }, 5000);
      }
    }
  };
  
  // Prepare chart data from daily stats
  const prepareChartData = () => {
    // Sort stats by date (oldest first for the chart)
    const sortedStats = [...dailyStats].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    // Limit to days specified by the time range filter
    const recentStats = sortedStats.slice(-getDaysToShow());
    
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
    onClick: handleChartClick,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Hours per Day',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Hours',
        },
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          callback: (value: number) => `${value}h`
        }
      },
      x: {
        title: {
          display: false,
        },
        grid: {
          display: false
        }
      }
    }
  };
  
  // Calculate total stats for the selected time range
  const calculateTotalStats = () => {
    const sortedStats = [...dailyStats].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    const recentStats = sortedStats.slice(-getDaysToShow());
    
    if (recentStats.length === 0) return { totalHours: 0, totalEarnings: 0, daysWorked: 0 };
    
    // If total view, we need to be careful not to double count days
    if (selectedJobId === null) {
      // Group by date to avoid double counting
      const dateGroups: {[key: string]: {hours: number, earnings: number}} = {};
      
      recentStats.forEach(stat => {
        const dateKey = format(new Date(stat.date), 'MM/dd');
        if (!dateGroups[dateKey]) {
          dateGroups[dateKey] = { hours: 0, earnings: 0 };
        }
        // Add hours and earnings for this day/job
        dateGroups[dateKey].hours += stat.avg_hours;
        dateGroups[dateKey].earnings += stat.daily_pay;
      });
      
      const daysWorked = Object.keys(dateGroups).length;
      const totalHours = Object.values(dateGroups).reduce((sum, day) => sum + day.hours, 0);
      const totalEarnings = Object.values(dateGroups).reduce((sum, day) => sum + day.earnings, 0);
      const avgHoursPerDay = daysWorked > 0 ? totalHours / daysWorked : 0;
      
      return { 
        totalHours, 
        totalEarnings, 
        daysWorked,
        avgHoursPerDay
      };
    } else {
      // Single job is simpler
      const daysWorked = recentStats.length;
      const totalHours = recentStats.reduce((sum, stat) => sum + stat.avg_hours, 0);
      const totalEarnings = recentStats.reduce((sum, stat) => sum + stat.daily_pay, 0);
      const avgHoursPerDay = daysWorked > 0 ? totalHours / daysWorked : 0;
      
      return { 
        totalHours, 
        totalEarnings, 
        daysWorked,
        avgHoursPerDay
      };
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
  
  const { totalHours, totalEarnings, daysWorked, avgHoursPerDay } = calculateTotalStats();

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Hours per Day</h2>
        <div className="relative">
          <select
            value={timeRangeFilter}
            onChange={(e) => setTimeRangeFilter(e.target.value as 'weekly' | 'monthly')}
            className="block appearance-none bg-white border border-gray-300 hover:border-gray-400 px-4 py-2 pr-8 rounded shadow leading-tight focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
            </svg>
          </div>
        </div>
      </div>
      
      {dailyStats.length > 0 ? (
        <>
          <div className="mb-6">
            <div className="h-64">
              <Bar data={prepareChartData()} options={chartOptions} />
            </div>
          </div>
          
          {selectedDay ? (
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-medium text-gray-900">
                  {selectedDay.formattedDate}
                </h3>
                <button 
                  onClick={clearSelectedDay}
                  className="text-gray-500 hover:text-gray-700"
                  aria-label="Close"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              
              {selectedJobId === null && (
                <p className="text-sm font-medium text-blue-600 mb-2">
                  {selectedDay.jobName}
                </p>
              )}
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Hours Worked</p>
                  <p className="text-lg font-semibold text-gray-900">{selectedDay.hours.toFixed(1)}h</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Entry Time</p>
                  <p className="text-lg font-semibold text-gray-900">{formatTime(selectedDay.entryTime)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Exit Time</p>
                  <p className="text-lg font-semibold text-gray-900">{formatTime(selectedDay.exitTime)}</p>
                </div>
              </div>
              
              <div className="mt-3 pt-3 border-t border-blue-100">
                <p className="text-xs text-gray-500">Earnings</p>
                <p className="text-lg font-semibold text-green-600">${selectedDay.earnings.toFixed(2)}</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500 mb-1">Daily Average</h3>
                <p className="text-2xl font-bold text-gray-900">{avgHoursPerDay.toFixed(1)}h</p>
                <p className="text-xs text-green-500 mt-1">{daysWorked} days worked</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500 mb-1">{timeRangeFilter === 'weekly' ? 'Weekly' : 'Monthly'} Hours</h3>
                <p className="text-2xl font-bold text-gray-900">{totalHours.toFixed(1)}h</p>
                <p className="text-xs text-green-500 mt-1">This {timeRangeFilter === 'weekly' ? 'week' : 'month'}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500 mb-1">{timeRangeFilter === 'weekly' ? 'Weekly' : 'Monthly'} Earned</h3>
                <p className="text-2xl font-bold text-green-600">${totalEarnings.toFixed(2)}</p>
                <p className="text-xs text-green-500 mt-1">{totalHours.toFixed(1)}h total</p>
              </div>
            </div>
          )}
        </>
      ) : (
        <p className="text-gray-500">
          {selectedJobId === null ? 'No statistics available' : 'No statistics available for this job'}
        </p>
      )}
    </div>
  );
} 
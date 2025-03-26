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
  const [timeRangeFilter] = useState<'weekly' | 'monthly'>('weekly');
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [isFlipping, setIsFlipping] = useState(false);
  const prevJobIdRef = useRef<number | null>(null);
  const [filteredJobId, setFilteredJobId] = useState<number | null>(null);
  const [isCardFlipping, setIsCardFlipping] = useState(false);
  const [activeCardIndex, setActiveCardIndex] = useState<number | null>(null);

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

  // Track job changes for animation
  useEffect(() => {
    if (prevJobIdRef.current !== selectedJobId && prevJobIdRef.current !== undefined) {
      // Trigger flip animation
      setIsFlipping(true);
      
      // Reset flip state after animation completes
      const timer = setTimeout(() => {
        setIsFlipping(false);
      }, 600); // Animation duration
      
      return () => clearTimeout(timer);
    }
    
    prevJobIdRef.current = selectedJobId;
  }, [selectedJobId]);

  // Auto-reset filtered job after 10 seconds
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    
    if (filteredJobId !== null) {
      timer = setTimeout(() => {
        setIsFlipping(true);
        setFilteredJobId(null);
        
        setTimeout(() => {
          setIsFlipping(false);
        }, 600);
      }, 10000);
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [filteredJobId]);

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
  
  // Define colors for different jobs
  const jobColors = [
    'rgba(66, 133, 244, 0.85)',  // Blue
    'rgba(219, 68, 55, 0.85)',   // Red
    'rgba(15, 157, 88, 0.85)',   // Green
    'rgba(244, 180, 0, 0.85)',   // Yellow
    'rgba(171, 71, 188, 0.85)',  // Purple
  ];
  
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
    setActiveCardIndex(null);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
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
    
    // Generate a full set of day labels
    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    // If we have multiple jobs in total view, show stacked bars
    if (selectedJobId === null) {
      // Group by date and job
      const dateJobGroups: {[key: string]: {[key: number]: number}} = {};
      
      // Initialize all days with empty data
      dayLabels.forEach(day => {
        dateJobGroups[day] = {};
      });
      
      // Fill in actual data
      recentStats.forEach(stat => {
        const dateKey = format(new Date(stat.date), 'EEE'); // Use short day name like "Mon"
        if (!dateJobGroups[dateKey]) {
          dateJobGroups[dateKey] = {};
        }
        dateJobGroups[dateKey][stat.job_id] = stat.avg_hours;
      });
      
      // Get all unique job IDs
      const jobsInStats = Array.from(new Set(recentStats.map(stat => stat.job_id)));
      
      // Create a dataset for each job
      const datasets = jobsInStats.map((jobId, index) => {
        // Check if this job is the highlighted one
        const isHighlighted = filteredJobId === jobId;
        const baseColor = jobColors[index % jobColors.length];
        
        // For non-highlighted jobs when a job is selected, use faded colors
        let backgroundColor = baseColor;
        let pointBackgroundColor = baseColor;
        let borderWidth = 0;
        
        // If a job is filtered, only show that job's bars
        if (filteredJobId !== null) {
          if (!isHighlighted) {
            // Hide non-highlighted jobs completely when filtering
            return {
              label: getJobName(jobId),
              data: dayLabels.map(day => 0), // Zero data to hide bars
              backgroundColor: 'transparent',
              borderColor: 'transparent',
              borderWidth: 0,
              borderRadius: 4,
              borderSkipped: false,
              pointRadius: 0, // Hide points
              order: index
            };
          } else {
            // The highlighted job gets full opacity and a border
            borderWidth = 1;
          }
        }
        
        return {
          label: getJobName(jobId),
          data: dayLabels.map(day => dateJobGroups[day][jobId] || 0),
          backgroundColor: backgroundColor,
          borderColor: isHighlighted ? baseColor.replace('0.85', '1') : 'transparent',
          borderWidth: borderWidth,
          borderRadius: 4,
          borderSkipped: false,
          pointStyle: 'circle',
          pointRadius: function(context: any) {
            const index = context.dataIndex;
            const value = context.dataset.data[index];
            // Only show points for highlighted job or if no job is highlighted
            if (filteredJobId === null || isHighlighted) {
              return value > 0 ? 3 : 0;
            }
            return 0;
          },
          pointBackgroundColor: pointBackgroundColor,
          pointBorderColor: 'white',
          pointBorderWidth: 1.5,
          // Move highlighted job to front
          order: isHighlighted ? -1 : index
        };
      });
      
      return {
        labels: dayLabels,
        datasets: datasets,
      };
    } else {
      // Single job view - ensure all days are represented
      const dayData: {[key: string]: number} = {};
      
      // Initialize all days with zero
      dayLabels.forEach(day => {
        dayData[day] = 0;
      });
      
      // Fill in actual data
      recentStats.forEach(stat => {
        const dateKey = format(new Date(stat.date), 'EEE');
        dayData[dateKey] = stat.avg_hours;
      });
      
      return {
        labels: dayLabels,
        datasets: [
          {
            label: 'Hours Worked',
            data: dayLabels.map(day => dayData[day]),
            backgroundColor: 'rgba(66, 133, 244, 0.85)', // Match example blue color
            borderRadius: 4,
            borderSkipped: false,
            pointStyle: 'circle',
            pointRadius: function(context: any) {
              const index = context.dataIndex;
              const value = context.dataset.data[index];
              return value > 0 ? 3 : 0;
            },
            pointBackgroundColor: 'rgba(66, 133, 244, 1)',
            pointBorderColor: 'white',
            pointBorderWidth: 1.5,
          },
        ],
      };
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
      setActiveCardIndex(null);
      return;
    }
    
    // Trigger card flip animation when selecting a day
    setIsCardFlipping(true);
    
    // Randomly highlight one of the three cards for more interesting effect
    setActiveCardIndex(Math.floor(Math.random() * 3));
    
    const clickedIndex = elements[0].index;
    const clickedDatasetIndex = elements[0].datasetIndex;
    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const clickedDay = dayLabels[clickedIndex];
    
    // Prepare the day data
    let dayData: DetailedDayStat | null = null;
    
    // Different logic for all jobs vs single job vs filtered job
    if (selectedJobId === null) {
      // All jobs view - get the job from the dataset
      const sortedStats = [...dailyStats].sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      
      // Apply filtering if needed
      const statsToUse = filteredJobId !== null
        ? sortedStats.filter(stat => stat.job_id === filteredJobId)
        : sortedStats;
      
      const recentStats = statsToUse.slice(-getDaysToShow());
      
      // Get job ID based on filter state
      let jobId: number;
      if (filteredJobId !== null) {
        jobId = filteredJobId;
      } else {
        const jobsInStats = Array.from(new Set(recentStats.map(stat => stat.job_id)));
        jobId = jobsInStats[clickedDatasetIndex];
      }
      
      // Find matching stat for the clicked day and job
      const matchingStat = recentStats.find(stat => 
        format(new Date(stat.date), 'EEE') === clickedDay && 
        stat.job_id === jobId
      );
      
      if (matchingStat) {
        dayData = {
          date: matchingStat.date,
          formattedDate: format(new Date(matchingStat.date), 'MMMM d, yyyy'),
          jobId: matchingStat.job_id,
          jobName: getJobName(matchingStat.job_id),
          hours: matchingStat.avg_hours,
          entryTime: matchingStat.avg_entry_time,
          exitTime: matchingStat.avg_exit_time,
          earnings: matchingStat.daily_pay
        };
      } else {
        // Handle case where the day exists but has no data
        dayData = {
          date: new Date().toISOString(),
          formattedDate: clickedDay,
          jobId: jobId,
          jobName: getJobName(jobId),
          hours: 0,
          entryTime: '',
          exitTime: '',
          earnings: 0
        };
      }
    } else {
      // Single job view
      const sortedStats = [...dailyStats]
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(-getDaysToShow());
      
      // Find the stat for the clicked day
      const clickedStat = sortedStats.find(stat => 
        format(new Date(stat.date), 'EEE') === clickedDay
      );
      
      if (clickedStat) {
        dayData = {
          date: clickedStat.date,
          formattedDate: format(new Date(clickedStat.date), 'MMMM d, yyyy'),
          jobId: clickedStat.job_id,
          jobName: getJobName(clickedStat.job_id),
          hours: clickedStat.avg_hours,
          entryTime: clickedStat.avg_entry_time,
          exitTime: clickedStat.avg_exit_time,
          earnings: clickedStat.daily_pay
        };
      } else {
        // Handle case where the day exists but has no data
        dayData = {
          date: new Date().toISOString(),
          formattedDate: clickedDay,
          jobId: selectedJobId,
          jobName: getJobName(selectedJobId),
          hours: 0,
          entryTime: '',
          exitTime: '',
          earnings: 0
        };
      }
    }
    
    // Set the content after a short delay, so animation can show first
    setTimeout(() => {
      setSelectedDay(dayData);
      
      // Reset animation after content is set
      setTimeout(() => {
        setIsCardFlipping(false);
      }, 300);
      
      // Set a timeout to clear the selected day after 10 seconds
      timerRef.current = setTimeout(() => {
        setSelectedDay(null);
        setActiveCardIndex(null);
        timerRef.current = null;
      }, 10000);
    }, 400); // Delay setting the content to show animation first
  };
  
  // Chart options
  const chartOptions = {
    responsive: true,
    onClick: handleChartClick,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: selectedJobId === null, // Only show legend in all jobs view
        position: 'right' as const,
        align: 'center' as const,
        labels: {
          boxWidth: 12,
          padding: 10,
          font: {
            size: 11,
            family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          },
          usePointStyle: true,
          pointStyle: 'circle'
        },
        maxWidth: 120,
        fullSize: false
      },
      title: {
        display: false, // No title in the example
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#333',
        bodyColor: '#333',
        titleFont: {
          weight: 'bold',
          size: 13,
        },
        bodyFont: {
          size: 12,
        },
        padding: 10,
        cornerRadius: 8,
        borderColor: 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
        callbacks: {
          title: (items: any[]) => {
            return items[0].label;
          },
          label: (context: any) => {
            const label = context.dataset.label || '';
            return `${label}: ${context.raw}h`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: selectedJobId === null && filteredJobId === null ? 14 : 10, // Add 4h extra padding only in total view
        border: {
          display: false, // No axis line in the example
        },
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.05)',
          drawTicks: false,
          lineWidth: 1,
          drawBorder: false,
        },
        ticks: {
          padding: 10,
          stepSize: 2, // 2h intervals as shown in the example
          callback: (value: number) => `${value}h`,
          color: '#999',
          font: {
            size: 12,
            family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          }
        },
        stacked: selectedJobId === null // Use stacked bars for multiple jobs
      },
      x: {
        border: {
          display: false, // No axis line in the example
        },
        grid: {
          display: false, // No grid lines for x axis
          drawBorder: false,
        },
        ticks: {
          color: '#999',
          font: {
            size: 12,
            family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          },
          padding: 5,
        },
        stacked: selectedJobId === null // Use stacked bars for multiple jobs
      }
    },
    layout: {
      padding: {
        left: 10,
        right: 25, // Increased right padding for legend
        top: 16, // Increased top padding to accommodate dots
        bottom: 10
      }
    },
    elements: {
      bar: {
        borderWidth: 0,
      },
      point: {
        hitRadius: 8,
      }
    },
    barThickness: 40, // Makes bars wider like in the example
    barPercentage: 0.7, // Controls bar width
    categoryPercentage: 0.8, // Controls spacing between bars
  };
  
  // Calculate total stats for the selected time range
  const calculateTotalStats = () => {
    const sortedStats = [...dailyStats].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    // Apply job filtering if needed
    const filteredSortedStats = selectedJobId === null && filteredJobId !== null
      ? sortedStats.filter(stat => stat.job_id === filteredJobId)
      : sortedStats;
    
    const recentStats = filteredSortedStats.slice(-getDaysToShow());
    
    if (recentStats.length === 0) return { totalHours: 0, totalEarnings: 0, daysWorked: 0, avgHoursPerDay: 0 };
    
    // If total view, we need to be careful not to double count days
    if (selectedJobId === null && filteredJobId === null) {
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
      // Single job or filtered job is simpler
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

  // CSS class for flip animation
  const flipClass = isFlipping ? 'animate-flip' : '';

  // Job legend click handler
  const handleJobLegendClick = (jobId: number) => {
    if (filteredJobId === jobId) {
      // If already filtered by this job, show all jobs (default view)
      setFilteredJobId(null);
    } else {
      // Filter to show only this job
      setFilteredJobId(jobId);
    }
    
    // Trigger flip animation
    setIsFlipping(true);
    
    setTimeout(() => {
      setIsFlipping(false);
    }, 600); // Animation duration
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
        {selectedJobId === null && dailyStats.length > 0 && (
          <div className="flex flex-wrap justify-end gap-3 items-center">
            {/* Generate legend manually to place it at heading level */}
            {Array.from(new Set(dailyStats.map(stat => stat.job_id))).map((jobId, index) => {
              // Determine if this job is highlighted
              const isHighlighted = filteredJobId === jobId;
              const baseColor = jobColors[index % jobColors.length];
              
              return (
                <div 
                  key={jobId} 
                  className={`flex items-center cursor-pointer px-2 py-1 rounded-md transition-colors duration-150 ${
                    isHighlighted 
                      ? 'bg-gray-100 shadow-sm' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handleJobLegendClick(jobId)}
                >
                  <span 
                    className={`inline-block w-3 h-3 rounded-full mr-2 ${
                      !isHighlighted && filteredJobId !== null ? 'opacity-30' : ''
                    }`}
                    style={{ 
                      backgroundColor: baseColor,
                      border: isHighlighted ? `1px solid ${baseColor.replace('0.85', '1')}` : 'none'
                    }}
                  ></span>
                  <span className={`text-xs font-medium ${
                    !isHighlighted && filteredJobId !== null ? 'text-gray-400' : 'text-gray-700'
                  }`}>
                    {getJobName(jobId)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {dailyStats.length > 0 ? (
        <>
          <div className={`mb-6 transition-all duration-300 transform perspective-1000 ${flipClass}`}>
            <div className="h-72 bg-white p-2 rounded-lg">
              <Bar data={prepareChartData()} options={{
                ...chartOptions,
                plugins: {
                  ...chartOptions.plugins,
                  legend: {
                    ...chartOptions.plugins.legend,
                    display: false // Hide the built-in legend since we're creating our own
                  }
                }
              }} />
            </div>
          </div>
          
          <div className={`grid grid-cols-3 gap-4 transform perspective-1000 ${flipClass} ${isCardFlipping ? 'animate-card-flip' : ''}`}>
            {/* First card - Daily Average or Selected Day Hours */}
            <div className={`bg-gray-50 p-4 rounded-lg transition-all duration-300 shadow-sm hover:shadow-md ${activeCardIndex === 0 ? 'shadow-md bg-white' : ''}`}>
              <div className={`${isCardFlipping ? 'animate-text-blur' : ''}`} style={{ animationDelay: '0ms' }}>
                {selectedDay ? (
                  <>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">
                      {selectedJobId === null ? selectedDay.jobName : 'Today\'s Hours'}
                    </h3>
                    <p className="text-2xl font-bold text-gray-900">{selectedDay.hours.toFixed(1)}h</p>
                    <p className="text-xs text-blue-500 mt-1">{selectedDay.formattedDate}</p>
                  </>
                ) : (
                  <>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Daily Average</h3>
                    <p className="text-2xl font-bold text-gray-900">{avgHoursPerDay.toFixed(1)}h</p>
                    <p className="text-xs text-green-500 mt-1">{daysWorked} days worked</p>
                  </>
                )}
              </div>
            </div>
            
            {/* Second card - Weekly Hours or Entry/Exit Times */}
            <div className={`bg-gray-50 p-4 rounded-lg transition-all duration-300 shadow-sm hover:shadow-md ${activeCardIndex === 1 ? 'shadow-md bg-white' : ''}`}>
              <div className={`${isCardFlipping ? 'animate-text-blur' : ''}`} style={{ animationDelay: '100ms' }}>
                {selectedDay ? (
                  <>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Recent Activity</h3>
                    <div className="flex flex-col">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Entry:</span>
                        <span className="text-sm font-medium text-gray-900">{formatTime(selectedDay.entryTime)}</span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-gray-500">Exit:</span>
                        <span className="text-sm font-medium text-gray-900">{formatTime(selectedDay.exitTime)}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Weekly Hours</h3>
                    <p className="text-2xl font-bold text-gray-900">{totalHours.toFixed(1)}h</p>
                    <p className="text-xs text-green-500 mt-1">This week</p>
                  </>
                )}
              </div>
            </div>
            
            {/* Third card - Weekly Earnings or Day Earnings */}
            <div className={`bg-gray-50 p-4 rounded-lg transition-all duration-300 shadow-sm hover:shadow-md ${activeCardIndex === 2 ? 'shadow-md bg-white' : ''}`}>
              <div className={`${isCardFlipping ? 'animate-text-blur' : ''}`} style={{ animationDelay: '200ms' }}>
                {selectedDay ? (
                  <>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Day Earnings</h3>
                    <p className="text-2xl font-bold text-green-600">${selectedDay.earnings.toFixed(2)}</p>
                    <p className="text-xs text-green-500 mt-1">{selectedDay.hours.toFixed(1)}h worked</p>
                  </>
                ) : (
                  <>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Weekly Earnings</h3>
                    <p className="text-2xl font-bold text-green-600">${totalEarnings.toFixed(2)}</p>
                    <p className="text-xs text-green-500 mt-1">{totalHours.toFixed(1)}h total</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </>
      ) : (
        <p className="text-gray-500">
          {selectedJobId === null ? 'No statistics available' : 'No statistics available for this job'}
        </p>
      )}
    </div>
  );
} 
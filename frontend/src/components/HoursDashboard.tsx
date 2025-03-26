'use client';

import { useState, useEffect, useRef } from 'react';
import { api } from '../app/api/apiClient';

interface HoursDashboardProps {
  selectedJobId: number | null;
}

type TimePeriod = 'biweekly' | 'monthly';

export default function HoursDashboard({ selectedJobId }: HoursDashboardProps) {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('biweekly');
  const [weeklyHours, setWeeklyHours] = useState(0);
  const [extendedHours, setExtendedHours] = useState(0);
  const [totalHours, setTotalHours] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFlipping, setIsFlipping] = useState(false);
  const prevTimePeriodRef = useRef<TimePeriod>(timePeriod);

  // Hardcoded user ID for demonstration
  const userId = 4;

  const toggleTimePeriod = () => {
    setIsFlipping(true);
    setTimeout(() => {
      const newPeriod = timePeriod === 'biweekly' ? 'monthly' : 'biweekly';
      setTimePeriod(newPeriod);
      
      // Only update the extended hours without triggering a full refetch
      if (selectedJobId === null) {
        // For all jobs view
        const apiMethod = newPeriod === 'biweekly' 
          ? api.hours.getBiWeekly 
          : api.hours.getMonthly;
          
        apiMethod(userId)
          .then(res => {
            const total = res.data.jobs.reduce((sum: number, job: any) => {
              if (newPeriod === 'biweekly' && 'biweekly_hours' in job) {
                return sum + (job.biweekly_hours || 0);
              } else if (newPeriod === 'monthly' && 'monthly_hours' in job) {
                return sum + (job.monthly_hours || 0);
              }
              return sum;
            }, 0);
            setExtendedHours(total);
          })
          .catch((err: Error) => console.error('Error updating extended hours:', err));
      } else {
        // For single job view
        const apiMethod = newPeriod === 'biweekly'
          ? api.hours.getBiWeeklyByJob
          : api.hours.getMonthlyByJob;
          
        apiMethod(userId, selectedJobId)
          .then(res => {
            if (newPeriod === 'biweekly' && 'biweekly_hours' in res.data) {
              setExtendedHours(res.data.biweekly_hours || 0);
            } else if (newPeriod === 'monthly' && 'monthly_hours' in res.data) {
              setExtendedHours(res.data.monthly_hours || 0);
            }
          })
          .catch((err: Error) => console.error('Error updating extended hours:', err));
      }
    }, 150); // Switch halfway through the animation
    
    setTimeout(() => {
      setIsFlipping(false);
    }, 600); // Animation duration
  };

  // Update reference for animation tracking
  useEffect(() => {
    prevTimePeriodRef.current = timePeriod;
  }, [timePeriod]);

  const fetchHours = async () => {
    try {
      setLoading(true);

      // Get weekly and total hours first
      const [weeklyRes, totalRes] = await Promise.all([
        api.hours.getWeekly(userId),
        api.hours.getTotal(userId)
      ]);

      if (selectedJobId === null) {
        // All jobs - sum up hours from all jobs
        const weeklyTotal = weeklyRes.data.jobs.reduce((sum, job) => 
          sum + (job.weekly_hours || 0), 0);
          
        // Get all bi-weekly or monthly hours
        const extendedRes = timePeriod === 'biweekly'
          ? await api.hours.getBiWeekly(userId)
          : await api.hours.getMonthly(userId);
        
        // Sum up all extended hours
        const extendedTotal = extendedRes.data.jobs.reduce((sum, job) => {
          if (timePeriod === 'biweekly' && 'biweekly_hours' in job) {
            return sum + (job.biweekly_hours || 0);
          } else if (timePeriod === 'monthly' && 'monthly_hours' in job) {
            return sum + (job.monthly_hours || 0);
          }
          return sum;
        }, 0);
          
        // Sum up total hours
        const totalAllHours = totalRes.data.jobs.reduce((sum, job) => 
          sum + (job.total_hours || 0), 0);
        
        setWeeklyHours(weeklyTotal);
        setExtendedHours(extendedTotal);
        setTotalHours(totalAllHours);
      } else {
        // Single job - get the specific job data
        const extendedRes = timePeriod === 'biweekly' 
          ? await api.hours.getBiWeeklyByJob(userId, selectedJobId)
          : await api.hours.getMonthlyByJob(userId, selectedJobId);

        // Find the selected job in the responses
        const weeklyJob = weeklyRes.data.jobs.find(job => job.job_id === selectedJobId);
        const totalJob = totalRes.data.jobs.find(job => job.job_id === selectedJobId);

        setWeeklyHours(weeklyJob?.weekly_hours || 0);
        setExtendedHours(
          timePeriod === 'biweekly' 
            ? ('biweekly_hours' in extendedRes.data ? extendedRes.data.biweekly_hours : 0)
            : ('monthly_hours' in extendedRes.data ? extendedRes.data.monthly_hours : 0)
        );
        setTotalHours(totalJob?.total_hours || 0);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching hours:', err);
      setError('Failed to load hours data');
    } finally {
      setLoading(false);
    }
  };

  // Add a custom effect for timePeriod as a signal for toggle action
  // without causing refetches (optimization)
  useEffect(() => {
    // This empty effect ensures React doesn't complain about missing dependencies
    // The actual toggle logic happens in toggleTimePeriod which updates only what's needed
    // This approach prevents unnecessary refetches while maintaining component lifecycle
  }, [timePeriod]);

  // Perform full refetch only when job selection changes
  useEffect(() => {
    fetchHours();
    // Refresh data every 5 minutes
    const interval = setInterval(fetchHours, 300000);
    return () => clearInterval(interval);
  }, [selectedJobId]); // Intentionally omit timePeriod to prevent full refetch on toggle

  if (loading) {
    return (
      <div className="animate-pulse bg-white rounded-lg shadow-sm p-6">
        <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-24 bg-gray-200 rounded"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
        </div>
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

  const flipClass = isFlipping ? 'animate-flip' : '';

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Hours Summary</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-2">This Week</h3>
          <p className="text-3xl font-bold text-blue-600">
            {weeklyHours.toFixed(1)}
            <span className="text-lg font-normal text-blue-500 ml-1">hours</span>
          </p>
        </div>

        <div 
          onClick={toggleTimePeriod}
          className={`bg-indigo-50 p-4 rounded-lg cursor-pointer hover:bg-indigo-100 transition-colors duration-200 relative perspective-1000 ${flipClass}`}
        >
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {timePeriod === 'biweekly' ? 'Bi-Weekly' : 'Monthly'}
            </h3>
            <img 
              src={timePeriod === 'biweekly' 
                ? '/icons/biweekly-icon.svg' 
                : '/icons/monthly-icon.svg'
              }
              alt={timePeriod === 'biweekly' ? 'Biweekly icon' : 'Monthly icon'}
              className="h-5 w-5 object-contain"
            />
          </div>
          <p className="text-3xl font-bold text-indigo-600">
            {extendedHours.toFixed(1)}
            <span className="text-lg font-normal text-indigo-500 ml-1">hours</span>
          </p>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Total Hours</h3>
          <p className="text-3xl font-bold text-green-600">
            {totalHours.toFixed(1)}
            <span className="text-lg font-normal text-green-500 ml-1">hours</span>
          </p>
        </div>
      </div>
    </div>
  );
} 
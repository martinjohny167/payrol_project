'use client';

import { useState, useEffect } from 'react';
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

  // Hardcoded user ID for demonstration
  const userId = 4;

  const toggleTimePeriod = () => {
    setTimePeriod(prev => prev === 'biweekly' ? 'monthly' : 'biweekly');
  };

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
        const extendedTotal = timePeriod === 'biweekly'
          ? extendedRes.data.jobs.reduce((sum, job) => sum + (job.biweekly_hours || 0), 0)
          : extendedRes.data.jobs.reduce((sum, job) => sum + (job.monthly_hours || 0), 0);
          
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
            ? (extendedRes.data.biweekly_hours || 0)
            : (extendedRes.data.monthly_hours || 0)
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

  useEffect(() => {
    fetchHours();
    // Refresh data every 5 minutes
    const interval = setInterval(fetchHours, 300000);
    return () => clearInterval(interval);
  }, [selectedJobId, timePeriod]);

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
          className="bg-indigo-50 p-4 rounded-lg cursor-pointer hover:bg-indigo-100 transition-colors duration-200 relative"
        >
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {timePeriod === 'biweekly' ? 'Bi-Weekly' : 'Monthly'}
            </h3>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-indigo-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
              />
            </svg>
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
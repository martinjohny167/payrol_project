'use client';

import { useState, useEffect } from 'react';
import { api } from '../app/api/apiClient';

interface EarningsDashboardProps {
  selectedJobId: number | null;
}

type TimePeriod = 'biweekly' | 'monthly';

export default function EarningsDashboard({ selectedJobId }: EarningsDashboardProps) {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('biweekly');
  const [weeklyEarnings, setWeeklyEarnings] = useState(0);
  const [extendedEarnings, setExtendedEarnings] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Hardcoded user ID for demonstration
  const userId = 4;

  const toggleTimePeriod = () => {
    setTimePeriod(prev => prev === 'biweekly' ? 'monthly' : 'biweekly');
  };

  const fetchEarnings = async () => {
    try {
      setLoading(true);
      
      if (selectedJobId === null) {
        // All jobs - get aggregate earnings data
        const [weeklyRes, totalRes] = await Promise.all([
          api.earnings.getWeekly(userId),
          api.earnings.getTotal(userId)
        ]);
        
        // Calculate total weekly earnings across all jobs
        const weeklyTotal = weeklyRes.data.jobs.reduce(
          (sum, job) => sum + (job.weekly_earnings || 0), 0
        );
        
        // Get extended earnings (bi-weekly or monthly)
        const extendedRes = timePeriod === 'biweekly'
          ? await api.earnings.getBiWeekly(userId)
          : await api.earnings.getMonthly(userId);
          
        // Calculate total extended earnings
        const extendedTotal = timePeriod === 'biweekly'
          ? extendedRes.data.jobs.reduce((sum, job) => sum + (job.biweekly_earnings || 0), 0)
          : extendedRes.data.jobs.reduce((sum, job) => sum + (job.monthly_earnings || 0), 0);
          
        // Calculate total earnings across all jobs
        const totalAllEarnings = totalRes.data.jobs.reduce(
          (sum, job) => sum + (job.total_earnings || 0), 0
        );
        
        setWeeklyEarnings(weeklyTotal);
        setExtendedEarnings(extendedTotal);
        setTotalEarnings(totalAllEarnings);
      } else {
        // Single job - use job-specific endpoints
        const [weeklyRes, extendedRes, totalRes] = await Promise.all([
          api.earnings.getWeeklyByJob(userId, selectedJobId),
          timePeriod === 'biweekly'
            ? api.earnings.getBiWeeklyByJob(userId, selectedJobId)
            : api.earnings.getMonthlyByJob(userId, selectedJobId),
          api.earnings.getTotalByJob(userId, selectedJobId)
        ]);

        setWeeklyEarnings(weeklyRes.data.weekly_earnings || 0);
        setExtendedEarnings(
          timePeriod === 'biweekly'
            ? (extendedRes.data.biweekly_earnings || 0)
            : (extendedRes.data.monthly_earnings || 0)
        );
        setTotalEarnings(totalRes.data.total_earnings || 0);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching earnings:', err);
      setError('Failed to load earnings data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEarnings();
    // Refresh data every 5 minutes
    const interval = setInterval(fetchEarnings, 300000);
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
        <h2 className="text-xl font-semibold text-gray-900">Earnings Summary</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-2">This Week</h3>
          <p className="text-3xl font-bold text-blue-600">
            ${weeklyEarnings.toFixed(2)}
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
            ${extendedEarnings.toFixed(2)}
          </p>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Total Earnings</h3>
          <p className="text-3xl font-bold text-green-600">
            ${totalEarnings.toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
} 
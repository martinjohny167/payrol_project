'use client';

import { useState, useEffect, useRef } from 'react';
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
  const [isFlipping, setIsFlipping] = useState(false);
  const prevTimePeriodRef = useRef<TimePeriod>(timePeriod);

  // Hardcoded user ID for demonstration
  const userId = 4;

  const toggleTimePeriod = () => {
    setIsFlipping(true);
    setTimeout(() => {
      const newPeriod = timePeriod === 'biweekly' ? 'monthly' : 'biweekly';
      setTimePeriod(newPeriod);
      
      // Only update the extended earnings without triggering a full refetch
      if (selectedJobId === null) {
        // For all jobs view
        const apiMethod = newPeriod === 'biweekly' 
          ? api.earnings.getBiWeekly 
          : api.earnings.getMonthly;
          
        apiMethod(userId)
          .then(res => {
            const total = res.data.jobs.reduce((sum: number, job: any) => {
              if (newPeriod === 'biweekly' && 'biweekly_earnings' in job) {
                return sum + (job.biweekly_earnings || 0);
              } else if (newPeriod === 'monthly' && 'monthly_earnings' in job) {
                return sum + (job.monthly_earnings || 0);
              }
              return sum;
            }, 0);
            setExtendedEarnings(total);
          })
          .catch((err: Error) => console.error('Error updating extended earnings:', err));
      } else {
        // For single job view
        const apiMethod = newPeriod === 'biweekly'
          ? api.earnings.getBiWeeklyByJob
          : api.earnings.getMonthlyByJob;
          
        apiMethod(userId, selectedJobId)
          .then(res => {
            if (newPeriod === 'biweekly' && 'biweekly_earnings' in res.data) {
              setExtendedEarnings(res.data.biweekly_earnings || 0);
            } else if (newPeriod === 'monthly' && 'monthly_earnings' in res.data) {
              setExtendedEarnings(res.data.monthly_earnings || 0);
            }
          })
          .catch((err: Error) => console.error('Error updating extended earnings:', err));
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

  // Add a custom effect for timePeriod as a signal for toggle action
  // without causing refetches (optimization)
  useEffect(() => {
    // This empty effect ensures React doesn't complain about missing dependencies
    // The actual toggle logic happens in toggleTimePeriod which updates only what's needed
    // This approach prevents unnecessary refetches while maintaining component lifecycle
  }, [timePeriod]);

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
        const extendedTotal = extendedRes.data.jobs.reduce((sum, job) => {
          if (timePeriod === 'biweekly' && 'biweekly_earnings' in job) {
            return sum + (job.biweekly_earnings || 0);
          } else if (timePeriod === 'monthly' && 'monthly_earnings' in job) {
            return sum + (job.monthly_earnings || 0);
          }
          return sum;
        }, 0);
        
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
            ? ('biweekly_earnings' in extendedRes.data ? extendedRes.data.biweekly_earnings : 0)
            : ('monthly_earnings' in extendedRes.data ? extendedRes.data.monthly_earnings : 0)
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

  // Perform full refetch only when job selection changes
  useEffect(() => {
    fetchEarnings();
    // Refresh data every 5 minutes
    const interval = setInterval(fetchEarnings, 300000);
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
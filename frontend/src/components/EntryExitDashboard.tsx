'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { api, type EntryExit, type DailyStat } from '../app/api/apiClient';

interface EntryExitDashboardProps {
  selectedJobId: number;
}

export default function EntryExitDashboard({ selectedJobId }: EntryExitDashboardProps) {
  const [latestActivity, setLatestActivity] = useState<EntryExit | null>(null);
  const [dailyStats, setDailyStats] = useState<DailyStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Hardcoded user ID for demonstration
  const userId = 4;

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Use job-specific endpoints
      const [activityRes, statsRes] = await Promise.all([
        api.entryExit.getLatestByJob(userId, selectedJobId),
        api.entryExit.getDailyStatsByJob(userId, selectedJobId)
      ]);

      setLatestActivity(activityRes.data || null);
      setDailyStats(statsRes.data || []);
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
        <p className="text-gray-500 mb-8">No recent activity for this job</p>
      )}

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Daily Statistics</h3>
        {dailyStats.length > 0 ? (
          <div className="space-y-4">
            {dailyStats.map((stat, index) => (
              <div key={index} className="border-l-4 border-green-500 pl-4 py-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {format(new Date(stat.date), 'MMMM d, yyyy')}
                    </p>
                    <p className="text-sm text-gray-600">
                      Hours: {stat.avg_hours.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-600">
                      Average Entry: {format(new Date(stat.avg_entry_time), 'h:mm a')}
                    </p>
                    <p className="text-sm text-gray-600">
                      Average Exit: {format(new Date(stat.avg_exit_time), 'h:mm a')}
                    </p>
                  </div>
                  <div className="bg-green-100 px-3 py-2 rounded-lg">
                    <p className="text-sm font-medium text-gray-900">Daily Pay</p>
                    <p className="text-lg font-bold text-green-700">
                      ${stat.daily_pay ? stat.daily_pay.toFixed(2) : '0.00'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No daily statistics available for this job</p>
        )}
      </div>
    </div>
  );
} 
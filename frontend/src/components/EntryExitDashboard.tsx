'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { api, type EntryExit, type DailyStat } from '../app/api/apiClient';

export default function EntryExitDashboard() {
  const [latestTimes, setLatestTimes] = useState<EntryExit | null>(null);
  const [recentActivity, setRecentActivity] = useState<EntryExit[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const userId = 4; // Replace with actual user ID from authentication

  const fetchData = async () => {
    try {
      setLoading(true);
      const [latestRes, recentRes, statsRes] = await Promise.all([
        api.entryExit.getLatest(userId),
        api.entryExit.getRecent(userId),
        api.entryExit.getDailyStats(userId),
      ]);

      setLatestTimes(latestRes.data);
      setRecentActivity(recentRes.data);
      setDailyStats(statsRes.data);
    } catch (err) {
      console.error('Error fetching entry/exit data:', err);
      setError('Failed to fetch entry/exit data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Refresh data every minute
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="p-4">Loading entry/exit data...</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;

  return (
    <div className="space-y-6">
      {/* Latest Entry/Exit Times */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">Time Activity</h2>
        {latestTimes && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-semibold">Last Entry</h3>
              <p className="text-2xl">
                {latestTimes.entry_time && 
                  format(new Date(latestTimes.entry_time), 'h:mm a')} on {
                  format(new Date(latestTimes.entry_date), 'EEEE')}
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Last Exit</h3>
              <p className="text-2xl">
                {latestTimes.exit_time && 
                  format(new Date(latestTimes.exit_time), 'h:mm a')} on {
                  format(new Date(latestTimes.entry_date), 'EEEE')}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {recentActivity.map((activity, index) => (
            <div
              key={index}
              className="flex items-center justify-between border-b pb-4 last:border-0"
            >
              <div>
                <p className="font-medium">
                  {activity.entry_time && format(new Date(activity.entry_time), 'h:mm a')}
                  {activity.exit_time && ` - ${format(new Date(activity.exit_time), 'h:mm a')}`}
                </p>
                <p className="text-gray-600">
                  {activity.entry_time && 
                    format(new Date(activity.entry_time), 'EEEE, MMMM d')}
                </p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  !activity.exit_time
                    ? 'bg-green-100 text-green-800'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                {!activity.exit_time ? 'Active' : 'Completed'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Daily Stats */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold mb-4">Daily Statistics</h3>
        <div className="space-y-4">
          {dailyStats.map((stat, index) => (
            <div
              key={index}
              className="flex items-center justify-between border-b pb-4 last:border-0"
            >
              <div>
                <p className="font-medium">
                  {format(new Date(stat.date), 'EEEE, MMMM d')}
                </p>
                <p className="text-gray-600">
                  {stat.entry_count} entries • {stat.avg_hours.toFixed(1)} hours avg
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 
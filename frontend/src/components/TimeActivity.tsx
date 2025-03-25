'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { api, type TimeEntry } from '../app/api/apiClient';

interface TimeActivityProps {
  selectedJobId: number;
}

export default function TimeActivity({ selectedJobId }: TimeActivityProps) {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Hardcoded user ID for demonstration
  const userId = 4;

  const fetchTimeEntries = async () => {
    try {
      setLoading(true);
      const response = await api.timeEntry.getAll();
      const allEntries = response.data;
      
      // Filter entries by selected job ID and user ID
      const filteredEntries = allEntries.filter(entry => 
        entry.job_id === selectedJobId && entry.user_id === userId
      );
      
      // Sort entries by punch_in_time in descending order (newest first)
      const sortedEntries = filteredEntries.sort((a, b) => 
        new Date(b.punch_in_time || '').getTime() - new Date(a.punch_in_time || '').getTime()
      );
      
      setTimeEntries(sortedEntries);
      
      // Check if there's an active session
      const latestEntry = sortedEntries[0];
      setIsActive(latestEntry && !!latestEntry.punch_in_time && !latestEntry.punch_out_time);
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching time entries:', err);
      setError('Failed to load time entries');
      setLoading(false);
    }
  };

  // Fetch entries when selectedJobId changes
  useEffect(() => {
    fetchTimeEntries();
    
    // Refresh data every minute
    const interval = setInterval(fetchTimeEntries, 60000);
    return () => clearInterval(interval);
  }, [selectedJobId]);

  const calculateHoursAfterBreak = (punchIn: string, punchOut: string) => {
    const inTime = new Date(punchIn).getTime();
    const outTime = new Date(punchOut).getTime();
    const diffHours = (outTime - inTime) / (1000 * 60 * 60);
    // Subtract 30 minutes break if worked more than 6 hours
    return diffHours > 6 ? diffHours - 0.5 : diffHours;
  };

  const handleClockInOut = async () => {
    try {
      if (!isActive) {
        // Clock in
        await api.timeEntry.create({
          user_id: userId,
          job_id: selectedJobId,
          punch_in_time: new Date().toISOString(),
          hours_after_break: 0
        });
      } else {
        // Clock out - find the active entry and update it
        const activeEntry = timeEntries.find(entry => !entry.punch_out_time);
        if (activeEntry && activeEntry.id) {
          const punchOutTime = new Date().toISOString();
          const hoursAfterBreak = calculateHoursAfterBreak(
            activeEntry.punch_in_time!,
            punchOutTime
          );
          await api.timeEntry.update(activeEntry.id, {
            punch_out_time: punchOutTime,
            hours_after_break: hoursAfterBreak
          });
        }
      }
      // Refresh the entries
      fetchTimeEntries();
    } catch (err) {
      console.error('Error updating time entry:', err);
      setError('Failed to update time entry');
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
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Time Activity</h2>
        <button
          onClick={handleClockInOut}
          className={`px-4 py-2 rounded-md font-medium ${
            isActive
              ? 'bg-red-600 text-white hover:bg-red-700'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          {isActive ? 'Clock Out' : 'Clock In'}
        </button>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
        {timeEntries.length === 0 ? (
          <p className="text-gray-500">No recent activity for this job</p>
        ) : (
          timeEntries.map((entry, index) => (
            <div
              key={entry.id || index}
              className="border-l-4 border-blue-500 pl-4 py-2"
            >
              <p className="text-sm text-gray-600">
                {entry.punch_in_time && format(new Date(entry.punch_in_time), 'MMM d, h:mm a')}
                {entry.punch_out_time && ` - ${format(new Date(entry.punch_out_time), 'h:mm a')}`}
              </p>
              {entry.hours_after_break > 0 && (
                <p className="text-sm text-gray-500">
                  Hours (after break): {entry.hours_after_break.toFixed(2)}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
} 
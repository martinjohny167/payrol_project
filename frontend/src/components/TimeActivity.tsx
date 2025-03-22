'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { api, type TimeEntry } from '../app/api/apiClient';

export default function TimeActivity() {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const userId = 4; // Replace with actual user ID from authentication
  const defaultJobId = 1; // Default job ID, replace with actual job selection

  const fetchTimeEntries = async () => {
    try {
      setLoading(true);
      const response = await api.timeEntry.getAll();
      console.log('Time entries response:', response.data);
      const userEntries = response.data.filter(entry => entry.user_id === userId);
      setTimeEntries(userEntries);
      
      // Check if there's an active session
      const sortedEntries = [...userEntries].sort((a, b) => 
        new Date(b.punch_in_time || '').getTime() - new Date(a.punch_in_time || '').getTime()
      );
      const lastEntry = sortedEntries[0];
      setIsActive(!!lastEntry?.punch_in_time && !lastEntry?.punch_out_time);
    } catch (err) {
      setError('Failed to fetch time entries');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateHoursAfterBreak = (punchIn: Date, punchOut: Date): number => {
    const totalHours = (punchOut.getTime() - punchIn.getTime()) / (1000 * 60 * 60);
    // Assuming 30 minutes break for shifts longer than 6 hours
    return totalHours > 6 ? totalHours - 0.5 : totalHours;
  };

  const handleClockInOut = async () => {
    try {
      const now = new Date();
      
      if (isActive) {
        // Clock out
        const lastEntry = timeEntries[0];
        if (lastEntry && lastEntry.punch_in_time) {
          const punchIn = new Date(lastEntry.punch_in_time);
          const hoursAfterBreak = calculateHoursAfterBreak(punchIn, now);
          
          await api.timeEntry.update(lastEntry.id!, {
            punch_out_time: now.toISOString(),
            hours_after_break: hoursAfterBreak
          });
        }
      } else {
        // Clock in
        const timeEntryData: Omit<TimeEntry, 'id'> = {
          user_id: userId,
          job_id: defaultJobId,
          punch_in_time: now.toISOString(),
          punch_out_time: undefined,
          hours_after_break: 0 // Will be updated on clock out
        };
        await api.timeEntry.create(timeEntryData);
      }
      
      setIsActive(!isActive);
      await fetchTimeEntries();
    } catch (err) {
      setError(`Failed to ${isActive ? 'clock out' : 'clock in'}`);
      console.error('Error:', err);
    }
  };

  useEffect(() => {
    fetchTimeEntries();
    // Refresh data every minute
    const interval = setInterval(fetchTimeEntries, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="p-4">Loading time entries...</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Time Activity</h2>
        <button
          onClick={handleClockInOut}
          className={`px-6 py-2 rounded-lg font-medium ${
            isActive 
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-green-500 hover:bg-green-600 text-white'
          }`}
        >
          {isActive ? 'Clock Out' : 'Clock In'}
        </button>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Recent Activity</h3>
        {timeEntries.map((entry) => (
          <div
            key={entry.id}
            className="p-4 bg-white rounded-lg shadow flex justify-between items-center"
          >
            <div>
              <p className="font-medium">
                {entry.punch_in_time && format(new Date(entry.punch_in_time), 'h:mm a')}
                {entry.punch_out_time && ` - ${format(new Date(entry.punch_out_time), 'h:mm a')}`}
              </p>
              <p className="text-gray-600">
                {entry.punch_in_time && format(new Date(entry.punch_in_time), 'EEEE, MMMM d')}
              </p>
              <p className="text-sm text-gray-500">
                Job ID: {entry.job_id}
                {entry.hours_after_break > 0 && ` • Hours: ${entry.hours_after_break.toFixed(2)}`}
              </p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                !entry.punch_out_time
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {!entry.punch_out_time ? 'Active' : 'Completed'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
} 
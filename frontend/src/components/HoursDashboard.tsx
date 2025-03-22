'use client';

import { useState, useEffect } from 'react';
import { api } from '@/app/api/apiClient';

interface JobHours {
  job_id: number;
  job_name: string;
  total_hours: number;
  weekly_hours: number;
}

interface HoursData {
  total: number;
  weekly: number;
  jobs: JobHours[];
}

export default function HoursDashboard() {
  const [hoursData, setHoursData] = useState<HoursData>({ 
    total: 0, 
    weekly: 0,
    jobs: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const userId = 4; // Replace with actual user ID from authentication

  const fetchHoursData = async () => {
    try {
      setLoading(true);
      const [totalResponse, weeklyResponse] = await Promise.all([
        api.hours.getTotal(userId),
        api.hours.getWeekly(userId)
      ]);

      // Create a map of jobs with their total and weekly hours
      const jobsMap = new Map<number, JobHours>();

      // Process total hours
      totalResponse.data.jobs.forEach(job => {
        jobsMap.set(job.job_id, {
          job_id: job.job_id,
          job_name: job.job_name,
          total_hours: job.total_hours || 0,
          weekly_hours: 0
        });
      });

      // Process weekly hours
      weeklyResponse.data.jobs.forEach(job => {
        const existingJob = jobsMap.get(job.job_id);
        if (existingJob) {
          existingJob.weekly_hours = job.weekly_hours || 0;
        } else {
          jobsMap.set(job.job_id, {
            job_id: job.job_id,
            job_name: job.job_name,
            total_hours: 0,
            weekly_hours: job.weekly_hours || 0
          });
        }
      });

      // Calculate totals
      const jobs = Array.from(jobsMap.values());
      const total = jobs.reduce((sum, job) => sum + job.total_hours, 0);
      const weekly = jobs.reduce((sum, job) => sum + job.weekly_hours, 0);

      setHoursData({
        total,
        weekly,
        jobs
      });
    } catch (err) {
      setError('Failed to fetch hours data');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHoursData();
    // Refresh data every minute
    const interval = setInterval(fetchHoursData, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="p-4">Loading hours data...</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Hours Overview</h2>
      <div className="grid grid-cols-2 gap-6">
        <div className="p-6 bg-white rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-600">Weekly Hours</h3>
          <p className="text-3xl font-bold mt-2">{hoursData.weekly.toFixed(1)}</p>
        </div>
        <div className="p-6 bg-white rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-600">Total Hours</h3>
          <p className="text-3xl font-bold mt-2">{hoursData.total.toFixed(1)}</p>
        </div>
      </div>

      {hoursData.jobs.length > 0 && (
        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-4">Hours by Job</h3>
          <div className="space-y-4">
            {hoursData.jobs.map(job => (
              <div key={job.job_id} className="p-4 bg-white rounded-lg shadow">
                <h4 className="font-medium text-gray-900">{job.job_name}</h4>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <p className="text-sm text-gray-600">Weekly Hours</p>
                    <p className="text-lg font-semibold">{job.weekly_hours.toFixed(1)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Hours</p>
                    <p className="text-lg font-semibold">{job.total_hours.toFixed(1)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 
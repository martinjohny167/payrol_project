'use client';

import { useState, useEffect } from 'react';
import { api, type Job } from '../app/api/apiClient';

interface JobSelectorProps {
  onJobSelect: (jobId: number) => void;
}

export default function JobSelector({ onJobSelect }: JobSelectorProps) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await api.jobs.getAll();
        setJobs(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching jobs:', err);
        setError('Error loading jobs');
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  // Call onJobSelect whenever selectedJob changes
  useEffect(() => {
    onJobSelect(selectedJob);
  }, [selectedJob, onJobSelect]);

  if (loading) {
    return (
      <div className="animate-pulse bg-gray-200 rounded-lg p-4">
        <div className="h-8 bg-gray-300 rounded w-48"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-4 bg-white p-4 rounded-lg shadow-sm">
      <label htmlFor="job-select" className="text-gray-700 font-medium">
        Current Job:
      </label>
      <select
        id="job-select"
        value={selectedJob}
        onChange={(e) => setSelectedJob(Number(e.target.value))}
        className="form-select rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
      >
        {jobs.map((job) => (
          <option key={job.id} value={job.id}>
            {job.name}
          </option>
        ))}
      </select>
    </div>
  );
} 
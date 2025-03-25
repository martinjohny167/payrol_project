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
        
        // Set the first job as selected if available
        if (response.data.length > 0) {
          setSelectedJob(response.data[0].id);
        }
        
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
      <div className="animate-pulse bg-gray-100 rounded-lg p-4 flex items-center justify-center">
        <div className="h-2 bg-gray-300 rounded w-24"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-2 rounded-lg text-xs">
        {error}
      </div>
    );
  }
  
  // Get the current job name
  const currentJob = jobs.find(job => job.id === selectedJob);

  return (
    <div className="flex flex-col bg-white rounded-lg shadow-sm">
      <p className="text-center font-semibold text-lg p-2">
        {currentJob?.name || 'Select a job'}
      </p>
      <div className="flex items-center justify-center space-x-2 py-2">
        {jobs.map((job) => (
          <button
            key={job.id}
            onClick={() => setSelectedJob(job.id)}
            className={`w-3 h-3 rounded-full focus:outline-none transition-colors duration-200 ${
              selectedJob === job.id 
                ? 'bg-blue-600' 
                : 'bg-gray-300 hover:bg-gray-400'
            }`}
            title={job.name}
            aria-label={`Select ${job.name}`}
          />
        ))}
      </div>
    </div>
  );
} 
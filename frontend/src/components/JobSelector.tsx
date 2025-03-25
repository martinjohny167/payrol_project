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
    <div className="bg-white p-4 rounded-lg shadow-sm">
      <div className="flex flex-col space-y-2">
        <h3 className="text-gray-700 font-medium mb-2">Select Job:</h3>
        <div className="flex items-center space-x-4">
          {jobs.map((job) => (
            <button
              key={job.id}
              onClick={() => setSelectedJob(job.id)}
              className={`relative flex items-center justify-center ${
                selectedJob === job.id 
                  ? 'text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              aria-label={`Select ${job.name}`}
              title={job.name}
            >
              {/* Dot */}
              <div 
                className={`h-4 w-4 rounded-full ${
                  selectedJob === job.id 
                    ? 'bg-blue-600' 
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
              ></div>
              
              {/* Job name below the dot */}
              <span 
                className={`absolute mt-6 text-xs whitespace-nowrap ${
                  selectedJob === job.id 
                    ? 'font-medium' 
                    : ''
                }`}
              >
                {job.name}
              </span>
            </button>
          ))}
        </div>
      </div>
      
      {/* Display current selected job */}
      <div className="mt-4 pt-2 border-t border-gray-100">
        <p className="text-sm text-gray-600">
          Current job: <span className="font-medium text-gray-900">{jobs.find(j => j.id === selectedJob)?.name}</span>
        </p>
      </div>
    </div>
  );
} 
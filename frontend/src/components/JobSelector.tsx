'use client';

import { useState, useEffect } from 'react';
import { api, type Job } from '../app/api/apiClient';

interface JobSelectorProps {
  onJobSelect: (jobId: number | null) => void;
}

// Array of distinct colors for the job dots
const DOT_COLORS = [
  'bg-blue-500 hover:bg-blue-600',
  'bg-green-500 hover:bg-green-600',
  'bg-purple-500 hover:bg-purple-600',
  'bg-yellow-500 hover:bg-yellow-600',
  'bg-red-500 hover:bg-red-600',
  'bg-indigo-500 hover:bg-indigo-600',
  'bg-pink-500 hover:bg-pink-600',
  'bg-orange-500 hover:bg-orange-600',
];

export default function JobSelector({ onJobSelect }: JobSelectorProps) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await api.jobs.getAll();
        setJobs(response.data);
        
        // Set total view as default
        setSelectedJob(null);
        
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
      <div className="flex items-center justify-center space-x-2">
        <div className="w-3 h-3 rounded-full bg-gray-300 animate-pulse"></div>
        <div className="w-3 h-3 rounded-full bg-gray-300 animate-pulse"></div>
        <div className="w-3 h-3 rounded-full bg-gray-300 animate-pulse"></div>
      </div>
    );
  }

  if (error) {
    return null; // Hide error state completely
  }

  // Get the first letter of a job name
  const getFirstLetter = (name: string): string => {
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className="flex items-center justify-center space-x-3 my-4">
      {/* Total button */}
      <button
        onClick={() => setSelectedJob(null)}
        className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-medium text-xs focus:outline-none transition-all duration-200 ${
          selectedJob === null 
            ? 'bg-gradient-to-r from-purple-500 to-blue-500 ring-2 ring-gray-200 shadow-md' 
            : 'bg-gradient-to-r from-purple-500/60 to-blue-500/60 hover:from-purple-500 hover:to-blue-500'
        }`}
        title="Total (All Jobs)"
        aria-label="Show total for all jobs"
      >
        ALL
      </button>

      {/* Individual job buttons */}
      {jobs.map((job, index) => {
        // Get color from array, or use a default if we run out of colors
        const colorClass = DOT_COLORS[index % DOT_COLORS.length];
        const baseColor = colorClass.split(' ')[0]; // Get just the base color class
        
        return (
          <button
            key={job.id}
            onClick={() => setSelectedJob(job.id)}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-medium text-xs focus:outline-none transition-all duration-200 ${
              selectedJob === job.id 
                ? `${baseColor} ring-2 ring-gray-200 shadow-md` 
                : `${baseColor}/60 hover:${baseColor}`
            }`}
            title={job.name}
            aria-label={`Select ${job.name}`}
          >
            {getFirstLetter(job.name)}
          </button>
        );
      })}
    </div>
  );
} 
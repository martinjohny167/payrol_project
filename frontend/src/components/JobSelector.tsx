'use client';

import { useState, useEffect } from 'react';
import { api, type Job } from '../app/api/apiClient';

interface JobSelectorProps {
  onJobSelect: (jobId: number | null) => void;
}

// Array of distinct colors for the job dots
const DOT_COLORS = [
  'bg-blue-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-yellow-500',
  'bg-red-500',
  'bg-indigo-500',
  'bg-pink-500',
  'bg-orange-500',
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
    <div className="flex items-center justify-center space-x-3 my-4 bg-white/20 backdrop-blur-lg py-3 px-5 rounded-full shadow-md">
      {/* Total button */}
      <button
        onClick={() => setSelectedJob(null)}
        className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-medium text-xs transition-all duration-300 ${
          selectedJob === null 
            ? 'bg-gradient-to-r from-purple-500 to-blue-500 transform scale-110 shadow-md' 
            : 'bg-gradient-to-r from-purple-500/80 to-blue-500/80 hover:scale-105'
        }`}
        title="Total (All Jobs)"
        aria-label="Show total for all jobs"
      >
        ALL
      </button>

      {/* Individual job buttons */}
      {jobs.map((job, index) => {
        // Get color from array, or use a default if we run out of colors
        const baseColor = DOT_COLORS[index % DOT_COLORS.length];
        const isSelected = selectedJob === job.id;
        
        return (
          <button
            key={job.id}
            onClick={() => setSelectedJob(job.id)}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-medium text-xs transition-all duration-300 ${baseColor} ${
              isSelected 
                ? 'transform scale-110 shadow-md' 
                : 'opacity-80 hover:opacity-100 hover:scale-105'
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
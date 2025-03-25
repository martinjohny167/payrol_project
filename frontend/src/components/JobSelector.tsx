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

  return (
    <div className="flex items-center justify-center space-x-3">
      {/* Total button */}
      <button
        onClick={() => setSelectedJob(null)}
        className={`w-5 h-5 rounded-full focus:outline-none transition-colors duration-200 ring-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 ${
          selectedJob === null 
            ? 'ring-gray-400' 
            : 'opacity-50 ring-transparent'
        }`}
        title="Total (All Jobs)"
        aria-label="Show total for all jobs"
      />

      {/* Individual job buttons */}
      {jobs.map((job, index) => {
        // Get color from array, or use a default if we run out of colors
        const colorClass = DOT_COLORS[index % DOT_COLORS.length];
        
        return (
          <button
            key={job.id}
            onClick={() => setSelectedJob(job.id)}
            className={`w-4 h-4 rounded-full focus:outline-none transition-colors duration-200 ring-2 ${
              selectedJob === job.id 
                ? `${colorClass} ring-gray-400` 
                : `${colorClass} opacity-50 ring-transparent`
            }`}
            title={job.name}
            aria-label={`Select ${job.name}`}
          />
        );
      })}
    </div>
  );
} 
'use client';

import { useState, useEffect } from 'react';
import { api, type Job } from '../app/api/apiClient';

interface JobSelectorProps {
  jobs: Job[];
  selectedJobId: number | null;
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

export default function JobSelector({ jobs, selectedJobId, onJobSelect }: JobSelectorProps) {
  // No need for local state, loading or error as we're getting jobs from the parent component

  const handleJobSelect = (jobId: number | null) => {
    onJobSelect(jobId);
  };

  if (!jobs || jobs.length === 0) {
    return (
      <div className="flex items-center justify-center space-x-2">
        <div className="w-3 h-3 rounded-full bg-gray-300 animate-pulse"></div>
        <div className="w-3 h-3 rounded-full bg-gray-300 animate-pulse"></div>
        <div className="w-3 h-3 rounded-full bg-gray-300 animate-pulse"></div>
      </div>
    );
  }

  // Get the first letter of a job name
  const getFirstLetter = (name: string): string => {
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className="bg-gradient-to-b from-[rgba(242,246,252,0.8)] to-[rgba(240,244,250,0.65)] backdrop-blur-xl p-3 rounded-xl shadow-sm mb-8 border border-[rgba(229,231,235,0.4)]">
      <div className="flex space-x-4">
        <button
          onClick={() => handleJobSelect(null)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition duration-200 
            ${selectedJobId === null 
              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm transform scale-105' 
              : 'text-gray-700 hover:bg-white/30'
            }`}
        >
          All Jobs
        </button>
        
        {jobs.map((job) => (
          <button
            key={job.id}
            onClick={() => handleJobSelect(job.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition duration-200 
              ${selectedJobId === job.id 
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm transform scale-105' 
                : 'text-gray-700 hover:bg-white/30'
              }`}
          >
            {job.name}
          </button>
        ))}
      </div>
    </div>
  );
} 
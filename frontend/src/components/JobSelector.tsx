'use client';

import { useState, useEffect } from 'react';
import { api, type Job } from '../app/api/apiClient';

interface JobSelectorProps {
  jobs: Job[];
  selectedJobId: number | null;
  onJobSelect: (jobId: number | null) => void;
}

// Array of distinct colors for the job dots - iOS style frosted glass gradients
const DOT_COLORS = [
  'bg-gradient-to-br from-[#007AFF]/80 to-[#0055FF]/80', // iOS Blue
  'bg-gradient-to-br from-[#34C759]/80 to-[#32A852]/80', // iOS Green
  'bg-gradient-to-br from-[#AF52DE]/80 to-[#9841C9]/80', // iOS Purple
  'bg-gradient-to-br from-[#FF9500]/80 to-[#F27900]/80', // iOS Orange
  'bg-gradient-to-br from-[#FF2D55]/80 to-[#E0234E]/80', // iOS Pink/Red
  'bg-gradient-to-br from-[#5856D6]/80 to-[#4841BC]/80', // iOS Indigo
  'bg-gradient-to-br from-[#FF3B30]/80 to-[#E0321C]/80', // iOS Red
  'bg-gradient-to-br from-[#5AC8FA]/80 to-[#4095D6]/80', // iOS Light Blue
];

export default function JobSelector({ jobs, selectedJobId, onJobSelect }: JobSelectorProps) {
  // Get the first letter of a job name
  const getFirstLetter = (name: string): string => {
    return name.charAt(0).toUpperCase();
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

  return (
    <div className="flex items-center space-x-2">
      {/* All Jobs button */}
      <button
        onClick={() => onJobSelect(null)}
        className={`transition-all duration-500 flex items-center justify-center shadow-sm backdrop-blur-md border border-white/20
          ${selectedJobId === null 
            ? 'px-2 py-0.5 rounded-lg text-xs bg-gradient-to-r from-[#007AFF]/90 to-[#0055FF]/90 text-white min-w-[60px] dynamic-island-expand' 
            : 'w-6 h-6 rounded-full bg-gradient-to-r from-[#007AFF]/60 to-[#0055FF]/60 text-white font-medium text-[10px] hover:opacity-100'
          }`}
        aria-label="Show all jobs"
      >
        {selectedJobId === null ? 'All Jobs' : 'ALL'}
      </button>
      
      {/* Individual job dots/buttons */}
      {jobs.map((job, index) => {
        const baseColor = DOT_COLORS[index % DOT_COLORS.length];
        const isSelected = selectedJobId === job.id;
        
        return (
          <button
            key={job.id}
            onClick={() => onJobSelect(job.id)}
            className={`transition-all duration-500 flex items-center justify-center shadow-sm backdrop-blur-xl border border-white/20
              ${isSelected 
                ? 'px-2 py-0.5 rounded-lg text-xs text-white min-w-[60px] dynamic-island-expand' 
                : 'w-6 h-6 rounded-full text-white font-medium text-[10px] hover:opacity-100'
              } ${baseColor} ${
                isSelected ? 'ring-1 ring-white/40 scale-110' : 'opacity-70 hover:scale-105 hover:opacity-90'
              }`}
            aria-label={`Select ${job.name}`}
            title={job.name}
          >
            {isSelected ? job.name : getFirstLetter(job.name)}
          </button>
        );
      })}
    </div>
  );
} 
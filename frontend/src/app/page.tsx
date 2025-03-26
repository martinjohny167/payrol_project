'use client';

import { useState, useEffect } from 'react';
import TimeActivity from '../components/TimeActivity';
import EntryExitDashboard from '../components/EntryExitDashboard';
import HoursDashboard from '../components/HoursDashboard';
import EarningsDashboard from '../components/EarningsDashboard';
import JobSelector from '../components/JobSelector';
import { api, type Job } from '../app/api/apiClient';

export default function Home() {
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [currentJob, setCurrentJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch job details whenever selectedJobId changes
  useEffect(() => {
    const fetchJobDetails = async () => {
      // If null is selected, it represents "Total" (all jobs)
      if (selectedJobId === null) {
        setCurrentJob(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await api.jobs.getById(selectedJobId);
        setCurrentJob(response.data);
      } catch (error) {
        console.error('Error fetching job details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchJobDetails();
  }, [selectedJobId]);

  // Get the title based on selection
  const getTitle = () => {
    if (loading) return 'Payroll';
    if (selectedJobId === null) return 'Payroll: All Jobs';
    return `Payroll: ${currentJob?.name || ''}`;
  };

  return (
    <main className="min-h-screen p-8 bg-blue-waves">
      <div className="wave-element wave-1"></div>
      <div className="wave-element wave-2"></div>
      <div className="wave-element wave-3"></div>
      <div className="wave-element wave-4"></div>
      <div className="wave-element wave-5"></div>
      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center mr-4 text-white shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-white drop-shadow-md">
              {getTitle()}
            </h1>
          </div>
          <JobSelector onJobSelect={(jobId) => setSelectedJobId(jobId)} />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <HoursDashboard selectedJobId={selectedJobId} />
          <EarningsDashboard selectedJobId={selectedJobId} />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <TimeActivity selectedJobId={selectedJobId} />
          <EntryExitDashboard selectedJobId={selectedJobId} />
        </div>
      </div>
    </main>
  );
}

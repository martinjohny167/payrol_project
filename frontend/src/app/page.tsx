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
  
  // Add jobs state
  const [jobs, setJobs] = useState<Job[]>([]);

  // Add useEffect to fetch jobs
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await api.jobs.getAll();
        setJobs(response.data);
      } catch (error) {
        console.error('Error fetching jobs:', error);
      }
    };

    fetchJobs();
  }, []);

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
    <main className="flex min-h-screen flex-col bg-blue-waves relative">
      <div className="flex flex-col items-center py-8 px-4 sm:px-6 lg:px-8 w-full relative z-10 max-w-7xl mx-auto">
        <div className="bg-gradient-to-b from-[rgba(242,246,252,0.9)] to-[rgba(240,244,250,0.75)] backdrop-blur-xl px-6 py-4 rounded-2xl flex items-center mb-8 shadow-sm w-full max-w-2xl mx-auto">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mr-4 shadow-md">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Payroll Dashboard</h1>
        </div>
        
        <JobSelector 
          jobs={jobs} 
          selectedJobId={selectedJobId} 
          onJobSelect={setSelectedJobId} 
        />
      </div>
      
      <div className="wave-element wave-1"></div>
      <div className="wave-element wave-2"></div>
      <div className="wave-element wave-3"></div>
      <div className="wave-element wave-4"></div>
      <div className="wave-element wave-5"></div>
      
      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
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

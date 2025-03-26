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
    <main className="h-screen flex flex-col overflow-hidden bg-blue-waves relative">
      <header className="w-full bg-gradient-to-b from-[rgba(242,246,252,0.8)] to-[rgba(240,244,250,0.65)] backdrop-blur-xl py-2 px-6 flex justify-between items-center z-20 relative">
        <div className="flex items-center">
          <h1 className="text-gray-800 text-2xl font-semibold tracking-tight">Payroll</h1>
        </div>
        <div className="flex-1 flex justify-center">
          <JobSelector 
            jobs={jobs} 
            selectedJobId={selectedJobId} 
            onJobSelect={setSelectedJobId} 
          />
        </div>
        <div className="flex space-x-4">
          <div className="w-7 h-7 header-button rounded-full flex items-center justify-center">
            <svg viewBox="0 0 99.61 99.657" xmlns="http://www.w3.org/2000/svg" className="text-gray-700 h-4 w-4" aria-hidden="true">
              <path fill="currentColor" d="M49.805 99.61c27.246 0 49.805-22.608 49.805-49.805C99.61 22.559 77.002 0 49.756 0 22.56 0 0 22.559 0 49.805c0 27.197 22.608 49.804 49.805 49.804Z"></path>
              <path fill="#fff" d="M49.805 58.887c-2.54 0-3.955-1.416-4.004-4.004l-.635-26.612c-.049-2.587 1.856-4.443 4.59-4.443 2.686 0 4.688 1.904 4.639 4.492l-.684 26.563c-.049 2.636-1.465 4.004-3.906 4.004ZM49.805 75.244c-2.93 0-5.469-2.344-5.469-5.225 0-2.88 2.49-5.273 5.469-5.273 2.978 0 5.469 2.344 5.469 5.273 0 2.93-2.54 5.225-5.47 5.225Z"></path>
            </svg>
          </div>
          <div className="w-7 h-7 header-button rounded-full flex items-center justify-center">
            <svg className="text-gray-700 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="currentColor" d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="w-7 h-7 header-button rounded-full flex items-center justify-center">
            <svg className="text-gray-700 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="currentColor" d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      </header>
      
      <div className="wave-element wave-1"></div>
      <div className="wave-element wave-2"></div>
      <div className="wave-element wave-3"></div>
      <div className="wave-element wave-4"></div>
      <div className="wave-element wave-5"></div>
      
      <div className="flex-1 p-3 overflow-hidden relative z-10">
        <div className="h-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-3">
          <HoursDashboard selectedJobId={selectedJobId} />
          <EarningsDashboard selectedJobId={selectedJobId} />
          <TimeActivity selectedJobId={selectedJobId} />
          <EntryExitDashboard selectedJobId={selectedJobId} />
        </div>
      </div>
    </main>
  );
}

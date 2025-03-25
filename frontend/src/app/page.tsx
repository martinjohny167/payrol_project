'use client';

import { useState, useEffect } from 'react';
import TimeActivity from '../components/TimeActivity';
import EntryExitDashboard from '../components/EntryExitDashboard';
import HoursDashboard from '../components/HoursDashboard';
import EarningsDashboard from '../components/EarningsDashboard';
import JobSelector from '../components/JobSelector';
import { api, type Job } from '../app/api/apiClient';

export default function Home() {
  const [selectedJobId, setSelectedJobId] = useState<number>(1);
  const [currentJob, setCurrentJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch job details whenever selectedJobId changes
  useEffect(() => {
    const fetchJobDetails = async () => {
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

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            {loading ? 'Loading...' : `Payroll: ${currentJob?.name || 'Dashboard'}`}
          </h1>
          <div className="w-64">
            <JobSelector onJobSelect={(jobId) => setSelectedJobId(jobId)} />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <TimeActivity selectedJobId={selectedJobId} />
          <EntryExitDashboard selectedJobId={selectedJobId} />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <HoursDashboard selectedJobId={selectedJobId} />
          <EarningsDashboard selectedJobId={selectedJobId} />
        </div>
      </div>
    </main>
  );
}

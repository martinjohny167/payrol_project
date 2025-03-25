'use client';

import { useState } from 'react';
import TimeActivity from '../components/TimeActivity';
import EntryExitDashboard from '../components/EntryExitDashboard';
import HoursDashboard from '../components/HoursDashboard';
import EarningsDashboard from '../components/EarningsDashboard';
import JobSelector from '../components/JobSelector';

export default function Home() {
  const [selectedJobId, setSelectedJobId] = useState<number>(1); // Default to job ID 1

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold text-gray-900">Payroll Dashboard</h1>
          <JobSelector onJobSelect={(jobId) => setSelectedJobId(jobId)} />
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

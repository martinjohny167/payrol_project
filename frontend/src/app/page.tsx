'use client';

import TimeActivity from '../components/TimeActivity';
import EntryExitDashboard from '../components/EntryExitDashboard';
import HoursDashboard from '../components/HoursDashboard';
import EarningsDashboard from '../components/EarningsDashboard';

export default function Home() {
  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold text-gray-900">Payroll Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <TimeActivity />
          <EntryExitDashboard />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <HoursDashboard />
          <EarningsDashboard />
        </div>
      </div>
    </main>
  );
}

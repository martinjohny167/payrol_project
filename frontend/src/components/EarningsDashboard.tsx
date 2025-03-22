'use client';

import { useState, useEffect } from 'react';
import { api } from '@/app/api/apiClient';
import axios from 'axios';

interface EarningsData {
  total: number;
  weekly: number;
}

export default function EarningsDashboard() {
  const [earningsData, setEarningsData] = useState<EarningsData>({ total: 0, weekly: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const userId = 4; // Replace with actual user ID from authentication

  const fetchEarningsData = async () => {
    try {
      setLoading(true);
      console.log('Fetching earnings data for user:', userId);
      
      const [totalResponse, weeklyResponse] = await Promise.all([
        api.earnings.getTotal(userId),
        api.earnings.getWeekly(userId)
      ]);

      console.log('Total earnings response:', totalResponse.data);
      console.log('Weekly earnings response:', weeklyResponse.data);

      // Check if the values are numbers
      const totalEarned = Number(totalResponse.data.total_earned) || 0;
      const weeklyEarnings = Number(weeklyResponse.data.weekly_earnings) || 0;

      console.log('Parsed total earnings:', totalEarned);
      console.log('Parsed weekly earnings:', weeklyEarnings);

      setEarningsData({
        total: totalEarned,
        weekly: weeklyEarnings
      });

      console.log('Updated earnings data:', {
        total: totalEarned,
        weekly: weeklyEarnings
      });
    } catch (err) {
      console.error('Full error object:', err);
      if (axios.isAxiosError(err)) {
        console.error('API Error details:', {
          status: err.response?.status,
          data: err.response?.data,
          headers: err.response?.headers
        });
        setError(`Failed to fetch earnings data: ${err.response?.data?.error || err.message}`);
      } else {
        setError('Failed to fetch earnings data');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEarningsData();
    // Refresh data every minute
    const interval = setInterval(fetchEarningsData, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="p-4">Loading earnings data...</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Earnings Overview</h2>
      <div className="grid grid-cols-2 gap-6">
        <div className="p-6 bg-white rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-600">Weekly Earnings</h3>
          <p className="text-3xl font-bold mt-2">{formatCurrency(earningsData.weekly)}</p>
        </div>
        <div className="p-6 bg-white rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-600">Total Earnings</h3>
          <p className="text-3xl font-bold mt-2">{formatCurrency(earningsData.total)}</p>
        </div>
      </div>
    </div>
  );
} 
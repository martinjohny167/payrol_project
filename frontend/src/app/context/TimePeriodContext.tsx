'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

export type TimePeriod = 'biweekly' | 'monthly';

interface TimePeriodContextType {
  timePeriod: TimePeriod;
  toggleTimePeriod: () => void;
}

const TimePeriodContext = createContext<TimePeriodContextType | undefined>(undefined);

export function TimePeriodProvider({ children }: { children: ReactNode }) {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('biweekly');

  const toggleTimePeriod = () => {
    setTimePeriod(prev => prev === 'biweekly' ? 'monthly' : 'biweekly');
  };

  return (
    <TimePeriodContext.Provider value={{ timePeriod, toggleTimePeriod }}>
      {children}
    </TimePeriodContext.Provider>
  );
}

export function useTimePeriod() {
  const context = useContext(TimePeriodContext);
  if (context === undefined) {
    throw new Error('useTimePeriod must be used within a TimePeriodProvider');
  }
  return context;
} 
'use client';

import { useTimePeriod } from '../app/context/TimePeriodContext';

export default function TimePeriodToggle() {
  const { timePeriod, toggleTimePeriod } = useTimePeriod();

  return (
    <div className="inline-flex items-center">
      <button
        onClick={toggleTimePeriod}
        className="flex items-center justify-center px-4 py-2 text-sm font-medium bg-white border rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        <span className="mr-2">
          {timePeriod === 'biweekly' ? 'Bi-Weekly' : 'Monthly'}
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 text-gray-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
          />
        </svg>
      </button>
    </div>
  );
} 
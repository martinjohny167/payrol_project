import axios from 'axios';

// Define interfaces for your data types
interface TimeEntry {
  id?: number;
  user_id: number;
  job_id: number;
  punch_in_time?: string;
  punch_out_time?: string;
  hours_after_break: number;
}

interface EntryExit {
  entry_time: string;
  exit_time: string;
  entry_date: string;
}

interface DailyStat {
  date: string;
  entry_count: number;
  avg_hours: number;
}

interface Hours {
  id?: number;
  user_id: number;
  date: string;
  hours_worked: number;
}

interface Earnings {
  id?: number;
  user_id: number;
  amount: number;
  period_start: string;
  period_end: string;
}

// Create the base axios instance
const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for handling errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

// API endpoints with type safety
export const api = {
  // Time Entry endpoints
  timeEntry: {
    getAll: () => {
      console.log('Calling getAll with URL:', `${baseURL}/api/activity`);
      return apiClient.get<TimeEntry[]>('/api/activity');
    },
    create: (data: Omit<TimeEntry, 'id'>) => {
      console.log('Calling create with URL:', `${baseURL}/api/activity`, 'data:', data);
      return apiClient.post<TimeEntry>('/api/activity', data);
    },
    update: (id: number, data: Partial<TimeEntry>) => {
      console.log('Calling update with URL:', `${baseURL}/api/activity/${id}`, 'data:', data);
      return apiClient.put<TimeEntry>(`/api/activity/${id}`, data);
    },
    delete: (id: number) => {
      console.log('Calling delete with URL:', `${baseURL}/api/activity/${id}`);
      return apiClient.delete(`/api/activity/${id}`);
    },
  },

  // Entry/Exit endpoints
  entryExit: {
    getLatest: (userId: number) => {
      console.log('Calling getLatest with URL:', `${baseURL}/api/entry-exit/latest/${userId}`);
      return apiClient.get<EntryExit>(`/api/entry-exit/latest/${userId}`);
    },
    getRecent: (userId: number) => {
      console.log('Calling getRecent with URL:', `${baseURL}/api/entry-exit/recent/${userId}`);
      return apiClient.get<EntryExit[]>(`/api/entry-exit/recent/${userId}`);
    },
    getDailyStats: (userId: number) => {
      console.log('Calling getDailyStats with URL:', `${baseURL}/api/entry-exit/daily/${userId}`);
      return apiClient.get<DailyStat[]>(`/api/entry-exit/daily/${userId}`);
    },
  },

  // Hours endpoints
  hours: {
    getTotal: (userId: number) => {
      console.log('Calling getTotal with URL:', `${baseURL}/api/hours/total/${userId}`);
      return apiClient.get<{ jobs: Array<{ job_id: number; job_name: string; total_hours: number }> }>(`/api/hours/total/${userId}`);
    },
    getWeekly: (userId: number) => {
      console.log('Calling getWeekly with URL:', `${baseURL}/api/hours/weekly/${userId}`);
      return apiClient.get<{ jobs: Array<{ job_id: number; job_name: string; weekly_hours: number }> }>(`/api/hours/weekly/${userId}`);
    },
  },

  // Earnings endpoints
  earnings: {
    getTotal: (userId: number) => {
      console.log('Calling getTotal with URL:', `${baseURL}/api/earnings/total/${userId}`);
      return apiClient.get<{ total_earned: number }>(`/api/earnings/total/${userId}`);
    },
    getWeekly: (userId: number) => {
      console.log('Calling getWeekly with URL:', `${baseURL}/api/earnings/weekly/${userId}`);
      return apiClient.get<{ weekly_earnings: number }>(`/api/earnings/weekly/${userId}`);
    },
  },
};

export type { TimeEntry, EntryExit, DailyStat, Hours, Earnings };
export default apiClient; 
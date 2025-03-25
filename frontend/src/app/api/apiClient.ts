import axios from 'axios';

// Define interfaces for your data types
interface Job {
  id: number;
  name: string;
}

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
  job_id: number;
  job_name: string;
}

interface DailyStat {
  date: string;
  job_id: number;
  job_name: string;
  entry_count: number;
  avg_hours: number;
  avg_entry_time: string;
  avg_exit_time: string;
  daily_pay: number;
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
  // Job endpoints
  jobs: {
    getAll: () => {
      console.log('Calling getAll jobs with URL:', `${baseURL}/api/jobs`);
      return apiClient.get<Job[]>('/api/jobs');
    },
    getById: (id: number) => {
      console.log('Calling getById job with URL:', `${baseURL}/api/jobs/${id}`);
      return apiClient.get<Job>(`/api/jobs/${id}`);
    }
  },

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
    getLatestByJob: (userId: number, jobId: number) => {
      console.log('Calling getLatestByJob with URL:', `${baseURL}/api/entry-exit/latest/${userId}/job/${jobId}`);
      return apiClient.get<EntryExit>(`/api/entry-exit/latest/${userId}/job/${jobId}`);
    },
    getRecent: (userId: number) => {
      console.log('Calling getRecent with URL:', `${baseURL}/api/entry-exit/recent/${userId}`);
      return apiClient.get<EntryExit[]>(`/api/entry-exit/recent/${userId}`);
    },
    getRecentByJob: (userId: number, jobId: number) => {
      console.log('Calling getRecentByJob with URL:', `${baseURL}/api/entry-exit/recent/${userId}/job/${jobId}`);
      return apiClient.get<EntryExit[]>(`/api/entry-exit/recent/${userId}/job/${jobId}`);
    },
    getDailyStats: (userId: number) => {
      console.log('Calling getDailyStats with URL:', `${baseURL}/api/entry-exit/daily/${userId}`);
      return apiClient.get<DailyStat[]>(`/api/entry-exit/daily/${userId}`);
    },
    getDailyStatsByJob: (userId: number, jobId: number) => {
      console.log('Calling getDailyStatsByJob with URL:', `${baseURL}/api/entry-exit/daily/${userId}/job/${jobId}`);
      return apiClient.get<DailyStat[]>(`/api/entry-exit/daily/${userId}/job/${jobId}`);
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
    getBiWeekly: (userId: number) => {
      console.log('Calling getBiWeekly with URL:', `${baseURL}/api/hours/biweekly/${userId}`);
      return apiClient.get<{ jobs: Array<{ job_id: number; job_name: string; biweekly_hours: number }> }>(`/api/hours/biweekly/${userId}`);
    },
    getMonthly: (userId: number) => {
      console.log('Calling getMonthly with URL:', `${baseURL}/api/hours/monthly/${userId}`);
      return apiClient.get<{ jobs: Array<{ job_id: number; job_name: string; monthly_hours: number }> }>(`/api/hours/monthly/${userId}`);
    },
    getBiWeeklyByJob: (userId: number, jobId: number) => {
      console.log('Calling getBiWeeklyByJob with URL:', `${baseURL}/api/hours/biweekly/${userId}/job/${jobId}`);
      return apiClient.get<{ biweekly_hours: number }>(`/api/hours/biweekly/${userId}/job/${jobId}`);
    },
    getMonthlyByJob: (userId: number, jobId: number) => {
      console.log('Calling getMonthlyByJob with URL:', `${baseURL}/api/hours/monthly/${userId}/job/${jobId}`);
      return apiClient.get<{ monthly_hours: number }>(`/api/hours/monthly/${userId}/job/${jobId}`);
    },
  },

  // Earnings endpoints
  earnings: {
    getTotal: (userId: number) => {
      console.log('Calling getTotal with URL:', `${baseURL}/api/earnings/total/${userId}`);
      return apiClient.get<{ jobs: Array<{ job_id: number; job_name: string; total_earnings: number }> }>(`/api/earnings/total/${userId}`);
    },
    getWeekly: (userId: number) => {
      console.log('Calling getWeekly with URL:', `${baseURL}/api/earnings/weekly/${userId}`);
      return apiClient.get<{ jobs: Array<{ job_id: number; job_name: string; weekly_earnings: number }> }>(`/api/earnings/weekly/${userId}`);
    },
    getBiWeekly: (userId: number) => {
      console.log('Calling getBiWeekly with URL:', `${baseURL}/api/earnings/biweekly/${userId}`);
      return apiClient.get<{ jobs: Array<{ job_id: number; job_name: string; biweekly_earnings: number }> }>(`/api/earnings/biweekly/${userId}`);
    },
    getMonthly: (userId: number) => {
      console.log('Calling getMonthly with URL:', `${baseURL}/api/earnings/monthly/${userId}`);
      return apiClient.get<{ jobs: Array<{ job_id: number; job_name: string; monthly_earnings: number }> }>(`/api/earnings/monthly/${userId}`);
    },
    getTotalByJob: (userId: number, jobId: number) => {
      console.log('Calling getTotalByJob with URL:', `${baseURL}/api/earnings/total/${userId}/job/${jobId}`);
      return apiClient.get<{ total_earnings: number }>(`/api/earnings/total/${userId}/job/${jobId}`);
    },
    getWeeklyByJob: (userId: number, jobId: number) => {
      console.log('Calling getWeeklyByJob with URL:', `${baseURL}/api/earnings/weekly/${userId}/job/${jobId}`);
      return apiClient.get<{ weekly_earnings: number }>(`/api/earnings/weekly/${userId}/job/${jobId}`);
    },
    getBiWeeklyByJob: (userId: number, jobId: number) => {
      console.log('Calling getBiWeeklyByJob with URL:', `${baseURL}/api/earnings/biweekly/${userId}/job/${jobId}`);
      return apiClient.get<{ biweekly_earnings: number }>(`/api/earnings/biweekly/${userId}/job/${jobId}`);
    },
    getMonthlyByJob: (userId: number, jobId: number) => {
      console.log('Calling getMonthlyByJob with URL:', `${baseURL}/api/earnings/monthly/${userId}/job/${jobId}`);
      return apiClient.get<{ monthly_earnings: number }>(`/api/earnings/monthly/${userId}/job/${jobId}`);
    },
  },
};

export type { Job, TimeEntry, EntryExit, DailyStat, Hours, Earnings };
export default apiClient; 
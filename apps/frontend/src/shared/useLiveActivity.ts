import { useEffect, useState, useCallback } from 'react';

interface LiveActivity {
  id: string;
  message: string;
  employee_name: string;
  cluster: string;
  metric: string;
  achievement: number;
  unit?: string;
  variable_pay: number;
  date: string;
  timestamp: string;
}

export function useLiveActivity() {
  const [activities, setActivities] = useState<LiveActivity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLiveActivity = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/dashboard/live-activity');
      const result = await response.json();
      
      if (result.success) {
        setActivities(result.data);
      } else {
        setError(result.error || 'Failed to fetch live activity');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchLiveActivity();
    
    // Set up polling every 60 seconds
    const interval = setInterval(fetchLiveActivity, 60000);
    
    return () => clearInterval(interval);
  }, [fetchLiveActivity]);

  return {
    activities,
    isLoading,
    error,
    refetch: fetchLiveActivity
  };
}

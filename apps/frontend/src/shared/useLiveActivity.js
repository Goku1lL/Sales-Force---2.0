import { useEffect, useState, useCallback } from 'react';
export function useLiveActivity() {
    const [activities, setActivities] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const fetchLiveActivity = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await fetch('/api/dashboard/live-activity');
            const result = await response.json();
            if (result.success) {
                setActivities(result.data);
            }
            else {
                setError(result.error || 'Failed to fetch live activity');
            }
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        }
        finally {
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

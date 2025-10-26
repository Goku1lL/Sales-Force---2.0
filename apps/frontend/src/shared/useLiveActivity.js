import { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
export function useLiveActivity() {
    const [activities, setActivities] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const { token } = useSelector((state) => state.auth);
    const fetchLiveActivity = useCallback(async () => {
        // Don't fetch if user is not authenticated
        if (!token) {
            setActivities([]);
            setIsLoading(false);
            return;
        }
        try {
            setIsLoading(true);
            setError(null);
            const baseUrl = process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:3000/api/v1';
            const response = await fetch(`${baseUrl}/dashboard/live-activity`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const result = await response.json();
            if (result.status === 'success') {
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
    }, [token]);
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

/**
 * React hooks for event tracking
 */

import { useEffect, useRef } from 'react';
import { eventTracker } from '../services/eventTracker';

/**
 * Track page view on component mount
 */
export const usePageView = (pageName: string, metadata?: Record<string, any>) => {
  // Use ref to track if we've already logged this page view
  const hasTracked = useRef(false);

  useEffect(() => {
    if (!hasTracked.current) {
      eventTracker.track('page_view', { 
        page: pageName,
        ...metadata 
      });
      hasTracked.current = true;
    }
  }, [pageName, metadata]);
};

/**
 * Hook to get event tracking function
 */
export const useEventTracking = () => {
  return {
    track: (eventName: string, metadata?: Record<string, any>) => {
      eventTracker.track(eventName, metadata);
    }
  };
};

/**
 * Track component mount/unmount
 */
export const useComponentLifecycle = (componentName: string) => {
  const mountTime = useRef<number>(Date.now());

  useEffect(() => {
    eventTracker.track('component_mounted', { component: componentName });

    return () => {
      const duration = Date.now() - mountTime.current;
      eventTracker.track('component_unmounted', { 
        component: componentName,
        duration_ms: duration 
      });
    };
  }, [componentName]);
};


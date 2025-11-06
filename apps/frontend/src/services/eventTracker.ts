/**
 * Event Tracking Service
 * 
 * Tracks user events and sends them to the backend in batches.
 * Features:
 * - Non-blocking: Events are sent asynchronously
 * - Batched: Reduces server load by sending events in groups
 * - Graceful failure: Errors don't break the user experience
 * - Auto-flush: Sends events periodically or when queue is full
 */

interface EventPayload {
  event_name: string;
  meta_data?: Record<string, any>;
}

interface BatchEventPayload {
  employee_id: string;
  events: EventPayload[];
}

class EventTracker {
  private eventQueue: EventPayload[] = [];
  private flushInterval = 10000; // 10 seconds
  private maxQueueSize = 50;
  private employeeId: string | null = null;
  private flushTimer: NodeJS.Timeout | null = null;
  private backendUrl: string;

  constructor() {
    // Get backend URL from environment
    this.backendUrl = import.meta.env.VITE_BACKEND_URL || 
      (import.meta.env.DEV 
        ? 'http://localhost:3000/api/v1' 
        : 'https://sales-force-2-0.onrender.com/api/v1');

    // Start periodic flush
    this.startFlushTimer();
    
    // Flush on page unload (use sendBeacon for guaranteed delivery)
    window.addEventListener('beforeunload', () => this.flush(true));
    
    // Flush on visibility change (when user leaves tab)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.flush();
      }
    });
  }

  private startFlushTimer() {
    this.flushTimer = setInterval(() => this.flush(), this.flushInterval);
  }

  /**
   * Set the current employee ID for tracking
   */
  setEmployee(employeeId: string) {
    this.employeeId = employeeId;
    console.log(`📊 Event tracking initialized for employee: ${employeeId}`);
  }

  /**
   * Clear the employee ID (on logout)
   */
  clearEmployee() {
    this.flush(); // Send any remaining events before clearing
    this.employeeId = null;
  }

  /**
   * Track an event
   */
  track(eventName: string, metadata?: Record<string, any>) {
    // Don't track without employee context
    if (!this.employeeId) {
      console.debug('⚠️ Event tracking: No employee ID set, skipping event:', eventName);
      return;
    }
    
    const event: EventPayload = {
      event_name: eventName,
      meta_data: {
        ...metadata,
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent,
        screen_size: `${window.innerWidth}x${window.innerHeight}`,
        url: window.location.pathname,
      }
    };

    this.eventQueue.push(event);
    console.log(`📊 Event queued: ${eventName} (queue: ${this.eventQueue.length}/${this.maxQueueSize})`);

    // Flush if queue is full
    if (this.eventQueue.length >= this.maxQueueSize) {
      this.flush();
    }
  }

  /**
   * Flush events to the backend
   */
  async flush(synchronous = false) {
    if (this.eventQueue.length === 0 || !this.employeeId) return;

    const eventsToSend = [...this.eventQueue];
    this.eventQueue = []; // Clear queue immediately

    const payload: BatchEventPayload = {
      employee_id: this.employeeId,
      events: eventsToSend
    };

    console.log(`📤 Flushing ${eventsToSend.length} events to ${this.backendUrl}/events/track`);

    try {
      if (synchronous) {
        // Use sendBeacon for unload events (guaranteed delivery)
        const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
        const sent = navigator.sendBeacon(`${this.backendUrl}/events/track`, blob);
        console.log(`📡 sendBeacon result: ${sent ? 'success' : 'failed'}`);
      } else {
        // Regular async request (fire and forget)
        const response = await fetch(`${this.backendUrl}/events/track`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          // Don't set keepalive to avoid blocking
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log(`✅ Events sent successfully:`, result);
        } else {
          console.warn(`⚠️ Event tracking response: ${response.status} ${response.statusText}`);
        }
      }
    } catch (error) {
      // Silently fail - tracking should never break the app
      console.warn('❌ Event tracking failed:', error);
    }
  }

  /**
   * Manually flush events (useful for testing)
   */
  forceFlush() {
    return this.flush();
  }
}

// Singleton instance
export const eventTracker = new EventTracker();


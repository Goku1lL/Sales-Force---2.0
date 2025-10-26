import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export function useWebSocket(employeeId: number | null, onLiveActivity?: (activities: any[]) => void) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!employeeId) return;

    console.log('🎮 WebSocket connecting to backend port 3000 🎮 - ' + new Date().toISOString());

    const s = io('http://localhost:3000', {
      path: '/socket.io',
      transports: ['websocket'],
      timeout: 5000,
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 1000
    });

    socketRef.current = s;

    s.on('connect', () => {
      console.log('🎮 WebSocket connected successfully!');
      s.emit('subscribe:dashboard', employeeId);
    });

    s.on('connect_error', (error) => {
      console.warn('🎮 WebSocket connection error:', error.message);
    });

    s.on('disconnect', (reason) => {
      console.log('🎮 WebSocket disconnected:', reason);
    });

    // Handle live activity updates
    s.on('live:activity', (activities: any[]) => {
      console.log('🎮 Live activity update received:', activities);
      if (onLiveActivity) {
        onLiveActivity(activities);
      }
    });

    // Handle urgent action updates
    s.on('urgent:action', (actions: any[]) => {
      console.log('🎮 Urgent actions update received:', actions);
      // Could add callback for urgent actions if needed
    });

    return () => {
      console.log('🎮 WebSocket cleanup');
      s.disconnect();
      socketRef.current = null;
    };
  }, [employeeId, onLiveActivity]);

  return socketRef.current;
}

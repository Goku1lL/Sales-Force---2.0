import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
export function useWebSocket(employeeId) {
    const socketRef = useRef(null);
    useEffect(() => {
        if (!employeeId)
            return;
        console.log('🎮 WebSocket connecting to backend port 3000 🎮 - ' + new Date().toISOString());
        const s = io('http://localhost:3000', { path: '/socket.io', transports: ['websocket'] });
        socketRef.current = s;
        s.emit('subscribe:dashboard', employeeId);
        return () => {
            s.disconnect();
            socketRef.current = null;
        };
    }, [employeeId]);
    return socketRef.current;
}

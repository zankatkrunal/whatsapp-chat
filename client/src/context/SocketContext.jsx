import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext.jsx';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { token, isAuthenticated, user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Offline'); // 'Connecting...' | 'Connected' | 'Offline'
  const [onlineStatusMap, setOnlineStatusMap] = useState({}); // userId -> { isOnline: boolean, lastSeen: Date }

  const socketRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
        setConnectionStatus('Offline');
      }
      return;
    }

    setConnectionStatus('Connecting...');

    // Socket.IO connection pointing to backend
    const envSocketUrl = import.meta.env.VITE_SOCKET_URL;
    const envApiUrl = import.meta.env.VITE_API_URL;
    const isVercelHost = typeof window !== 'undefined' && window.location.hostname.endsWith('vercel.app');

    // On Vercel Serverless, WebSockets are not supported natively without a dedicated server.
    // If no dedicated WebSocket server is configured, activate Smart Cloud Sync mode.
    if (!envSocketUrl && isVercelHost) {
      setIsConnected(false);
      setConnectionStatus('Online');
      return;
    }

    const socketUrl = envSocketUrl || (envApiUrl ? envApiUrl.replace(/\/api\/?$/, '') : window.location.origin);
    const socketInstance = io(socketUrl, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      timeout: 20000,
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socketInstance;
    setSocket(socketInstance);

    socketInstance.on('connect', () => {
      setIsConnected(true);
      setConnectionStatus('Connected');
    });

    socketInstance.on('disconnect', (reason) => {
      setIsConnected(false);
      setConnectionStatus('Offline');
    });

    socketInstance.on('connect_error', (err) => {
      setIsConnected(false);
      setConnectionStatus('Offline');
      console.warn('[Socket Connection Error]', err.message);
    });

    socketInstance.on('reconnect_attempt', () => {
      setConnectionStatus('Connecting...');
    });

    socketInstance.on('reconnect', () => {
      setIsConnected(true);
      setConnectionStatus('Connected');
    });

    // Real-time user presence updates
    socketInstance.on('userOnline', ({ userId }) => {
      setOnlineStatusMap((prev) => ({
        ...prev,
        [userId]: { isOnline: true, lastSeen: new Date() },
      }));
    });

    socketInstance.on('userOffline', ({ userId, lastSeen }) => {
      setOnlineStatusMap((prev) => ({
        ...prev,
        [userId]: { isOnline: false, lastSeen: new Date(lastSeen) },
      }));
    });

    socketInstance.on('userStatusChanged', ({ userId, isOnline, lastSeen }) => {
      setOnlineStatusMap((prev) => ({
        ...prev,
        [userId]: { isOnline, lastSeen: new Date(lastSeen) },
      }));
    });

    return () => {
      socketInstance.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, token]);

  // Helper to query presence status for any user
  const getUserPresence = (targetUserId, defaultStatus = {}) => {
    if (!targetUserId) return { isOnline: false, lastSeen: null };
    const live = onlineStatusMap[targetUserId];
    if (live !== undefined) {
      return live;
    }
    return {
      isOnline: Boolean(defaultStatus.isOnline),
      lastSeen: defaultStatus.lastSeen ? new Date(defaultStatus.lastSeen) : null,
    };
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        connectionStatus,
        onlineStatusMap,
        getUserPresence,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

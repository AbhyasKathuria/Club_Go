import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const backendUrl =
      (import.meta as any).env?.VITE_BACKEND_URL ||
      (typeof window !== 'undefined' && window.location.port === '5173'
        ? 'http://localhost:5000'
        : undefined);

    socket = io(backendUrl || '', {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 15,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('⚡ Socket connected:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
      // Suppress benign background and navigation disconnects
      if (
        reason === 'io client disconnect' ||
        reason === 'transport close' ||
        reason === 'transport error' ||
        (typeof document !== 'undefined' && document.visibilityState === 'hidden')
      ) {
        return;
      }
      console.log('🔌 Socket disconnected:', reason);
    });

    // Gracefully handle browser tab visibility and Back-Forward Cache (bfcache)
    if (typeof window !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          if (socket?.connected) {
            socket.disconnect();
          }
        } else if (document.visibilityState === 'visible') {
          if (socket && !socket.connected) {
            socket.connect();
          }
        }
      });

      window.addEventListener('pagehide', () => {
        if (socket?.connected) {
          socket.disconnect();
        }
      });

      window.addEventListener('pageshow', () => {
        if (socket && !socket.connected) {
          socket.connect();
        }
      });
    }
  }

  return socket;
}

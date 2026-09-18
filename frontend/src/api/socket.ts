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
      console.log('🔌 Socket disconnected:', reason);
    });
  }

  return socket;
}

import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { ENV } from '../config/env';

let io: SocketIOServer | null = null;

export function initSocketServer(httpServer: HTTPServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: [ENV.CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173', '*'],
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'], // Fallback transport for strict network firewalls
  });

  io.on('connection', (socket) => {
    console.log(`⚡ WebSocket client connected: ${socket.id}`);

    socket.on('subscribe:dashboard', () => {
      socket.join('dashboard');
      console.log(`📊 Socket ${socket.id} subscribed to live dashboard`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 WebSocket client disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getSocketIO(): SocketIOServer | null {
  return io;
}

export function broadcastAttendanceUpdate(data: {
  type: 'team' | 'individual';
  teamId: string;
  participantId?: string;
  attendanceStatus: string;
  checkedInAt: string;
  participantName?: string;
  teamName?: string;
  schoolCode?: string;
}) {
  if (io) {
    io.emit('attendance:updated', data);
    console.log(`📢 Emitted attendance:updated for ${data.participantName || data.teamName}`);
  }
}

export function broadcastLiveStats(stats: any) {
  if (io) {
    io.emit('stats:updated', stats);
  }
}

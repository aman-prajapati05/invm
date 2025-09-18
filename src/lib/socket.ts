import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const initializeSocket = (): Socket => {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin, {
      path: '/api/socket',
      autoConnect: true,
    });

    socket.on('connect', () => {
      // console.log('🔌 Connected to socket server:', socket?.id);
    });

    socket.on('disconnect', () => {
      // console.log('❌ Disconnected from socket server');
    });

    socket.on('error', (error) => {
      // console.error('Socket error:', error);
    });
  }

  return socket;
};

export const getSocket = (): Socket | null => {
  return socket;
};

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

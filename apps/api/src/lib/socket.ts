import { Server as SocketServer } from 'socket.io';
import type { Server as HttpServer } from 'http';

export function createSocketServer(httpServer: HttpServer) {
  const io = new SocketServer(httpServer, {
    cors: {
      origin: '*',
    },
  });

  io.on('connection', (socket) => {
    socket.on('join-user-room', (userId: string) => {
      socket.join(`user:${userId}`);
    });
  });

  return io;
}

import { Server as SocketServer } from 'socket.io';
import type { Server as HttpServer } from 'http';
import { env } from '../config/env';

export function createSocketServer(httpServer: HttpServer) {
  const io = new SocketServer(httpServer, {
    cors: {
      origin: env.WEB_URL,
    },
  });

  io.on('connection', (socket) => {
    socket.on('join-user-room', (userId: string) => {
      socket.join(`user:${userId}`);
    });
  });

  return io;
}

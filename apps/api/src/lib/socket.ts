import { Server as SocketServer } from 'socket.io';
import type { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export function createSocketServer(httpServer: HttpServer) {
  const io = new SocketServer(httpServer, {
    cors: {
      origin: env.WEB_URL,
    },
  });

  io.on('connection', (socket) => {
    socket.on('join-user-room', (payload: { token: string }) => {
      if (!payload || typeof payload.token !== 'string' || !payload.token.trim()) {
        return;
      }

      try {
        const decoded = jwt.verify(payload.token, env.JWT_ACCESS_SECRET) as { userId?: string };
        const userId = decoded.userId;
        if (!userId) {
          return;
        }
        socket.join(`user:${userId}`);
      } catch {
        return;
      }
    });
  });

  return io;
}

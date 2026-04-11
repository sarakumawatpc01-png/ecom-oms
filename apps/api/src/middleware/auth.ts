import type { FastifyReply, FastifyRequest } from 'fastify';

export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify<{ userId: string; role: string }>();
    const tokenUser = request.user as { userId: string; role: string };
    request.userContext = tokenUser;
  } catch {
    reply.code(401).send({ message: 'Unauthorized' });
  }
}

export function requireRole(roles: string[]) {
  return async function roleGuard(request: FastifyRequest, reply: FastifyReply) {
    if (!request.userContext || !roles.includes(request.userContext.role)) {
      return reply.code(403).send({ message: 'Forbidden' });
    }
  };
}

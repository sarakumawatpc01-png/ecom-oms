import 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    userContext?: {
      userId: string;
      role: string;
    };
  }
}

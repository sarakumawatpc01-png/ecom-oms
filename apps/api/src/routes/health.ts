import type { FastifyPluginAsync } from 'fastify';

const healthRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', async () => ({ status: 'ok', service: 'agencyfic-api' }));
};

export default healthRoutes;

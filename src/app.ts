import Fastify from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { profileRoutes } from './routes/profile.js';

export async function buildApp() {
  const app = Fastify({ logger: true });

  await app.register(swagger, {
    openapi: {
      info: { title: 'LinkedIn Profile API', version: '0.1.0' },
    },
  });
  await app.register(swaggerUi, { routePrefix: '/docs' });

  app.get('/health', {
    schema: { response: { 200: { type: 'object', required: ['status'], properties: { status: { type: 'string' } } } } },
  }, async () => ({ status: 'ok' }));

  await app.register(profileRoutes);
  return app;
}

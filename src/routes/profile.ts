import type { FastifyInstance } from 'fastify';
import { ZodError } from 'zod';
import { AppError } from '../errors.js';
import { LinkedInClient } from '../linkedin/client.js';
import { ProfileService } from '../services/profile-service.js';
import { profileRequestSchema } from '../schemas/profile.js';

const errorSchema = {
  type: 'object',
  required: ['error'],
  properties: {
    error: {
      type: 'object',
      required: ['code', 'message'],
      properties: {
        code: { type: 'string' },
        message: { type: 'string' },
      },
    },
  },
} as const;

export async function profileRoutes(app: FastifyInstance): Promise<void> {
  const service = new ProfileService(new LinkedInClient({
    liAt: process.env.LINKEDIN_LI_AT,
    userAgent: process.env.LINKEDIN_USER_AGENT,
  }));

  app.post('/api/v1/profile', {
    schema: {
      body: {
        type: 'object',
        required: ['url'],
        additionalProperties: false,
        properties: { url: { type: 'string', format: 'uri' } },
      },
      response: {
        200: {
          type: 'object',
          required: ['profile'],
          properties: {
            // The runtime profile shape is validated by Zod in the service
            // layer. Allow its documented fields through Fastify's response
            // serializer instead of serializing the object to an empty value.
            profile: { type: 'object', additionalProperties: true },
          },
        },
        400: errorSchema,
        502: errorSchema,
        503: errorSchema,
      },
    },
  }, async (request, reply) => {
    try {
      const body = profileRequestSchema.parse(request.body);
      return { profile: await service.getProfile(body.url) };
    } catch (error) {
      if (error instanceof ZodError) {
        return reply.status(400).send({ error: { code: 'INVALID_PROFILE_URL', message: error.issues[0]?.message ?? 'Invalid request body.' } });
      }
      if (error instanceof AppError) {
        return reply.status(error.statusCode).send({ error: { code: error.code, message: error.message } });
      }
      throw error;
    }
  });
}

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { isClientAuthorized, sendLoginCode, completeSignIn } from '../telegram/client.js';
import { config } from '../config.js';

export async function authRoutes(fastify: FastifyInstance) {
  // Check authorization status
  fastify.get('/api/auth/status', async () => {
    const isConfigured = Boolean(config.telegram.apiId && config.telegram.apiHash);
    let authorized = false;

    if (isConfigured) {
      try {
        authorized = await isClientAuthorized();
      } catch {
        authorized = false;
      }
    }

    return {
      configured: isConfigured,
      authorized,
    };
  });

  // Send login verification code to phone
  fastify.post('/api/auth/send-code', async (request, reply) => {
    const schema = z.object({
      apiId: z.number().int().positive(),
      apiHash: z.string().min(10),
      phoneNumber: z.string().min(7),
    });

    const parsed = schema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.issues });
    }

    const { apiId, apiHash, phoneNumber } = parsed.data;

    try {
      const result = await sendLoginCode(apiId, apiHash, phoneNumber);
      return { success: true, phoneCodeHash: result.phoneCodeHash };
    } catch (err: unknown) {
      const error = err as Error;
      return reply.status(500).send({ error: error.message || 'Failed to send login code' });
    }
  });

  // Verify code and complete login
  fastify.post('/api/auth/sign-in', async (request, reply) => {
    const schema = z.object({
      phoneNumber: z.string().min(7),
      phoneCodeHash: z.string().min(5),
      code: z.string().min(3),
      password: z.string().optional(),
    });

    const parsed = schema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.issues });
    }

    const { phoneNumber, phoneCodeHash, code, password } = parsed.data;

    try {
      await completeSignIn(phoneNumber, phoneCodeHash, code, password);
      return { success: true, message: 'Logged in successfully' };
    } catch (err: unknown) {
      const error = err as Error;
      return reply.status(400).send({ error: error.message || 'Invalid code or password' });
    }
  });
}

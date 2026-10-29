import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { folderRepo } from '../db/index.js';

export async function folderRoutes(fastify: FastifyInstance) {
  // List folders
  fastify.get('/api/folders', async (request) => {
    const query = request.query as { parentId?: string };
    const parentId = query.parentId ? query.parentId : null;
    return folderRepo.list(parentId);
  });

  // Create folder
  fastify.post('/api/folders', async (request, reply) => {
    const schema = z.object({
      name: z.string().min(1).max(100),
      parentId: z.string().nullable().optional(),
    });

    const parsed = schema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.issues });
    }

    const { name, parentId } = parsed.data;
    const folder = folderRepo.create(name, parentId || null);
    return folder;
  });

  // Rename folder
  fastify.patch('/api/folders/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const schema = z.object({
      name: z.string().min(1).max(100),
    });

    const parsed = schema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.issues });
    }

    folderRepo.rename(id, parsed.data.name);
    return { success: true };
  });

  // Delete folder
  fastify.delete('/api/folders/:id', async (request) => {
    const { id } = request.params as { id: string };
    folderRepo.delete(id);
    return { success: true };
  });
}

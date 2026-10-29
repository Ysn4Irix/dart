import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { shareRepo, fileRepo } from '../db/index.js';
import { streamTelegramFile } from '../telegram/streamer.js';
import { config } from '../config.js';

export async function shareRoutes(fastify: FastifyInstance) {
  // Generate public share link
  fastify.post('/api/shares', async (request, reply) => {
    const schema = z.object({
      fileId: z.string().min(1),
      expiresInHours: z.number().positive().optional(),
    });

    const parsed = schema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.issues });
    }

    const { fileId, expiresInHours } = parsed.data;
    const file = fileRepo.get(fileId);
    if (!file) {
      return reply.status(404).send({ error: 'File not found' });
    }

    const expiresAt = expiresInHours ? Date.now() + expiresInHours * 3600 * 1000 : null;
    const share = shareRepo.create(fileId, expiresAt);

    return {
      share,
      publicUrl: `${config.publicUrl}/s/${share.id}`,
    };
  });

  // Public share metadata preview
  fastify.get('/s/:slug', async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const result = shareRepo.getWithFile(slug);

    if (!result) {
      return reply.status(404).send({ error: 'Share link not found or expired' });
    }

    const { share, file } = result;

    if (share.expires_at && share.expires_at < Date.now()) {
      return reply.status(410).send({ error: 'Share link has expired' });
    }

    return {
      id: share.id,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.mime_type,
      downloadCount: share.download_count,
      createdAt: share.created_at,
      expiresAt: share.expires_at,
      downloadUrl: `/s/${share.id}/download`,
      streamUrl: `/s/${share.id}/stream`,
      telegramMessageId: file.telegram_message_id,
    };
  });

  // Public stream endpoint
  fastify.get('/s/:slug/stream', async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const result = shareRepo.getWithFile(slug);

    if (!result) {
      return reply.status(404).send({ error: 'Share link not found' });
    }

    const { share, file } = result;
    if (share.expires_at && share.expires_at < Date.now()) {
      return reply.status(410).send({ error: 'Share link has expired' });
    }

    return streamTelegramFile(file, request, reply, false);
  });

  // Public download endpoint
  fastify.get('/s/:slug/download', async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const result = shareRepo.getWithFile(slug);

    if (!result) {
      return reply.status(404).send({ error: 'Share link not found' });
    }

    const { share, file } = result;
    if (share.expires_at && share.expires_at < Date.now()) {
      return reply.status(410).send({ error: 'Share link has expired' });
    }

    // Increment download counter
    shareRepo.incrementDownload(share.id);

    return streamTelegramFile(file, request, reply, true);
  });

  // Delete a share link
  fastify.delete('/api/shares/:slug', async (request) => {
    const { slug } = request.params as { slug: string };
    shareRepo.delete(slug);
    return { success: true };
  });
}

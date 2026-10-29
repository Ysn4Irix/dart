import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import fs from 'node:fs';
import path from 'node:os';
import os from 'node:os';
import { pipeline } from 'node:stream/promises';
import { fileRepo } from '../db/index.js';
import { uploadToSavedMessages } from '../telegram/uploader.js';
import { streamTelegramFile } from '../telegram/streamer.js';

export async function fileRoutes(fastify: FastifyInstance) {
  // List files with optional search & folder filtering
  fastify.get('/api/files', async (request) => {
    const query = request.query as { folderId?: string; search?: string };
    const folderId = query.folderId !== undefined ? (query.folderId === 'root' ? null : query.folderId) : null;
    return fileRepo.list(folderId, query.search);
  });

  // Get single file details
  fastify.get('/api/files/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const file = fileRepo.get(id);
    if (!file) {
      return reply.status(404).send({ error: 'File not found' });
    }
    return file;
  });

  // Upload file to Saved Messages
  fastify.post('/api/files/upload', async (request, reply) => {
    const data = await request.file();
    if (!data) {
      return reply.status(400).send({ error: 'No file provided' });
    }

    const folderIdField = data.fields.folderId as { value?: string } | undefined;
    const folderId = folderIdField?.value && folderIdField.value !== 'root' ? folderIdField.value : null;

    const fileName = data.filename || 'uploaded-file';
    const mimeType = data.mimetype || 'application/octet-stream';
    const tempFilePath = `${os.tmpdir()}/tg-upload-${Date.now()}-${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

    try {
      // 1. Save stream to temp file
      await pipeline(data.file, fs.createWriteStream(tempFilePath));

      // 2. Upload to Telegram Saved Messages
      const result = await uploadToSavedMessages(fileName, tempFilePath, mimeType);

      // 3. Record in SQLite
      const fileRecord = fileRepo.create({
        name: result.fileName,
        size: result.fileSize,
        mime_type: result.mimeType,
        folder_id: folderId,
        telegram_message_id: result.messageId,
        telegram_access_hash: result.accessHash,
      });

      return fileRecord;
    } catch (err: unknown) {
      const error = err as Error;
      return reply.status(500).send({ error: error.message || 'Upload to Telegram failed' });
    } finally {
      // Clean up temp file
      if (fs.existsSync(tempFilePath)) {
        await fs.promises.unlink(tempFilePath).catch(() => {});
      }
    }
  });

  // Stream inline (e.g. Video player, Audio, PDF)
  fastify.get('/api/files/:id/stream', async (request, reply) => {
    const { id } = request.params as { id: string };
    const file = fileRepo.get(id);
    if (!file) {
      return reply.status(404).send({ error: 'File not found' });
    }
    return streamTelegramFile(file, request, reply, false);
  });

  // Download file as attachment
  fastify.get('/api/files/:id/download', async (request, reply) => {
    const { id } = request.params as { id: string };
    const file = fileRepo.get(id);
    if (!file) {
      return reply.status(404).send({ error: 'File not found' });
    }
    return streamTelegramFile(file, request, reply, true);
  });

  // Rename or Move file
  fastify.patch('/api/files/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const schema = z.object({
      name: z.string().min(1).optional(),
      folderId: z.string().nullable().optional(),
    });

    const parsed = schema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.issues });
    }

    if (parsed.data.name !== undefined) {
      fileRepo.rename(id, parsed.data.name);
    }
    if (parsed.data.folderId !== undefined) {
      fileRepo.move(id, parsed.data.folderId);
    }

    return { success: true };
  });

  // Delete file record
  fastify.delete('/api/files/:id', async (request) => {
    const { id } = request.params as { id: string };
    fileRepo.delete(id);
    return { success: true };
  });
}

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import fs from 'node:fs';
import path from 'node:os';
import os from 'node:os';
import { pipeline } from 'node:stream/promises';
import { fileRepo, folderRepo, deletedMessageRepo } from '../db/index.js';
import { getTelegramClient } from '../telegram/client.js';
import { uploadToSavedMessages } from '../telegram/uploader.js';
import { streamTelegramFile, streamZipArchive } from '../telegram/streamer.js';
import { syncSavedMessages } from '../telegram/sync.js';

export async function fileRoutes(fastify: FastifyInstance) {
  // Sync existing files from Telegram Saved Messages
  fastify.post('/api/files/sync', async (request, reply) => {
    try {
      const result = await syncSavedMessages(200);
      return { success: true, ...result };
    } catch (err: unknown) {
      const error = err as Error;
      return reply.status(500).send({ error: error.message || 'Sync from Saved Messages failed' });
    }
  });

  // List files with optional search & folder filtering
  fastify.get('/api/files', async (request) => {
    const query = request.query as { folderId?: string; search?: string };
    const folderId =
      query.folderId !== undefined
        ? query.folderId === 'root' || query.folderId === '__recent__'
          ? null
          : query.folderId
        : null;
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
        created_at: result.date,
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

  // Delete file record (removes from Telegram Saved Messages and local drive)
  fastify.delete('/api/files/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const file = fileRepo.get(id);
    if (!file) {
      return reply.status(404).send({ error: 'File not found' });
    }

    // 1. Blacklist message ID so background and manual sync will never re-import it
    if (file.telegram_message_id) {
      deletedMessageRepo.add(file.telegram_message_id);
    }

    // 2. Delete message directly from Telegram Saved Messages
    let telegramDeleted = false;
    try {
      const client = await getTelegramClient();
      if (client && (await client.isUserAuthorized().catch(() => false))) {
        await client.deleteMessages('me', [file.telegram_message_id], { revoke: true });
        telegramDeleted = true;
      }
    } catch (err: unknown) {
      const error = err as Error;
      fastify.log.warn(
        `Failed to delete message ${file.telegram_message_id} from Telegram: ${error.message}`
      );
    }

    // 3. Remove file from SQLite (cascades to shares)
    fileRepo.delete(id);

    return {
      success: true,
      telegramDeleted,
    };
  });

  // Bulk delete files (removes from Telegram Saved Messages and local drive)
  fastify.post('/api/files/bulk-delete', async (request, reply) => {
    const schema = z.object({
      ids: z.array(z.string().min(1)).min(1, 'At least one file ID required'),
    });

    const parsed = schema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.issues });
    }

    const { ids } = parsed.data;
    const files = fileRepo.getByIds(ids);
    if (!files.length) {
      return reply.status(404).send({ error: 'No files found to delete' });
    }

    // 1. Blacklist message IDs in deleted_messages table
    const messageIds = files
      .map((f) => f.telegram_message_id)
      .filter((id): id is number => typeof id === 'number');
    deletedMessageRepo.bulkAdd(messageIds);

    // 2. Delete messages directly from Telegram Saved Messages
    let telegramDeletedCount = 0;
    try {
      const client = await getTelegramClient();
      if (client && (await client.isUserAuthorized().catch(() => false))) {
        await client.deleteMessages('me', messageIds, { revoke: true });
        telegramDeletedCount = messageIds.length;
      }
    } catch (err: unknown) {
      fastify.log.warn(`Failed bulk deleting messages from Telegram: ${(err as Error).message}`);
    }

    // 3. Remove files from SQLite
    fileRepo.bulkDelete(ids);

    return {
      success: true,
      count: ids.length,
      telegramDeletedCount,
    };
  });

  // Bulk move files to a target folder (or root drive if folderId is null)
  fastify.post('/api/files/bulk-move', async (request, reply) => {
    const schema = z.object({
      ids: z.array(z.string().min(1)).min(1, 'At least one file ID required'),
      folderId: z.string().nullable(),
    });

    const parsed = schema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.issues });
    }

    const { ids, folderId } = parsed.data;
    if (folderId !== null) {
      const targetFolder = folderRepo.get(folderId);
      if (!targetFolder) {
        return reply.status(404).send({ error: 'Target folder not found' });
      }
    }

    const count = fileRepo.bulkMove(ids, folderId);
    return {
      success: true,
      count,
    };
  });

  // Download multiple files as a streaming ZIP archive
  const handleZipDownload = async (request: FastifyRequest, reply: FastifyReply) => {
    let ids: string[] = [];
    if (request.method === 'POST') {
      const body = request.body as { ids?: string[] };
      if (Array.isArray(body?.ids)) {
        ids = body.ids;
      }
    } else {
      const query = request.query as { ids?: string };
      if (query?.ids) {
        ids = query.ids.split(',').map((s) => s.trim()).filter(Boolean);
      }
    }

    if (!ids.length) {
      return reply.status(400).send({ error: 'At least one file ID required for ZIP export' });
    }

    const files = fileRepo.getByIds(ids);
    if (!files.length) {
      return reply.status(404).send({ error: 'No files found to download' });
    }

    // Enforce 1 GB batch size limit
    const MAX_ZIP_BYTES = 1024 * 1024 * 1024; // 1 GB
    const totalSize = files.reduce((sum, f) => sum + f.size, 0);
    if (totalSize > MAX_ZIP_BYTES) {
      const totalMb = (totalSize / (1024 * 1024)).toFixed(1);
      return reply.status(400).send({
        error: `Selected files total ${totalMb} MB, which exceeds the 1 GB maximum batch ZIP download limit. Please select fewer files.`,
      });
    }

    return streamZipArchive(files, reply);
  };

  fastify.post('/api/files/download-zip', handleZipDownload);
  fastify.get('/api/files/download-zip', handleZipDownload);
}

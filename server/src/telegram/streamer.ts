import { FastifyReply, FastifyRequest } from 'fastify';
import { Readable } from 'node:stream';
import bigInt from 'big-integer';
import { getTelegramClient } from './client.js';
import { streamLimiter, withFloodWaitRetry } from './limiter.js';
import { fileRepo, FileRecord } from '../db/index.js';

export interface RangeInfo {
  start: number;
  end: number;
  chunkLength: number;
}

/**
 * Parses HTTP Range header into byte coordinates
 */
export function parseRange(rangeHeader: string, fileSize: number): RangeInfo | null {
  const matches = rangeHeader.match(/bytes=(\d*)-(\d*)/);
  if (!matches) return null;

  let start = matches[1] ? parseInt(matches[1], 10) : 0;
  let end = matches[2] ? parseInt(matches[2], 10) : fileSize - 1;

  if (isNaN(start)) {
    start = fileSize - end;
    end = fileSize - 1;
  }

  if (isNaN(end) || end >= fileSize) {
    end = fileSize - 1;
  }

  if (start > end || start < 0) {
    return null;
  }

  return {
    start,
    end,
    chunkLength: end - start + 1,
  };
}

/**
 * Streams a file from Telegram Saved Messages to a Fastify HTTP reply
 */
export async function streamTelegramFile(
  file: FileRecord,
  request: FastifyRequest,
  reply: FastifyReply,
  asAttachment = false
) {
  const client = await getTelegramClient();
  if (!client) {
    return reply.status(503).send({ error: 'Telegram client not connected' });
  }

  // 1. Fetch message from Telegram with lazy-validation check
  let message;
  try {
    const messages = await withFloodWaitRetry(async () => {
      return await client.getMessages('me', { ids: [file.telegram_message_id] });
    });
    message = messages[0];
  } catch {
    fileRepo.updateStatus(file.id, 'missing');
    return reply.status(404).send({
      error: 'File was deleted from Telegram Saved Messages',
      status: 'missing',
    });
  }

  if (!message) {
    fileRepo.updateStatus(file.id, 'missing');
    return reply.status(404).send({
      error: 'File message not found in Telegram Saved Messages',
      status: 'missing',
    });
  }

  // Handle pure text-based message streaming and downloading
  if (!message.media) {
    const rawText = message.message || (typeof message.text === 'string' ? message.text : '');
    const buffer = Buffer.from(rawText, 'utf8');
    const totalSize = buffer.length;

    reply.header('Content-Type', file.mime_type || 'text/plain; charset=utf-8');
    reply.header('Accept-Ranges', 'bytes');

    if (asAttachment) {
      reply.header('Content-Disposition', `attachment; filename="${encodeURIComponent(file.name)}"`);
    } else {
      reply.header('Content-Disposition', `inline; filename="${encodeURIComponent(file.name)}"`);
    }

    const rangeHeader = request.headers.range;
    if (rangeHeader) {
      const range = parseRange(rangeHeader, totalSize);
      if (!range) {
        reply.header('Content-Range', `bytes */${totalSize}`);
        return reply.status(416).send('Requested Range Not Satisfiable');
      }

      const chunk = buffer.subarray(range.start, range.end + 1);
      reply.status(206);
      reply.header('Content-Range', `bytes ${range.start}-${range.end}/${totalSize}`);
      reply.header('Content-Length', chunk.length);
      return reply.send(chunk);
    }

    reply.status(200);
    reply.header('Content-Length', totalSize);
    return reply.send(buffer);
  }

  const media = message.media;
  const rangeHeader = request.headers.range;

  // 2. Concurrency limiting slot acquisition
  const releaseSlot = await streamLimiter.acquire();

  // Ensure slot is released when client disconnects or request finishes
  let released = false;
  const safeRelease = () => {
    if (!released) {
      released = true;
      releaseSlot();
    }
  };

  request.raw.on('close', safeRelease);
  reply.raw.on('finish', safeRelease);
  reply.raw.on('error', safeRelease);

  const chunkSize = 512 * 1024; // 512 KB per MTProto chunk

  try {
    if (rangeHeader) {
      const range = parseRange(rangeHeader, file.size);
      if (!range) {
        safeRelease();
        return reply
          .status(416)
          .header('Content-Range', `bytes */${file.size}`)
          .send('Requested Range Not Satisfiable');
      }

      reply
        .status(206)
        .header('Content-Range', `bytes ${range.start}-${range.end}/${file.size}`)
        .header('Accept-Ranges', 'bytes')
        .header('Content-Length', range.chunkLength)
        .header('Content-Type', file.mime_type);

      if (asAttachment) {
        reply.header(
          'Content-Disposition',
          `attachment; filename="${encodeURIComponent(file.name)}"`
        );
      } else {
        reply.header(
          'Content-Disposition',
          `inline; filename="${encodeURIComponent(file.name)}"`
        );
      }

      const downloadIterator = client.iterDownload({
        file: media,
        offset: bigInt(range.start),
        limit: range.chunkLength,
        chunkSize,
        requestSize: chunkSize,
      });

      const readable = Readable.from(downloadIterator);
      request.raw.on('close', () => {
        readable.destroy();
      });
      return reply.send(readable);
    }

    // Full file download
    reply
      .status(200)
      .header('Content-Length', file.size)
      .header('Content-Type', file.mime_type)
      .header('Accept-Ranges', 'bytes')
      .header(
        'Content-Disposition',
        `${asAttachment ? 'attachment' : 'inline'}; filename="${encodeURIComponent(file.name)}"`
      );

    const downloadIterator = client.iterDownload({
      file: media,
      chunkSize,
      requestSize: chunkSize,
    });

    const readable = Readable.from(downloadIterator);
    request.raw.on('close', () => {
      readable.destroy();
    });
    return reply.send(readable);
  } catch (error) {
    safeRelease();
    throw error;
  }
}

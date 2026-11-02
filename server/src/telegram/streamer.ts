import { FastifyReply, FastifyRequest } from 'fastify';
import { Readable } from 'node:stream';
import bigInt from 'big-integer';
import { ZipArchive } from 'archiver';
import { getTelegramClient } from './client.js';
import { streamLimiter, withFloodWaitRetry } from './limiter.js';
import { fileRepo, FileRecord } from '../db/index.js';

export interface RangeInfo {
  start: number;
  end: number;
  chunkLength: number;
}

/**
 * Infers an accurate MIME type based on filename extension when DB mime_type is generic
 */
export function resolveMimeType(name: string, currentMime: string): string {
  if (currentMime && currentMime !== 'application/octet-stream' && currentMime !== 'binary/octet-stream') {
    return currentMime;
  }
  const lower = name.toLowerCase();
  if (/\.jpe?g$/i.test(lower)) return 'image/jpeg';
  if (/\.png$/i.test(lower)) return 'image/png';
  if (/\.gif$/i.test(lower)) return 'image/gif';
  if (/\.webp$/i.test(lower)) return 'image/webp';
  if (/\.svg$/i.test(lower)) return 'image/svg+xml';
  if (/\.bmp$/i.test(lower)) return 'image/bmp';
  if (/\.ico$/i.test(lower)) return 'image/x-icon';
  if (/\.mp4$/i.test(lower)) return 'video/mp4';
  if (/\.webm$/i.test(lower)) return 'video/webm';
  if (/\.mkv$/i.test(lower)) return 'video/x-matroska';
  if (/\.mov$/i.test(lower)) return 'video/quicktime';
  if (/\.mp3$/i.test(lower)) return 'audio/mpeg';
  if (/\.ogg$/i.test(lower)) return 'audio/ogg';
  if (/\.wav$/i.test(lower)) return 'audio/wav';
  if (/\.m4a$/i.test(lower)) return 'audio/mp4';
  if (/\.flac$/i.test(lower)) return 'audio/flac';
  if (/\.pdf$/i.test(lower)) return 'application/pdf';
  if (/\.(txt|log|srt|vcf|pem|pub|key|env|ini|conf|ps1|sh|bash|py|sql|diff|patch|toml)$/i.test(lower)) return 'text/plain; charset=utf-8';
  if (/\.(md|markdown)$/i.test(lower)) return 'text/markdown; charset=utf-8';
  if (/\.json$/i.test(lower)) return 'application/json';
  if (/\.csv$/i.test(lower)) return 'text/csv; charset=utf-8';
  if (/\.(js|mjs|cjs)$/i.test(lower)) return 'text/javascript; charset=utf-8';
  if (/\.(ts|tsx)$/i.test(lower)) return 'text/plain; charset=utf-8';
  if (/\.html?$/i.test(lower)) return 'text/html; charset=utf-8';
  if (/\.css$/i.test(lower)) return 'text/css; charset=utf-8';
  return currentMime || 'application/octet-stream';
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

  const contentType = resolveMimeType(file.name, file.mime_type);

  // Handle pure text-based message streaming and downloading
  if (!message.media) {
    const rawText = message.message || (typeof message.text === 'string' ? message.text : '');
    const buffer = Buffer.from(rawText, 'utf8');
    const totalSize = buffer.length;

    reply.header('Content-Type', contentType || 'text/plain; charset=utf-8');
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
        .header('Content-Type', contentType);

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
      .header('Content-Type', contentType)
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

/**
 * Streams a ZIP archive of multiple files directly to the HTTP response
 */
export async function streamZipArchive(
  files: FileRecord[],
  reply: FastifyReply
) {
  const client = await getTelegramClient();
  if (!client) {
    return reply.status(503).send({ error: 'Telegram client not connected' });
  }

  const timestamp = new Date().toISOString().slice(0, 10);
  const zipFilename = `dart_export_${timestamp}.zip`;

  reply.header('Content-Type', 'application/zip');
  reply.header('Content-Disposition', `attachment; filename="${encodeURIComponent(zipFilename)}"`);
  reply.header('Cache-Control', 'no-cache, no-store, must-revalidate');

  const archive = new ZipArchive({
    zlib: { level: 1 }, // Fast compression for high streaming throughput
  });

  // Handle client abort / disconnect
  let isAborted = false;
  reply.raw.on('close', () => {
    isAborted = true;
    archive.destroy();
  });

  // Send the readable archive stream to the reply
  reply.send(archive);

  // Keep track of names to prevent zip entry name collision
  const usedNames = new Set<string>();
  const getUniqueZipName = (name: string): string => {
    const clean = name.replace(/[\u0000-\u001f\\/:*?"<>|]/g, '_');
    if (!usedNames.has(clean.toLowerCase())) {
      usedNames.add(clean.toLowerCase());
      return clean;
    }
    const extIdx = clean.lastIndexOf('.');
    const base = extIdx > 0 ? clean.slice(0, extIdx) : clean;
    const ext = extIdx > 0 ? clean.slice(extIdx) : '';
    let counter = 1;
    while (usedNames.has(`${base} (${counter})${ext}`.toLowerCase())) {
      counter++;
    }
    const unique = `${base} (${counter})${ext}`;
    usedNames.add(unique.toLowerCase());
    return unique;
  };

  try {
    for (const file of files) {
      if (isAborted) break;

      const entryName = getUniqueZipName(file.name);

      // 1. Fetch Telegram message
      let message;
      try {
        const messages = await withFloodWaitRetry(async () => {
          return await client.getMessages('me', { ids: [file.telegram_message_id] });
        });
        message = messages[0];
      } catch {
        // Skip missing or inaccessible messages
        continue;
      }

      if (!message) continue;

      // Pure text note
      if (!message.media) {
        const rawText = message.message || (typeof message.text === 'string' ? message.text : '');
        const buffer = Buffer.from(rawText, 'utf8');
        await new Promise<void>((resolve, reject) => {
          archive.once('entry', () => resolve());
          archive.once('error', reject);
          archive.append(buffer, { name: entryName });
        });
        continue;
      }

      // Media document / photo
      const media = message.media;
      const releaseSlot = await streamLimiter.acquire();

      try {
        const chunkSize = 512 * 1024;
        const downloadIterator = client.iterDownload({
          file: media,
          chunkSize,
          requestSize: chunkSize,
        });

        const readable = Readable.from(downloadIterator);

        await new Promise<void>((resolve, reject) => {
          archive.once('entry', () => resolve());
          archive.once('error', reject);
          archive.append(readable, { name: entryName });
        });
      } finally {
        releaseSlot();
      }
    }

    if (!isAborted) {
      await archive.finalize();
    }
  } catch (err) {
    if (!isAborted) {
      archive.destroy(err as Error);
    }
  }
}

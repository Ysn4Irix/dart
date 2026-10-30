import { getTelegramClient } from './client.js';
import { fileRepo } from '../db/index.js';
import { withFloodWaitRetry } from './limiter.js';

export interface SyncResult {
  scanned: number;
  added: number;
  skipped: number;
}

/**
 * Scans Telegram Saved Messages ('me') and catalogs existing files/media into the local database
 */
export async function syncSavedMessages(limit = 200): Promise<SyncResult> {
  const client = await getTelegramClient();
  if (!client) {
    throw new Error('Telegram client is not connected or unauthorized');
  }

  const isAuth = await client.isUserAuthorized();
  if (!isAuth) {
    throw new Error('Telegram client is not authorized');
  }

  let scanned = 0;
  let added = 0;
  let skipped = 0;

  // Retrieve messages from 'me' (Saved Messages)
  const messages = await withFloodWaitRetry(async () => {
    return await client.getMessages('me', { limit });
  });

  for (const message of messages) {
    scanned++;

    // Only process messages that carry media
    if (!message.media) {
      continue;
    }

    // Skip if already indexed
    const existing = fileRepo.getByMessageId(message.id);
    if (existing) {
      skipped++;
      continue;
    }

    const file = message.file;
    const doc = message.document;
    const photo = message.photo;

    let fileName = '';
    let size = 0;
    let mimeType = 'application/octet-stream';
    let accessHash: string | null = null;

    if (file && typeof file.name === 'string' && file.name.trim()) {
      fileName = file.name.trim();
    }

    if (doc) {
      size = Number(doc.size) || (typeof file?.size === 'number' ? file.size : 0);
      mimeType = doc.mimeType || file?.mimeType || 'application/octet-stream';
      accessHash = doc.accessHash ? doc.accessHash.toString() : null;

      if (!fileName && doc.attributes) {
        for (const attr of doc.attributes) {
          if ('fileName' in attr && typeof attr.fileName === 'string' && attr.fileName) {
            fileName = attr.fileName;
            break;
          }
        }
      }
    } else if (photo) {
      mimeType = 'image/jpeg';
      fileName = `photo_${message.id}.jpg`;
      size = typeof file?.size === 'number' ? file.size : 100000;
      accessHash = (photo as { accessHash?: { toString: () => string } }).accessHash?.toString() || null;
    }

    // Fallback filename if none was extracted from attributes
    if (!fileName) {
      const ext = mimeType.includes('/') ? mimeType.split('/')[1] : 'bin';
      const cleanExt = ext.replace(/[^a-zA-Z0-9]/g, '');
      fileName = `telegram_${message.id}.${cleanExt || 'bin'}`;
    }

    if (size === 0 && file && file.size) {
      size = Number(file.size);
    }

    fileRepo.create({
      name: fileName,
      size: size || 1,
      mime_type: mimeType,
      folder_id: null,
      telegram_message_id: message.id,
      telegram_access_hash: accessHash,
    });

    added++;
  }

  return { scanned, added, skipped };
}

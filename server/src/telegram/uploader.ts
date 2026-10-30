import { CustomFile } from 'telegram/client/uploads.js';
import { getTelegramClient } from './client.js';
import { withFloodWaitRetry } from './limiter.js';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';

export interface UploadResult {
  messageId: number;
  fileName: string;
  fileSize: number;
  mimeType: string;
  accessHash: string | null;
  date: number;
}

/**
 * Uploads a file directly into Telegram Saved Messages ('me')
 */
export async function uploadToSavedMessages(
  fileName: string,
  tempFilePath: string,
  mimeType: string
): Promise<UploadResult> {
  const client = await getTelegramClient();
  if (!client) {
    throw new Error('Telegram client is not connected or unauthorized');
  }

  const stat = await fs.promises.stat(tempFilePath);
  const fileSize = stat.size;

  const toUpload = new CustomFile(fileName, fileSize, tempFilePath);

  const message = await withFloodWaitRetry(async () => {
    return await client.sendFile('me', {
      file: toUpload,
      caption: `📁 Dart: ${fileName}`,
      workers: 4,
    });
  });

  const media = message.media as unknown as {
    document?: {
      id: { toString: () => string };
      accessHash?: { toString: () => string };
      mimeType?: string;
    };
  };

  const accessHash = media?.document?.accessHash ? media.document.accessHash.toString() : null;

  return {
    messageId: message.id,
    fileName,
    fileSize,
    mimeType: media?.document?.mimeType || mimeType,
    accessHash,
    date: message.date ? message.date * 1000 : Date.now(),
  };
}

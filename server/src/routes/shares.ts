import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import fs from 'node:fs';
import path from 'node:path';
import { shareRepo, fileRepo } from '../db/index.js';
import { streamTelegramFile } from '../telegram/streamer.js';
import { config, getClientDistPath } from '../config.js';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderStandaloneShareHtml(share: any, file: any): string {
  const safeName = escapeHtml(file.name);
  const safeMime = escapeHtml(file.mime_type);
  const safeSize = formatBytes(file.size);
  const downloadUrl = `/api/shares/${share.id}/download`;
  const streamUrl = `/api/shares/${share.id}/stream`;

  let previewHtml = '';
  if (file.mime_type.startsWith('image/')) {
    previewHtml = `<div style="max-height:400px;overflow:hidden;border-radius:12px;background:#000;display:flex;align-items:center;justify-content:center;margin-bottom:1.5rem;"><img src="${streamUrl}" alt="${safeName}" style="max-height:400px;max-width:100%;object-fit:contain;" /></div>`;
  } else if (file.mime_type.startsWith('video/')) {
    previewHtml = `<div style="max-height:400px;overflow:hidden;border-radius:12px;background:#000;display:flex;align-items:center;justify-content:center;margin-bottom:1.5rem;"><video controls src="${streamUrl}" style="max-height:400px;width:100%;"></video></div>`;
  } else if (file.mime_type.startsWith('audio/')) {
    previewHtml = `<div style="padding:1rem;border-radius:12px;background:rgba(128,128,128,0.1);margin-bottom:1.5rem;"><audio controls src="${streamUrl}" style="width:100%;"></audio></div>`;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeName} - Dart Cloud Storage</title>
  <style>
    :root {
      --bg: #f5f5f4;
      --card-bg: #ffffff;
      --text: #1c1917;
      --text-muted: #78716c;
      --border: #e7e5e4;
      --accent: #059669;
      --accent-hover: #10b981;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #0c0a09;
        --card-bg: #1c1917;
        --text: #fafaf9;
        --text-muted: #a8a29e;
        --border: #292524;
      }
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 1.5rem;
    }
    .header { max-width: 680px; width: 100%; margin: 0 auto 1.5rem; display: flex; align-items: center; gap: 0.75rem; }
    .card {
      max-width: 680px; width: 100%; margin: auto; background: var(--card-bg);
      border: 1px solid var(--border); border-radius: 1rem; padding: 2rem;
      box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05);
    }
    .filename { font-size: 1.25rem; font-weight: 600; word-break: break-all; margin-bottom: 0.5rem; }
    .meta { font-size: 0.8125rem; color: var(--text-muted); display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; margin-bottom: 1.5rem; }
    .actions { display: flex; gap: 0.75rem; flex-wrap: wrap; }
    .btn-download {
      width: 100%; display: inline-flex; align-items: center; justify-content: center;
      gap: 0.5rem; background: var(--accent); color: white; padding: 0.75rem 1.5rem;
      font-weight: 500; font-size: 0.875rem; border-radius: 0.75rem; text-decoration: none;
      transition: background 0.15s;
    }
    .btn-download:hover { background: var(--accent-hover); }
    .footer { text-align: center; font-size: 0.75rem; color: var(--text-muted); padding: 1.5rem 0 0.5rem; }
  </style>
</head>
<body>
  <div class="header">
    <svg width="24" height="24" viewBox="0 0 40 40" fill="none"><path d="M20 4L34 32L20 26L6 32L20 4Z" fill="#10B981" stroke="#059669" stroke-width="2" stroke-linejoin="round"/></svg>
    <span style="font-weight: 600; font-size: 1.125rem;">Dart</span>
    <span style="font-size: 0.75rem; color: var(--text-muted); margin-left: auto;">Private Telegram Storage</span>
  </div>

  <div class="card">
    ${previewHtml}
    <h1 class="filename">${safeName}</h1>
    <div class="meta">
      <span>${safeSize}</span>
      <span>•</span>
      <span>${safeMime}</span>
      <span>•</span>
      <span>${share.download_count} downloads</span>
    </div>
    <div class="actions">
      <a href="${downloadUrl}" class="btn-download">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        Download File
      </a>
    </div>
  </div>

  <div class="footer">
    Dart Cloud Storage &bull; Private Telegram MTProto Storage Engine
  </div>
</body>
</html>`;
}

function renderErrorPageHtml(title: string, message: string): string {
  const safeTitle = escapeHtml(title);
  const safeMsg = escapeHtml(message);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeTitle} - Dart Cloud Storage</title>
  <style>
    :root { --bg: #f5f5f4; --card-bg: #ffffff; --text: #1c1917; --text-muted: #78716c; --border: #e7e5e4; }
    @media (prefers-color-scheme: dark) { :root { --bg: #0c0a09; --card-bg: #1c1917; --text: #fafaf9; --text-muted: #a8a29e; --border: #292524; } }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: var(--bg); color: var(--text); min-height: 100vh; display: flex; flex-direction: column; justify-content: space-between; padding: 1.5rem; }
    .card { max-width: 440px; width: 100%; margin: auto; background: var(--card-bg); border: 1px solid var(--border); border-radius: 1rem; padding: 2rem; text-align: center; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); }
    h1 { font-size: 1.5rem; font-weight: 600; margin: 1rem 0 0.5rem; }
    p { font-size: 0.875rem; color: var(--text-muted); line-height: 1.5; margin-bottom: 1.5rem; }
    a { display: inline-flex; align-items: center; justify-content: center; background: #059669; color: white; padding: 0.625rem 1.25rem; font-weight: 500; font-size: 0.875rem; border-radius: 0.5rem; text-decoration: none; }
  </style>
</head>
<body>
  <div class="card">
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin: 0 auto;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
    <h1>${safeTitle}</h1>
    <p>${safeMsg}</p>
    <a href="/">Return to Home</a>
  </div>
</body>
</html>`;
}

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

    const host = request.headers.host || `localhost:${config.port}`;
    const protocol = request.protocol || 'http';
    const baseUrl = process.env.PUBLIC_URL || `${protocol}://${host}`;

    return {
      share,
      publicUrl: `${baseUrl}/s/${share.id}`,
    };
  });

  // Public share metadata JSON endpoint (used by React PublicSharePage)
  const getShareHandler = async (request: any, reply: any) => {
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
      downloadUrl: `/api/shares/${share.id}/download`,
      streamUrl: `/api/shares/${share.id}/stream`,
      telegramMessageId: file.telegram_message_id,
    };
  };

  // Dedicated JSON API endpoint for client applications
  fastify.get('/api/shares/:slug', getShareHandler);

  // Public share download page route
  fastify.get('/s/:slug', async (request, reply) => {
    const accept = request.headers.accept || '';
    const wantsJson = accept.includes('application/json') && !accept.includes('text/html');

    // 1. Programmatic API request specifically requesting JSON
    if (wantsJson) {
      return getShareHandler(request, reply);
    }

    // 2. Serve SPA index.html so React renders PublicSharePage in the browser
    const clientDist = getClientDistPath();
    if (clientDist && fs.existsSync(path.join(clientDist, 'index.html'))) {
      if (typeof (reply as any).sendFile === 'function') {
        return (reply as any).status(200).type('text/html').sendFile('index.html');
      }
      const html = fs.readFileSync(path.join(clientDist, 'index.html'), 'utf-8');
      return reply.status(200).type('text/html').send(html);
    }

    // 3. Fallback: Standalone HTML Download Page (when built bundle is not found)
    const { slug } = request.params as { slug: string };
    const result = shareRepo.getWithFile(slug);
    if (!result) {
      return reply
        .status(404)
        .type('text/html')
        .send(renderErrorPageHtml('Link Unavailable', 'This file is no longer accessible or the link has expired.'));
    }

    const { share, file } = result;
    if (share.expires_at && share.expires_at < Date.now()) {
      return reply
        .status(410)
        .type('text/html')
        .send(renderErrorPageHtml('Link Expired', 'This shared file link has expired.'));
    }

    return reply.status(200).type('text/html').send(renderStandaloneShareHtml(share, file));
  });

  // Public stream endpoint
  const streamHandler = async (request: any, reply: any) => {
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
  };

  fastify.get('/api/shares/:slug/stream', streamHandler);
  fastify.get('/s/:slug/stream', streamHandler);

  // Public download endpoint
  const downloadHandler = async (request: any, reply: any) => {
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
  };

  fastify.get('/api/shares/:slug/download', downloadHandler);
  fastify.get('/s/:slug/download', downloadHandler);

  // Delete a share link
  fastify.delete('/api/shares/:slug', async (request) => {
    const { slug } = request.params as { slug: string };
    shareRepo.delete(slug);
    return { success: true };
  });
}

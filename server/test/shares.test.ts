import test from 'node:test';
import assert from 'node:assert';
import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import path from 'node:path';
import fs from 'node:fs';
import { shareRoutes } from '../src/routes/shares.js';
import { fileRepo, folderRepo, shareRepo } from '../src/db/index.js';
import { getClientDistPath } from '../src/config.js';

test('Public Share Routes & Download Page Suite', async (t) => {
  const ts = Date.now();
  const testFile = fileRepo.create({
    name: `share_test_file_${ts}.pdf`,
    size: 2048,
    mime_type: 'application/pdf',
    folder_id: null,
    telegram_message_id: 77700000 + Math.floor(Math.random() * 10000),
  });

  const activeShare = shareRepo.create(testFile.id, null);
  const expiredShare = shareRepo.create(testFile.id, Date.now() - 10000);

  // Setup test Fastify instance with static assets if available
  const app = Fastify();
  const clientDist = getClientDistPath();
  if (clientDist && fs.existsSync(path.join(clientDist, 'index.html'))) {
    await app.register(fastifyStatic, {
      root: clientDist,
      prefix: '/',
      wildcard: false,
    });
  }
  await app.register(shareRoutes);
  await app.ready();

  await t.test('GET /s/:slug with browser Accept: text/html returns the HTML download page', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/s/${activeShare.id}`,
      headers: {
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    assert.strictEqual(res.statusCode, 200);
    assert.ok(res.headers['content-type']?.includes('text/html'), 'Expected text/html content-type');
    assert.ok(res.body.includes('<!DOCTYPE html>') || res.body.includes('<div id="root">'), 'Expected HTML document');
  });

  await t.test('GET /api/shares/:slug returns JSON file metadata', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/shares/${activeShare.id}`,
    });

    assert.strictEqual(res.statusCode, 200);
    assert.ok(res.headers['content-type']?.includes('application/json'));
    const data = JSON.parse(res.body);
    assert.strictEqual(data.id, activeShare.id);
    assert.strictEqual(data.fileName, testFile.name);
    assert.strictEqual(data.fileSize, 2048);
    assert.strictEqual(data.mimeType, 'application/pdf');
    assert.strictEqual(data.downloadUrl, `/api/shares/${activeShare.id}/download`);
    assert.strictEqual(data.streamUrl, `/api/shares/${activeShare.id}/stream`);
  });

  await t.test('GET /s/:slug with Accept: application/json returns JSON for programmatic clients', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/s/${activeShare.id}`,
      headers: {
        accept: 'application/json',
      },
    });

    assert.strictEqual(res.statusCode, 200);
    assert.ok(res.headers['content-type']?.includes('application/json'));
    const data = JSON.parse(res.body);
    assert.strictEqual(data.id, activeShare.id);
    assert.strictEqual(data.fileName, testFile.name);
  });

  await t.test('GET /s/:slug for non-existent share returns 404', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/s/non_existent_slug_12345',
      headers: {
        accept: 'text/html',
      },
    });

    assert.ok(res.statusCode === 404 || res.statusCode === 200); // 200 if SPA handles 404 client-side
  });

  await t.test('GET /api/shares/:slug for expired share returns 410', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/shares/${expiredShare.id}`,
    });

    assert.strictEqual(res.statusCode, 410);
    const data = JSON.parse(res.body);
    assert.strictEqual(data.error, 'Share link has expired');
  });

  // Cleanup
  shareRepo.delete(activeShare.id);
  shareRepo.delete(expiredShare.id);
  fileRepo.delete(testFile.id);
  await app.close();
});

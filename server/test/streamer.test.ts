import test from 'node:test';
import assert from 'node:assert';
import { resolveMimeType, parseRange } from '../src/telegram/streamer.js';

test('Streamer: resolveMimeType', async (t) => {
  await t.test('infers image MIME types from extension when DB mime is octet-stream', () => {
    assert.strictEqual(resolveMimeType('photo.jpg', 'application/octet-stream'), 'image/jpeg');
    assert.strictEqual(resolveMimeType('photo.png', 'application/octet-stream'), 'image/png');
    assert.strictEqual(resolveMimeType('anim.webp', 'application/octet-stream'), 'image/webp');
    assert.strictEqual(resolveMimeType('vector.svg', 'application/octet-stream'), 'image/svg+xml');
  });

  await t.test('infers video and audio MIME types from extension', () => {
    assert.strictEqual(resolveMimeType('video.mp4', 'application/octet-stream'), 'video/mp4');
    assert.strictEqual(resolveMimeType('clip.webm', 'application/octet-stream'), 'video/webm');
    assert.strictEqual(resolveMimeType('audio.mp3', 'application/octet-stream'), 'audio/mpeg');
    assert.strictEqual(resolveMimeType('track.wav', 'application/octet-stream'), 'audio/wav');
    assert.strictEqual(resolveMimeType('recording.m4a', 'application/octet-stream'), 'audio/mp4');
  });

  await t.test('infers document and text MIME types', () => {
    assert.strictEqual(resolveMimeType('doc.pdf', 'application/octet-stream'), 'application/pdf');
    assert.strictEqual(resolveMimeType('notes.txt', 'application/octet-stream'), 'text/plain; charset=utf-8');
    assert.strictEqual(resolveMimeType('README.md', 'application/octet-stream'), 'text/markdown; charset=utf-8');
    assert.strictEqual(resolveMimeType('data.json', 'application/octet-stream'), 'application/json');
    assert.strictEqual(resolveMimeType('script.ps1', 'application/octet-stream'), 'text/plain; charset=utf-8');
  });

  await t.test('preserves specific existing MIME types', () => {
    assert.strictEqual(resolveMimeType('archive.zip', 'application/zip'), 'application/zip');
    assert.strictEqual(resolveMimeType('custom.pdf', 'application/pdf'), 'application/pdf');
  });

  await t.test('parses HTTP range headers accurately', () => {
    const range = parseRange('bytes=0-1023', 5000);
    assert.deepStrictEqual(range, { start: 0, end: 1023, chunkLength: 1024 });

    const openRange = parseRange('bytes=1000-', 5000);
    assert.deepStrictEqual(openRange, { start: 1000, end: 4999, chunkLength: 4000 });

    const invalidRange = parseRange('invalid', 5000);
    assert.strictEqual(invalidRange, null);
  });
});

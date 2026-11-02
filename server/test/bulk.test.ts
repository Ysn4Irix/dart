import test from 'node:test';
import assert from 'node:assert';
import { fileRepo, folderRepo, deletedMessageRepo } from '../src/db/index.js';

test('Bulk Operations Repository Suite', async (t) => {
  const ts = Date.now();
  const folder = folderRepo.create(`BulkTestFolder_${ts}`);

  const file1 = fileRepo.create({
    name: `bulk_test_1_${ts}.txt`,
    size: 100,
    mime_type: 'text/plain',
    folder_id: null,
    telegram_message_id: 88800000 + Math.floor(Math.random() * 10000),
  });

  const file2 = fileRepo.create({
    name: `bulk_test_2_${ts}.txt`,
    size: 200,
    mime_type: 'text/plain',
    folder_id: null,
    telegram_message_id: 88800000 + Math.floor(Math.random() * 10000),
  });

  const file3 = fileRepo.create({
    name: `bulk_test_3_${ts}.txt`,
    size: 300,
    mime_type: 'text/plain',
    folder_id: null,
    telegram_message_id: 88800000 + Math.floor(Math.random() * 10000),
  });

  await t.test('fileRepo.getByIds retrieves multiple files accurately', () => {
    const fetched = fileRepo.getByIds([file1.id, file2.id, file3.id]);
    assert.strictEqual(fetched.length, 3);
    const ids = fetched.map((f) => f.id);
    assert.ok(ids.includes(file1.id));
    assert.ok(ids.includes(file2.id));
    assert.ok(ids.includes(file3.id));
  });

  await t.test('fileRepo.bulkMove updates folder_id for all specified files in one transaction', () => {
    const count = fileRepo.bulkMove([file1.id, file2.id], folder.id);
    assert.strictEqual(count, 2);

    const updated1 = fileRepo.get(file1.id);
    const updated2 = fileRepo.get(file2.id);
    const untouched3 = fileRepo.get(file3.id);

    assert.strictEqual(updated1?.folder_id, folder.id);
    assert.strictEqual(updated2?.folder_id, folder.id);
    assert.strictEqual(untouched3?.folder_id, null);
  });

  await t.test('fileRepo.bulkMove can move files back to root drive (null)', () => {
    const count = fileRepo.bulkMove([file1.id, file2.id], null);
    assert.strictEqual(count, 2);

    const updated1 = fileRepo.get(file1.id);
    const updated2 = fileRepo.get(file2.id);

    assert.strictEqual(updated1?.folder_id, null);
    assert.strictEqual(updated2?.folder_id, null);
  });

  await t.test('deletedMessageRepo.bulkAdd records multiple tombstones', () => {
    const msgIds = [file1.telegram_message_id, file2.telegram_message_id];
    deletedMessageRepo.bulkAdd(msgIds);

    assert.strictEqual(deletedMessageRepo.isDeleted(file1.telegram_message_id), true);
    assert.strictEqual(deletedMessageRepo.isDeleted(file2.telegram_message_id), true);
  });

  await t.test('fileRepo.bulkDelete deletes specified records atomically', () => {
    const count = fileRepo.bulkDelete([file1.id, file2.id, file3.id]);
    assert.strictEqual(count, 3);

    assert.strictEqual(fileRepo.get(file1.id), null);
    assert.strictEqual(fileRepo.get(file2.id), null);
    assert.strictEqual(fileRepo.get(file3.id), null);
  });

  // Cleanup test folder
  folderRepo.delete(folder.id);
});

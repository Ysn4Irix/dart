import test from 'node:test';
import assert from 'node:assert';
import { fileRepo, folderRepo } from '../src/db/index.js';

test('Files Repository Pagination & Query Suite', async (t) => {
  const ts = Date.now();
  const folder = folderRepo.create(`PagingTestFolder_${ts}`);

  const createdFileIds: string[] = [];
  for (let i = 1; i <= 10; i++) {
    const f = fileRepo.create({
      name: `page_test_file_${i.toString().padStart(2, '0')}_${ts}.txt`,
      size: 100 * i,
      mime_type: 'text/plain',
      folder_id: folder.id,
      telegram_message_id: 99000000 + i,
    });
    createdFileIds.push(f.id);
  }

  await t.test('fileRepo.count returns accurate total count', () => {
    const total = fileRepo.count(folder.id);
    assert.strictEqual(total, 10);
  });

  await t.test('fileRepo.list retrieves paginated pages accurately with limit and offset', () => {
    const page1 = fileRepo.list(folder.id, undefined, 4, 0);
    assert.strictEqual(page1.length, 4);

    const page2 = fileRepo.list(folder.id, undefined, 4, 4);
    assert.strictEqual(page2.length, 4);

    const page3 = fileRepo.list(folder.id, undefined, 4, 8);
    assert.strictEqual(page3.length, 2);

    // Verify all returned files are distinct
    const ids = [...page1, ...page2, ...page3].map((f) => f.id);
    assert.strictEqual(new Set(ids).size, 10);
  });

  await t.test('fileRepo.count and fileRepo.list support search query pagination', () => {
    const searchTotal = fileRepo.count(undefined, `page_test_file_01_${ts}`);
    assert.strictEqual(searchTotal, 1);

    const searchResults = fileRepo.list(undefined, `page_test_file_01_${ts}`, 10, 0);
    assert.strictEqual(searchResults.length, 1);
    assert.ok(searchResults[0].name.includes(`page_test_file_01_${ts}`));
  });

  // Cleanup
  fileRepo.bulkDelete(createdFileIds);
  folderRepo.delete(folder.id);
});

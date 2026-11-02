import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { initDatabase, deletedMessageRepo } from '../src/db/index.js';

describe('Deleted Messages Tombstone Repository', () => {
  it('should initialize deleted_messages table and record deletions', () => {
    initDatabase();

    const testMsgId = Date.now() + Math.floor(Math.random() * 1000000);
    assert.equal(deletedMessageRepo.isDeleted(testMsgId), false);

    deletedMessageRepo.add(testMsgId);
    assert.equal(deletedMessageRepo.isDeleted(testMsgId), true);
  });

  it('should list all deleted message IDs', () => {
    const testMsgId2 = Date.now() + 5000000 + Math.floor(Math.random() * 1000000);
    deletedMessageRepo.add(testMsgId2);

    const all = deletedMessageRepo.getAll();
    assert.ok(all.includes(testMsgId2));
  });
});

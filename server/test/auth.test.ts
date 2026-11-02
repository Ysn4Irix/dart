import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { userRepo, sessionRepo } from '../src/db/index.js';
import { hashPassword, verifyPassword } from '../src/auth/crypto.js';

describe('Multi-User Authentication Suite', () => {
  it('should create and retrieve multiple independent user accounts', () => {
    const ts = Date.now();
    const user1Name = `alice_${ts}`;
    const user2Name = `bob_${ts}`;

    const creds1 = hashPassword('AliceSecretPassword123!');
    const creds2 = hashPassword('BobSecretPassword456!');

    const user1 = userRepo.create(user1Name, creds1.hash, creds1.salt);
    const user2 = userRepo.create(user2Name, creds2.hash, creds2.salt);

    assert.ok(user1.id);
    assert.ok(user2.id);
    assert.notEqual(user1.id, user2.id);

    // Retrieve users
    const fetched1 = userRepo.getByUsername(user1Name);
    const fetched2 = userRepo.getByUsername(user2Name.toUpperCase()); // test case-insensitivity

    assert.ok(fetched1);
    assert.ok(fetched2);
    assert.equal(fetched1.id, user1.id);
    assert.equal(fetched2.id, user2.id);

    // Verify passwords
    assert.equal(verifyPassword('AliceSecretPassword123!', fetched1.password_hash, fetched1.salt), true);
    assert.equal(verifyPassword('WrongPassword!', fetched1.password_hash, fetched1.salt), false);
    assert.equal(verifyPassword('BobSecretPassword456!', fetched2.password_hash, fetched2.salt), true);
  });

  it('should manage independent sessions for distinct users', () => {
    const ts = Date.now();
    const creds = hashPassword('UserPassword999!');
    const userA = userRepo.create(`usera_${ts}`, creds.hash, creds.salt);
    const userB = userRepo.create(`userb_${ts}`, creds.hash, creds.salt);

    const sessionA = sessionRepo.create(userA.id, 1);
    const sessionB = sessionRepo.create(userB.id, 1);

    assert.ok(sessionA.id);
    assert.ok(sessionB.id);
    assert.notEqual(sessionA.id, sessionB.id);

    // Verify session lookups
    const lookupA = sessionRepo.get(sessionA.id);
    const lookupB = sessionRepo.get(sessionB.id);

    assert.ok(lookupA);
    assert.ok(lookupB);
    assert.equal(lookupA.user.username, `usera_${ts}`);
    assert.equal(lookupB.user.username, `userb_${ts}`);

    // Terminate session A
    sessionRepo.delete(sessionA.id);
    assert.equal(sessionRepo.get(sessionA.id), null);
    assert.ok(sessionRepo.get(sessionB.id)); // Session B remains valid
  });
});

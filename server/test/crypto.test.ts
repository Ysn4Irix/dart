import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, verifyPassword, generateSessionToken } from '../src/auth/crypto.js';

describe('Authentication Crypto Utilities', () => {
  it('should hash a password and produce a valid hex salt and hash', () => {
    const password = 'SuperSecretMasterPassword123!';
    const { hash, salt } = hashPassword(password);

    assert.ok(hash, 'Hash should not be empty');
    assert.ok(salt, 'Salt should not be empty');
    assert.equal(salt.length, 32, 'Salt should be 16 bytes encoded as 32 hex characters');
    assert.equal(hash.length, 128, 'Hash should be 64 bytes encoded as 128 hex characters');
  });

  it('should verify the correct password using constant-time comparison', () => {
    const password = 'MySecurePassword!';
    const { hash, salt } = hashPassword(password);

    const isValid = verifyPassword(password, hash, salt);
    assert.equal(isValid, true, 'Correct password must verify to true');
  });

  it('should reject incorrect passwords', () => {
    const password = 'MySecurePassword!';
    const { hash, salt } = hashPassword(password);

    assert.equal(verifyPassword('WrongPassword', hash, salt), false);
    assert.equal(verifyPassword('', hash, salt), false);
    assert.equal(verifyPassword('mysecurepassword!', hash, salt), false, 'Password verification must be case-sensitive');
  });

  it('should generate a 32-byte (64 hex char) session token', () => {
    const token1 = generateSessionToken();
    const token2 = generateSessionToken();

    assert.equal(token1.length, 64);
    assert.equal(token2.length, 64);
    assert.notEqual(token1, token2, 'Generated session tokens must be unique');
  });
});

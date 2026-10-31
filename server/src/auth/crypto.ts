import crypto from 'node:crypto';

/**
 * Hashes a password using Node.js scrypt with a unique salt
 */
export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const actualSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, actualSalt, 64).toString('hex');
  return { hash, salt: actualSalt };
}

/**
 * Verifies a plain password against an existing scrypt hash and salt in constant time
 */
export function verifyPassword(password: string, hash: string, salt: string): boolean {
  try {
    const hashedAttempt = crypto.scryptSync(password, salt, 64).toString('hex');
    const a = Buffer.from(hashedAttempt, 'hex');
    const b = Buffer.from(hash, 'hex');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/**
 * Generates a secure random session token
 */
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

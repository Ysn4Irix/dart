import dotenv from 'dotenv';
import path from 'node:path';
import fs from 'node:fs';

dotenv.config();

const ROOT_DIR = process.cwd();
const DATA_DIR = process.env.DATA_DIR || path.resolve(ROOT_DIR, 'data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export const config = {
  port: Number(process.env.PORT) || 4000,
  host: process.env.HOST || '0.0.0.0',
  dataDir: DATA_DIR,
  dbPath: path.resolve(DATA_DIR, 'drive.db'),
  publicUrl: process.env.PUBLIC_URL || 'http://localhost:3000',
  telegram: {
    apiId: process.env.TELEGRAM_API_ID ? Number(process.env.TELEGRAM_API_ID) : 0,
    apiHash: process.env.TELEGRAM_API_HASH || '',
    sessionString: process.env.TELEGRAM_SESSION_STRING || '',
  },
};

/**
 * Persists updated session credentials into .env file
 */
export function saveSessionToEnv(sessionString: string, apiId?: number, apiHash?: string) {
  const envPath = path.resolve(ROOT_DIR, '.env');
  let currentEnv = '';

  if (fs.existsSync(envPath)) {
    currentEnv = fs.readFileSync(envPath, 'utf-8');
  }

  const updates: Record<string, string> = {
    TELEGRAM_SESSION_STRING: sessionString,
  };

  if (apiId) updates.TELEGRAM_API_ID = String(apiId);
  if (apiHash) updates.TELEGRAM_API_HASH = apiHash;

  let newEnv = currentEnv;
  for (const [key, val] of Object.entries(updates)) {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (regex.test(newEnv)) {
      newEnv = newEnv.replace(regex, `${key}=${val}`);
    } else {
      newEnv += `\n${key}=${val}`;
    }
  }

  fs.writeFileSync(envPath, newEnv.trim() + '\n', 'utf-8');
  config.telegram.sessionString = sessionString;
  if (apiId) config.telegram.apiId = apiId;
  if (apiHash) config.telegram.apiHash = apiHash;
}

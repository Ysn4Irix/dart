import dotenv from 'dotenv';
import path from 'node:path';
import fs from 'node:fs';

dotenv.config();

const ROOT_DIR = process.cwd();
const DATA_DIR = process.env.DATA_DIR || path.resolve(ROOT_DIR, 'data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Persistent session credentials stored in volume DATA_DIR (for Docker / Dokploy)
const sessionFilePath = path.resolve(DATA_DIR, 'telegram_session.json');
let persistedSession = '';
let persistedApiId = 0;
let persistedApiHash = '';

if (fs.existsSync(sessionFilePath)) {
  try {
    const raw = JSON.parse(fs.readFileSync(sessionFilePath, 'utf-8'));
    if (raw.sessionString) persistedSession = raw.sessionString;
    if (raw.apiId) persistedApiId = Number(raw.apiId);
    if (raw.apiHash) persistedApiHash = raw.apiHash;
  } catch {
    // Ignore invalid JSON
  }
}

export const config = {
  port: Number(process.env.PORT) || 4000,
  host: process.env.HOST || '0.0.0.0',
  dataDir: DATA_DIR,
  dbPath: path.resolve(DATA_DIR, 'drive.db'),
  publicUrl: process.env.PUBLIC_URL || 'http://localhost:3000',
  telegram: {
    apiId: process.env.TELEGRAM_API_ID ? Number(process.env.TELEGRAM_API_ID) : (persistedApiId || 0),
    apiHash: process.env.TELEGRAM_API_HASH || persistedApiHash || '',
    sessionString: process.env.TELEGRAM_SESSION_STRING || persistedSession || '',
  },
};

/**
 * Resolves the absolute path to the compiled client distribution folder if available.
 */
export function getClientDistPath(): string | null {
  const candidates = [
    process.env.CLIENT_DIST,
    path.resolve(process.cwd(), '../client/dist'),
    path.resolve(process.cwd(), 'client/dist'),
    path.resolve(process.cwd(), 'dist/client'),
    import.meta.dirname ? path.resolve(import.meta.dirname, '../../client/dist') : null,
    import.meta.dirname ? path.resolve(import.meta.dirname, '../client/dist') : null,
  ].filter(Boolean) as string[];

  return candidates.find((p) => fs.existsSync(p)) || null;
}

/**
 * Persists updated session credentials into volume JSON file and .env file
 */
export function saveSessionToEnv(sessionString: string, apiId?: number, apiHash?: string) {
  // 1. Persist to data volume (reliable across Docker container restarts and updates)
  try {
    const sessionData = {
      sessionString,
      apiId: apiId || config.telegram.apiId,
      apiHash: apiHash || config.telegram.apiHash,
      savedAt: new Date().toISOString(),
    };
    fs.writeFileSync(sessionFilePath, JSON.stringify(sessionData, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not persist session to dataDir:', err);
  }

  // 2. Also update local .env file if available
  const envPath = path.resolve(ROOT_DIR, '.env');
  let currentEnv = '';

  if (fs.existsSync(envPath)) {
    try {
      currentEnv = fs.readFileSync(envPath, 'utf-8');
    } catch {
      // Ignore if not readable
    }
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

  try {
    fs.writeFileSync(envPath, newEnv.trim() + '\n', 'utf-8');
  } catch {
    // Ignore in read-only container root
  }

  config.telegram.sessionString = sessionString;
  if (apiId) config.telegram.apiId = apiId;
  if (apiHash) config.telegram.apiHash = apiHash;
}

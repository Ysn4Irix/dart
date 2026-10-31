import { DatabaseSync } from 'node:sqlite';
import { nanoid } from 'nanoid';
import { config } from '../config.js';
import { generateSessionToken } from '../auth/crypto.js';

export interface User {
  id: string;
  username: string;
  password_hash: string;
  salt: string;
  created_at: number;
}

export interface Session {
  id: string;
  user_id: string;
  created_at: number;
  expires_at: number;
}

export interface Folder {
  id: string;
  name: string;
  parent_id: string | null;
  created_at: number;
}

export interface FileRecord {
  id: string;
  name: string;
  size: number;
  mime_type: string;
  folder_id: string | null;
  telegram_message_id: number;
  telegram_access_hash: string | null;
  status: 'active' | 'missing';
  created_at: number;
}

export interface Share {
  id: string;
  file_id: string;
  download_count: number;
  expires_at: number | null;
  created_at: number;
}

let sqlite: DatabaseSync | null = null;

export function getDatabase(): DatabaseSync {
  if (!sqlite) {
    sqlite = new DatabaseSync(config.dbPath);
    sqlite.exec('PRAGMA journal_mode = WAL;');
    sqlite.exec('PRAGMA foreign_keys = ON;');
  }
  return sqlite;
}

/**
 * Initializes database tables
 */
export function initDatabase() {
  const db = getDatabase();

  db.exec(`
    CREATE TABLE IF NOT EXISTS folders (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      parent_id TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (parent_id) REFERENCES folders(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS files (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      size INTEGER NOT NULL,
      mime_type TEXT NOT NULL,
      folder_id TEXT,
      telegram_message_id INTEGER NOT NULL,
      telegram_access_hash TEXT,
      status TEXT DEFAULT 'active' NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS shares (
      id TEXT PRIMARY KEY,
      file_id TEXT NOT NULL,
      download_count INTEGER DEFAULT 0 NOT NULL,
      expires_at INTEGER,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);
}

// ================= Folders =================
export const folderRepo = {
  list(parentId: string | null = null): Folder[] {
    const db = getDatabase();
    if (parentId === null) {
      const stmt = db.prepare('SELECT * FROM folders WHERE parent_id IS NULL ORDER BY name ASC');
      return stmt.all() as unknown as Folder[];
    }
    const stmt = db.prepare('SELECT * FROM folders WHERE parent_id = ? ORDER BY name ASC');
    return stmt.all(parentId) as unknown as Folder[];
  },

  get(id: string): Folder | null {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM folders WHERE id = ?');
    const result = stmt.get(id);
    return (result as unknown as Folder) || null;
  },

  create(name: string, parentId: string | null = null): Folder {
    const db = getDatabase();
    const id = nanoid(12);
    const createdAt = Date.now();
    const stmt = db.prepare(
      'INSERT INTO folders (id, name, parent_id, created_at) VALUES (?, ?, ?, ?)'
    );
    stmt.run(id, name, parentId, createdAt);
    return { id, name, parent_id: parentId, created_at: createdAt };
  },

  rename(id: string, name: string): boolean {
    const db = getDatabase();
    const stmt = db.prepare('UPDATE folders SET name = ? WHERE id = ?');
    stmt.run(name, id);
    return true;
  },

  delete(id: string): boolean {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM folders WHERE id = ?');
    stmt.run(id);
    return true;
  },
};

// ================= Files =================
export const fileRepo = {
  list(folderId: string | null = null, search?: string): FileRecord[] {
    const db = getDatabase();
    if (search && search.trim()) {
      const stmt = db.prepare(
        'SELECT * FROM files WHERE name LIKE ? ORDER BY created_at DESC'
      );
      return stmt.all(`%${search.trim()}%`) as unknown as FileRecord[];
    }

    if (folderId === null) {
      const stmt = db.prepare(
        'SELECT * FROM files WHERE folder_id IS NULL ORDER BY created_at DESC'
      );
      return stmt.all() as unknown as FileRecord[];
    }

    const stmt = db.prepare(
      'SELECT * FROM files WHERE folder_id = ? ORDER BY created_at DESC'
    );
    return stmt.all(folderId) as unknown as FileRecord[];
  },

  get(id: string): FileRecord | null {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM files WHERE id = ?');
    const result = stmt.get(id);
    return (result as unknown as FileRecord) || null;
  },

  getByMessageId(telegramMessageId: number): FileRecord | null {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM files WHERE telegram_message_id = ?');
    const result = stmt.get(telegramMessageId);
    return (result as unknown as FileRecord) || null;
  },

  create(file: {
    name: string;
    size: number;
    mime_type: string;
    folder_id: string | null;
    telegram_message_id: number;
    telegram_access_hash?: string | null;
    created_at?: number;
  }): FileRecord {
    const db = getDatabase();
    const id = nanoid(16);
    const createdAt = file.created_at || Date.now();
    const stmt = db.prepare(`
      INSERT INTO files (id, name, size, mime_type, folder_id, telegram_message_id, telegram_access_hash, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?)
    `);
    stmt.run(
      id,
      file.name,
      file.size,
      file.mime_type,
      file.folder_id,
      file.telegram_message_id,
      file.telegram_access_hash || null,
      createdAt
    );
    return {
      id,
      name: file.name,
      size: file.size,
      mime_type: file.mime_type,
      folder_id: file.folder_id,
      telegram_message_id: file.telegram_message_id,
      telegram_access_hash: file.telegram_access_hash || null,
      status: 'active',
      created_at: createdAt,
    };
  },

  updateDate(telegramMessageId: number, createdAt: number): void {
    const db = getDatabase();
    const stmt = db.prepare('UPDATE files SET created_at = ? WHERE telegram_message_id = ?');
    stmt.run(createdAt, telegramMessageId);
  },

  updateStatus(id: string, status: 'active' | 'missing'): void {
    const db = getDatabase();
    const stmt = db.prepare('UPDATE files SET status = ? WHERE id = ?');
    stmt.run(status, id);
  },

  move(id: string, folderId: string | null): void {
    const db = getDatabase();
    const stmt = db.prepare('UPDATE files SET folder_id = ? WHERE id = ?');
    stmt.run(folderId, id);
  },

  rename(id: string, name: string): void {
    const db = getDatabase();
    const stmt = db.prepare('UPDATE files SET name = ? WHERE id = ?');
    stmt.run(name, id);
  },

  delete(id: string): void {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM files WHERE id = ?');
    stmt.run(id);
  },
};

// ================= Shares =================
export const shareRepo = {
  create(fileId: string, expiresAt: number | null = null): Share {
    const db = getDatabase();
    const id = nanoid(10);
    const createdAt = Date.now();
    const stmt = db.prepare(
      'INSERT INTO shares (id, file_id, download_count, expires_at, created_at) VALUES (?, ?, 0, ?, ?)'
    );
    stmt.run(id, fileId, expiresAt, createdAt);
    return {
      id,
      file_id: fileId,
      download_count: 0,
      expires_at: expiresAt,
      created_at: createdAt,
    };
  },

  get(id: string): Share | null {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM shares WHERE id = ?');
    const result = stmt.get(id);
    return (result as unknown as Share) || null;
  },

  getWithFile(id: string): { share: Share; file: FileRecord } | null {
    const share = this.get(id);
    if (!share) return null;
    const file = fileRepo.get(share.file_id);
    if (!file) return null;
    return { share, file };
  },

  incrementDownload(id: string): void {
    const db = getDatabase();
    const stmt = db.prepare(
      'UPDATE shares SET download_count = download_count + 1 WHERE id = ?'
    );
    stmt.run(id);
  },

  delete(id: string): void {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM shares WHERE id = ?');
    stmt.run(id);
  },
};

// ================= Users =================
export const userRepo = {
  count(): number {
    const db = getDatabase();
    const row = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
    return row.count;
  },

  getOwner(): User | null {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM users ORDER BY created_at ASC LIMIT 1').get();
    return (row as unknown as User) || null;
  },

  getByUsername(username: string): User | null {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM users WHERE username = ? COLLATE NOCASE').get(username);
    return (row as unknown as User) || null;
  },

  getById(id: string): User | null {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    return (row as unknown as User) || null;
  },

  create(username: string, passwordHash: string, salt: string): User {
    const db = getDatabase();
    const id = nanoid(12);
    const createdAt = Date.now();
    const stmt = db.prepare(
      'INSERT INTO users (id, username, password_hash, salt, created_at) VALUES (?, ?, ?, ?, ?)'
    );
    stmt.run(id, username, passwordHash, salt, createdAt);
    return { id, username, password_hash: passwordHash, salt, created_at: createdAt };
  },
};

// ================= Sessions =================
export const sessionRepo = {
  create(userId: string, ttlDays = 30): Session {
    const db = getDatabase();
    const id = generateSessionToken();
    const createdAt = Date.now();
    const expiresAt = createdAt + ttlDays * 24 * 60 * 60 * 1000;
    const stmt = db.prepare(
      'INSERT INTO sessions (id, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)'
    );
    stmt.run(id, userId, createdAt, expiresAt);
    return { id, user_id: userId, created_at: createdAt, expires_at: expiresAt };
  },

  get(id: string): { session: Session; user: User } | null {
    const db = getDatabase();
    const row = db.prepare(`
      SELECT 
        s.id as s_id, s.user_id as s_user_id, s.created_at as s_created_at, s.expires_at as s_expires_at,
        u.id as u_id, u.username as u_username, u.password_hash as u_password_hash, u.salt as u_salt, u.created_at as u_created_at
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = ? AND s.expires_at > ?
    `).get(id, Date.now()) as Record<string, unknown> | undefined;

    if (!row) return null;

    return {
      session: {
        id: row.s_id as string,
        user_id: row.s_user_id as string,
        created_at: row.s_created_at as number,
        expires_at: row.s_expires_at as number,
      },
      user: {
        id: row.u_id as string,
        username: row.u_username as string,
        password_hash: row.u_password_hash as string,
        salt: row.u_salt as string,
        created_at: row.u_created_at as number,
      },
    };
  },

  delete(id: string): void {
    const db = getDatabase();
    db.prepare('DELETE FROM sessions WHERE id = ?').run(id);
  },

  deleteForUser(userId: string): void {
    const db = getDatabase();
    db.prepare('DELETE FROM sessions WHERE user_id = ?').run(userId);
  },

  cleanupExpired(): void {
    const db = getDatabase();
    db.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(Date.now());
  },
};

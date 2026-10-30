import { AuthStatus, FileRecord, Folder, PublicShareDetails, Share } from './types.js';

const API_BASE = '';

export const api = {
  // Auth
  async getAuthStatus(): Promise<AuthStatus> {
    const res = await fetch(`${API_BASE}/api/auth/status`);
    if (!res.ok) throw new Error('Failed to fetch auth status');
    return res.json();
  },

  async sendLoginCode(apiId: number, apiHash: string, phoneNumber: string): Promise<{ phoneCodeHash: string }> {
    const res = await fetch(`${API_BASE}/api/auth/send-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiId, apiHash, phoneNumber }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to send login code');
    }
    return res.json();
  },

  async completeSignIn(
    phoneNumber: string,
    phoneCodeHash: string,
    code: string,
    password?: string
  ): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/api/auth/sign-in`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber, phoneCodeHash, code, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to verify login code');
    }
    return res.json();
  },

  // Folders
  async getFolders(parentId: string | null = null): Promise<Folder[]> {
    const url = parentId ? `${API_BASE}/api/folders?parentId=${encodeURIComponent(parentId)}` : `${API_BASE}/api/folders`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to load folders');
    return res.json();
  },

  async createFolder(name: string, parentId: string | null = null): Promise<Folder> {
    const res = await fetch(`${API_BASE}/api/folders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, parentId }),
    });
    if (!res.ok) throw new Error('Failed to create folder');
    return res.json();
  },

  async deleteFolder(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/api/folders/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete folder');
  },

  // Files
  async getFiles(folderId: string | null = null, search?: string): Promise<FileRecord[]> {
    const params = new URLSearchParams();
    if (folderId) params.set('folderId', folderId);
    if (search) params.set('search', search);

    const res = await fetch(`${API_BASE}/api/files?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to load files');
    return res.json();
  },

  async uploadFile(file: File, folderId: string | null = null, onProgress?: (percent: number) => void): Promise<FileRecord> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${API_BASE}/api/files/upload`);

      if (onProgress) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            onProgress(percent);
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolve(JSON.parse(xhr.responseText));
          } catch {
            reject(new Error('Invalid upload response'));
          }
        } else {
          try {
            const err = JSON.parse(xhr.responseText);
            reject(new Error(err.error || 'Upload failed'));
          } catch {
            reject(new Error('Upload failed'));
          }
        }
      };

      xhr.onerror = () => reject(new Error('Network error during file upload'));

      const formData = new FormData();
      formData.append('file', file);
      if (folderId) {
        formData.append('folderId', folderId);
      }
      xhr.send(formData);
    });
  },

  async syncFiles(): Promise<{ success: boolean; scanned: number; added: number; skipped: number }> {
    const res = await fetch(`${API_BASE}/api/files/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to sync with Telegram');
    }
    return res.json();
  },

  async deleteFile(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/api/files/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete file');
  },

  async renameFile(id: string, name: string): Promise<void> {
    const res = await fetch(`${API_BASE}/api/files/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) throw new Error('Failed to rename file');
  },

  async moveFile(id: string, folderId: string | null): Promise<void> {
    const res = await fetch(`${API_BASE}/api/files/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folderId }),
    });
    if (!res.ok) throw new Error('Failed to move file');
  },

  // Shares
  async createShare(fileId: string, expiresInHours?: number): Promise<{ share: Share; publicUrl: string }> {
    const res = await fetch(`${API_BASE}/api/shares`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileId, expiresInHours }),
    });
    if (!res.ok) throw new Error('Failed to create share link');
    return res.json();
  },

  async getPublicShare(slug: string): Promise<PublicShareDetails> {
    const res = await fetch(`${API_BASE}/api/shares/${encodeURIComponent(slug)}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Share link not found or expired');
    }
    return res.json();
  },
};

/**
 * Format bytes into human readable string
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

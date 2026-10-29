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

export interface AuthStatus {
  configured: boolean;
  authorized: boolean;
}

export interface PublicShareDetails {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  downloadCount: number;
  createdAt: number;
  expiresAt: number | null;
  downloadUrl: string;
  streamUrl: string;
  telegramMessageId: number;
}

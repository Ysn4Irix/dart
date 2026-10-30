import React from 'react';
import {
  FileText,
  FileCode,
  FileArchive,
  Image as ImageIcon,
  Video,
  Music,
  Download,
  Share2,
  Trash2,
  Eye,
  ChevronRight,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { FileRecord, Folder } from '../types.js';
import { formatBytes } from '../api.js';

interface FileGridProps {
  files: FileRecord[];
  folders: Folder[];
  currentFolderId: string | null;
  onNavigateFolder: (id: string | null) => void;
  onPreview: (file: FileRecord) => void;
  onDownload: (file: FileRecord) => void;
  onShare: (file: FileRecord) => void;
  onDelete: (file: FileRecord) => void;
  onSync?: () => void;
  isSyncing?: boolean;
}

export const FileGrid: React.FC<FileGridProps> = ({
  files,
  folders,
  currentFolderId,
  onNavigateFolder,
  onPreview,
  onDownload,
  onShare,
  onDelete,
  onSync,
  isSyncing = false,
}) => {
  const currentFolder = folders.find((f) => f.id === currentFolderId);

  const getFileIcon = (mime: string, name: string) => {
    if (mime.startsWith('image/')) return <ImageIcon className="w-6 h-6 text-emerald-400" />;
    if (mime.startsWith('video/')) return <Video className="w-6 h-6 text-sky-400" />;
    if (mime.startsWith('audio/')) return <Music className="w-6 h-6 text-indigo-400" />;
    if (mime.includes('zip') || mime.includes('tar') || mime.includes('rar') || mime.includes('7z'))
      return <FileArchive className="w-6 h-6 text-amber-400" />;
    if (
      name.endsWith('.ts') ||
      name.endsWith('.js') ||
      name.endsWith('.json') ||
      name.endsWith('.py') ||
      name.endsWith('.html') ||
      name.endsWith('.css')
    )
      return <FileCode className="w-6 h-6 text-teal-400" />;
    return <FileText className="w-6 h-6 text-stone-400" />;
  };

  const isMedia = (mime: string) => {
    return mime.startsWith('video/') || mime.startsWith('audio/') || mime.startsWith('image/') || mime === 'application/pdf';
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-stone-900">
      {/* Breadcrumb Header */}
      <div className="px-8 py-4 border-b border-stone-800/80 flex items-center gap-2 text-sm text-stone-400">
        <button
          onClick={() => onNavigateFolder(null)}
          className={`hover:text-stone-100 transition-colors cursor-pointer ${
            currentFolderId === null ? 'font-medium text-stone-100' : ''
          }`}
        >
          All Files
        </button>
        {currentFolder && (
          <>
            <ChevronRight className="w-4 h-4 text-stone-600" />
            <span className="font-medium text-stone-100">{currentFolder.name}</span>
          </>
        )}
      </div>

      {/* Grid Content */}
      <div className="flex-1 overflow-y-auto p-8">
        {files.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center text-stone-500 border border-dashed border-stone-800 rounded-xl p-6">
            <FileText className="w-10 h-10 mb-3 text-stone-600" />
            <div className="text-stone-300 font-medium">No files displayed yet</div>
            <div className="text-xs text-stone-500 mt-1 max-w-sm mb-4">
              If your Telegram Saved Messages already has files, click below to scan and import them into Dart.
            </div>
            {onSync && (
              <button
                onClick={onSync}
                disabled={isSyncing}
                className="flex items-center gap-2 px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium rounded-lg border border-stone-700 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-400' : ''}`} />
                <span>{isSyncing ? 'Scanning Saved Messages...' : 'Scan & Import Saved Messages'}</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {files.map((file) => {
              const hasPreview = isMedia(file.mime_type);
              const isMissing = file.status === 'missing';

              return (
                <div
                  key={file.id}
                  className={`group relative bg-stone-800/40 border border-stone-800 rounded-xl p-4 hover:border-stone-700/80 hover:bg-stone-800/80 transition-all flex flex-col justify-between ${
                    isMissing ? 'opacity-60 border-red-950/60' : ''
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <div className="p-2.5 rounded-lg bg-stone-800 border border-stone-700/40">
                        {getFileIcon(file.mime_type, file.name)}
                      </div>

                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        {hasPreview && !isMissing && (
                          <button
                            onClick={() => onPreview(file)}
                            className="p-1.5 text-stone-400 hover:text-stone-100 hover:bg-stone-700/60 rounded-md transition-colors cursor-pointer"
                            title="Preview / Stream"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        {!isMissing && (
                          <button
                            onClick={() => onShare(file)}
                            className="p-1.5 text-stone-400 hover:text-stone-100 hover:bg-stone-700/60 rounded-md transition-colors cursor-pointer"
                            title="Share Link"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => onDownload(file)}
                          className="p-1.5 text-stone-400 hover:text-stone-100 hover:bg-stone-700/60 rounded-md transition-colors cursor-pointer"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDelete(file)}
                          className="p-1.5 text-stone-400 hover:text-red-400 hover:bg-stone-700/60 rounded-md transition-colors cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="font-medium text-sm text-stone-200 truncate mb-1" title={file.name}>
                      {file.name}
                    </div>

                    {isMissing && (
                      <div className="flex items-center gap-1.5 text-xs text-red-400 mb-2">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>Deleted from Telegram</span>
                      </div>
                    )}
                  </div>

                  {/* Metadata: plain text without decorative badges */}
                  <div className="mt-3 pt-3 border-t border-stone-800/80 flex items-center justify-between text-xs text-stone-400">
                    <span>{formatBytes(file.size)}</span>
                    <span>{new Date(file.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

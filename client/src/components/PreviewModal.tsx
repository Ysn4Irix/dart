import React from 'react';
import { X, Download, AlertCircle } from 'lucide-react';
import { FileRecord } from '../types.js';
import { formatBytes } from '../api.js';

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: FileRecord | null;
  onDownload: (file: FileRecord) => void;
}

export const PreviewModal: React.FC<PreviewModalProps> = ({
  isOpen,
  onClose,
  file,
  onDownload,
}) => {
  if (!isOpen || !file) return null;

  const streamUrl = `/api/files/${file.id}/stream`;
  const isVideo = file.mime_type.startsWith('video/');
  const isAudio = file.mime_type.startsWith('audio/');
  const isImage = file.mime_type.startsWith('image/');
  const isPdf = file.mime_type === 'application/pdf';

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden transition-colors">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
          <div className="flex-1 truncate mr-4">
            <h3 className="font-semibold text-stone-900 dark:text-stone-100 text-sm truncate">{file.name}</h3>
            <span className="text-xs text-stone-500 dark:text-stone-400">{formatBytes(file.size)}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onDownload(file)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-medium rounded-lg border border-stone-200 dark:border-stone-700/60 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </button>
            <button
              onClick={onClose}
              className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Media Player / Viewer */}
        <div className="flex-1 overflow-auto bg-stone-100 dark:bg-stone-950 flex items-center justify-center p-6 min-h-[400px]">
          {isVideo && (
            <video
              controls
              autoPlay
              className="max-h-[70vh] max-w-full rounded-lg shadow-lg"
              src={streamUrl}
            >
              Your browser does not support the video tag.
            </video>
          )}

          {isAudio && (
            <div className="w-full max-w-md p-6 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 text-center space-y-4 shadow-sm">
              <div className="text-sm font-medium text-stone-900 dark:text-stone-200 truncate">{file.name}</div>
              <audio controls className="w-full" src={streamUrl}>
                Your browser does not support the audio element.
              </audio>
            </div>
          )}

          {isImage && (
            <img
              src={streamUrl}
              alt={file.name}
              className="max-h-[70vh] max-w-full object-contain rounded-lg"
            />
          )}

          {isPdf && (
            <iframe
              src={streamUrl}
              title={file.name}
              className="w-full h-[70vh] rounded-lg border border-stone-200 dark:border-stone-800"
            />
          )}

          {!isVideo && !isAudio && !isImage && !isPdf && (
            <div className="text-center text-stone-500 dark:text-stone-400 space-y-2">
              <AlertCircle className="w-10 h-10 mx-auto text-stone-400 dark:text-stone-500" />
              <div className="text-sm font-medium text-stone-800 dark:text-stone-200">No preview available</div>
              <div className="text-xs text-stone-500">
                This file type cannot be previewed in the browser. You can download it directly.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

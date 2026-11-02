import React, { useState, useEffect } from 'react';
import { X, Download, AlertCircle, Copy, Check, Trash2, FileText, Loader2 } from 'lucide-react';
import { FileRecord } from '../types.js';
import { formatBytes } from '../api.js';

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: FileRecord | null;
  onDownload: (file: FileRecord) => void;
  onDelete?: (file: FileRecord) => void;
}

export const PreviewModal: React.FC<PreviewModalProps> = ({
  isOpen,
  onClose,
  file,
  onDownload,
  onDelete,
}) => {
  const [textContent, setTextContent] = useState<string | null>(null);
  const [isLoadingText, setIsLoadingText] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !file) return null;

  const streamUrl = `/api/files/${file.id}/stream`;
  const lowerName = file.name.toLowerCase();
  const isVideo = file.mime_type.startsWith('video/');
  const isAudio = file.mime_type.startsWith('audio/');
  const isImage = file.mime_type.startsWith('image/');
  const isPdf = file.mime_type === 'application/pdf';
  const isText =
    file.mime_type.startsWith('text/') ||
    file.mime_type === 'application/json' ||
    lowerName.endsWith('.txt') ||
    lowerName.endsWith('.md') ||
    lowerName.endsWith('.json') ||
    lowerName.endsWith('.log') ||
    lowerName.endsWith('.srt') ||
    lowerName.endsWith('.pem') ||
    lowerName.endsWith('.vcf') ||
    lowerName.endsWith('.csv');

  useEffect(() => {
    if (isText && file) {
      setIsLoadingText(true);
      setTextContent(null);
      fetch(`/api/files/${file.id}/stream`)
        .then((res) => {
          if (!res.ok) throw new Error('Failed to load text preview');
          return res.text();
        })
        .then((text) => setTextContent(text))
        .catch(() => setTextContent('Could not load text content.'))
        .finally(() => setIsLoadingText(false));
    }
  }, [file?.id, isText]);

  const handleCopyText = async () => {
    if (textContent) {
      try {
        await navigator.clipboard.writeText(textContent);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // fallback
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden transition-colors">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
          <div className="flex-1 truncate mr-4">
            <h3 className="font-semibold text-stone-900 dark:text-stone-100 text-sm truncate">{file.name}</h3>
            <span className="text-xs text-stone-500 dark:text-stone-400">{formatBytes(file.size)}</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {isText && textContent && (
              <button
                onClick={handleCopyText}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-medium rounded-lg border border-stone-200 dark:border-stone-700/60 transition-colors cursor-pointer"
                title="Copy text content to clipboard"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            )}

            <button
              onClick={() => onDownload(file)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-medium rounded-lg border border-stone-200 dark:border-stone-700/60 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </button>

            {onDelete && (
              <button
                onClick={() => {
                  onDelete(file);
                }}
                className="p-1.5 text-stone-500 dark:text-stone-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-stone-200/60 dark:hover:bg-stone-700/60 rounded-md transition-colors cursor-pointer"
                title="Delete file"
                aria-label="Delete file"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={onClose}
              className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors p-1 cursor-pointer"
              aria-label="Close preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Media Player / Text Viewer */}
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

          {isText && (
            <div className="w-full h-full max-h-[70vh] flex flex-col bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden">
              <div className="px-4 py-2 border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/60 flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
                <div className="flex items-center gap-1.5 font-mono">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Text Document</span>
                </div>
                <span>UTF-8</span>
              </div>
              <div className="flex-1 overflow-auto p-4">
                {isLoadingText ? (
                  <div className="h-48 flex items-center justify-center gap-2 text-xs text-stone-400">
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                    <span>Loading message text...</span>
                  </div>
                ) : (
                  <pre className="font-mono text-xs text-stone-800 dark:text-stone-200 whitespace-pre-wrap break-words leading-relaxed select-text">
                    {textContent || ''}
                  </pre>
                )}
              </div>
            </div>
          )}

          {!isVideo && !isAudio && !isImage && !isPdf && !isText && (
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

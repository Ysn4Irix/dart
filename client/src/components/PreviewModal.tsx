import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Download,
  Share2,
  Copy,
  Check,
  Trash2,
  FileText,
  FileArchive,
  Package,
  FileCode,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { FileRecord } from '../types.js';
import { formatBytes } from '../api.js';

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: FileRecord | null;
  onDownload: (file: FileRecord) => void;
  onDelete?: (file: FileRecord) => void;
  onShare?: (file: FileRecord) => void;
  files?: FileRecord[];
  onNavigate?: (file: FileRecord) => void;
}

export type ViewerType = 'image' | 'video' | 'audio' | 'pdf' | 'text' | 'generic';

export function getFileViewerType(mimeType: string, fileName: string): ViewerType {
  const mime = (mimeType || '').toLowerCase();
  const name = (fileName || '').toLowerCase();

  // 1. Image
  if (
    mime.startsWith('image/') ||
    /\.(png|jpe?g|gif|webp|svg|bmp|ico|avif)$/i.test(name)
  ) {
    return 'image';
  }

  // 2. Video
  if (
    mime.startsWith('video/') ||
    /\.(mp4|webm|mkv|mov|avi|flv|wmv|m4v)$/i.test(name)
  ) {
    return 'video';
  }

  // 3. Audio
  if (
    mime.startsWith('audio/') ||
    /\.(mp3|ogg|wav|m4a|aac|flac|opus|weba|wma)$/i.test(name)
  ) {
    return 'audio';
  }

  // 4. PDF
  if (mime === 'application/pdf' || name.endsWith('.pdf')) {
    return 'pdf';
  }

  // 5. Text & Source Code
  if (
    mime.startsWith('text/') ||
    mime === 'application/json' ||
    mime === 'application/javascript' ||
    mime === 'application/xml' ||
    mime === 'application/x-subrip' ||
    mime === 'application/x-sh' ||
    /\.(txt|md|markdown|json|js|jsx|ts|tsx|html|htm|css|scss|xml|yaml|yml|py|sh|bash|ps1|csv|tsv|log|srt|vcf|pem|pub|key|sql|env|ini|conf|toml|properties|diff|patch|rs|go|dart|php|c|cpp|h|hpp)$/i.test(name)
  ) {
    return 'text';
  }

  return 'generic';
}

function getGenericFileIcon(name: string, mime: string) {
  const lower = name.toLowerCase();
  if (lower.endsWith('.apk') || lower.endsWith('.exe') || lower.endsWith('.dmg')) {
    return <Package className="w-12 h-12 text-emerald-500" />;
  }
  if (
    mime.includes('zip') ||
    mime.includes('tar') ||
    mime.includes('rar') ||
    mime.includes('7z') ||
    mime.includes('compressed') ||
    /\.(zip|rar|7z|tar|gz|bz2|xz|tgz|iso|crx)$/i.test(lower)
  ) {
    return <FileArchive className="w-12 h-12 text-amber-500" />;
  }
  if (/\.(ts|tsx|js|jsx|json|py|html|css|key|pem|pub|yaml|yml)$/i.test(lower)) {
    return <FileCode className="w-12 h-12 text-teal-500" />;
  }
  return <FileText className="w-12 h-12 text-stone-400" />;
}

export const PreviewModal: React.FC<PreviewModalProps> = ({
  isOpen,
  onClose,
  file,
  onDownload,
  onDelete,
  onShare,
  files,
  onNavigate,
}) => {
  const [textContent, setTextContent] = useState<string | null>(null);
  const [isLoadingText, setIsLoadingText] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mediaLoading, setMediaLoading] = useState(true);
  const [mediaError, setMediaError] = useState(false);

  const currentIndex = file && files ? files.findIndex((f) => f.id === file.id) : -1;
  const hasPrev = files && currentIndex > 0;
  const hasNext = files && currentIndex !== -1 && currentIndex < files.length - 1;

  const handlePrev = () => {
    if (hasPrev && files && onNavigate) {
      onNavigate(files[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    if (hasNext && files && onNavigate) {
      onNavigate(files[currentIndex + 1]);
    }
  };

  // Keyboard navigation (Escape, Left Arrow, Right Arrow)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft' && hasPrev) {
        handlePrev();
      } else if (e.key === 'ArrowRight' && hasNext) {
        handleNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, hasPrev, hasNext, currentIndex, files]);

  const viewerType = file ? getFileViewerType(file.mime_type, file.name) : 'generic';
  const streamUrl = file ? `/api/files/${file.id}/stream` : '';

  // Reset loading / error state whenever active file changes
  useEffect(() => {
    if (!file) return;
    setMediaLoading(true);
    setMediaError(false);

    if (viewerType === 'text') {
      setIsLoadingText(true);
      setTextContent(null);
      fetch(`/api/files/${file.id}/stream`)
        .then((res) => {
          if (!res.ok) throw new Error('Failed to load text preview');
          return res.text();
        })
        .then((text) => {
          setTextContent(text);
        })
        .catch(() => {
          setTextContent('Could not load text content from server.');
        })
        .finally(() => {
          setIsLoadingText(false);
        });
    }
  }, [file?.id, viewerType]);

  const textLines = useMemo(() => {
    if (!textContent) return [];
    return textContent.split('\n');
  }, [textContent]);

  if (!isOpen || !file) return null;

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

  const formattedDate = new Date(file.created_at).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs transition-opacity"
      role="dialog"
      aria-modal="true"
      aria-labelledby="preview-modal-title"
    >
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden transition-colors">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50/60 dark:bg-stone-900/60">
          <div className="flex-1 truncate mr-3 sm:mr-4">
            <div className="flex items-center gap-2">
              <h3 id="preview-modal-title" className="font-semibold text-stone-900 dark:text-stone-100 text-sm truncate" title={file.name}>
                {file.name}
              </h3>
              {files && files.length > 1 && currentIndex !== -1 && (
                <span className="text-xs text-stone-400 dark:text-stone-500 font-mono shrink-0">
                  ({currentIndex + 1} of {files.length})
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              <span>{formatBytes(file.size)}</span>
              <span>•</span>
              <span title="Telegram message timestamp">{formattedDate}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {viewerType === 'text' && textContent && (
              <button
                onClick={handleCopyText}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-medium rounded-lg border border-stone-200 dark:border-stone-700/60 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-hidden"
                title="Copy text content to clipboard"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
              </button>
            )}

            {onShare && (
              <button
                onClick={() => onShare(file)}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-medium rounded-lg border border-stone-200 dark:border-stone-700/60 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-hidden"
                title="Share link"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Share</span>
              </button>
            )}

            <button
              onClick={() => onDownload(file)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer shadow-2xs focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-hidden"
              title="Download file to device"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>

            {onDelete && (
              <button
                onClick={() => onDelete(file)}
                className="p-1.5 text-stone-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-stone-200/60 dark:hover:bg-stone-800 rounded-md transition-colors cursor-pointer ml-1 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:outline-hidden"
                title="Delete file"
                aria-label="Delete file"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200/60 dark:hover:bg-stone-800 rounded-md transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-hidden"
              title="Close viewer (Esc)"
              aria-label="Close viewer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Viewer Content Area with Nav Chevrons */}
        <div className="flex-1 overflow-auto bg-stone-100 dark:bg-stone-950 flex items-center justify-center p-3 sm:p-6 min-h-[420px] relative group">
          {/* Previous File Button */}
          {hasPrev && (
            <button
              onClick={handlePrev}
              className="absolute left-2 sm:left-4 z-20 p-2 sm:p-2.5 rounded-full bg-white/90 dark:bg-stone-900/90 hover:bg-white dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 shadow-md border border-stone-200 dark:border-stone-700 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-hidden"
              title="Previous file (Left Arrow)"
              aria-label="Previous file"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          {/* Next File Button */}
          {hasNext && (
            <button
              onClick={handleNext}
              className="absolute right-2 sm:right-4 z-20 p-2 sm:p-2.5 rounded-full bg-white/90 dark:bg-stone-900/90 hover:bg-white dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 shadow-md border border-stone-200 dark:border-stone-700 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-hidden"
              title="Next file (Right Arrow)"
              aria-label="Next file"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
          {/* 1. Image Viewer */}
          {viewerType === 'image' && (
            <div className="relative max-h-[70vh] max-w-full flex items-center justify-center">
              {mediaLoading && !mediaError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-stone-400 text-xs">
                  <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                  <span>Loading image from Telegram...</span>
                </div>
              )}
              {mediaError ? (
                <div className="text-center p-6 space-y-3">
                  <AlertCircle className="w-10 h-10 mx-auto text-amber-500" />
                  <div className="text-sm font-medium text-stone-800 dark:text-stone-200">Could not render image preview</div>
                  <div className="text-xs text-stone-500 max-w-xs mx-auto">
                    The image may use an unsupported format or was not accessible directly.
                  </div>
                  <button
                    onClick={() => onDownload(file)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download to View</span>
                  </button>
                </div>
              ) : (
                <img
                  src={streamUrl}
                  alt={file.name}
                  onLoad={() => setMediaLoading(false)}
                  onError={() => {
                    setMediaLoading(false);
                    setMediaError(true);
                  }}
                  className={`max-h-[70vh] max-w-full object-contain rounded-lg shadow-md transition-opacity duration-200 ${
                    mediaLoading ? 'opacity-0' : 'opacity-100'
                  }`}
                />
              )}
            </div>
          )}

          {/* 2. Video Player */}
          {viewerType === 'video' && (
            <div className="w-full max-w-3xl flex flex-col items-center">
              {mediaLoading && !mediaError && (
                <div className="h-64 flex flex-col items-center justify-center gap-2 text-stone-400 text-xs">
                  <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                  <span>Buffering video stream...</span>
                </div>
              )}
              <video
                controls
                autoPlay
                onLoadedData={() => setMediaLoading(false)}
                onError={() => {
                  setMediaLoading(false);
                  setMediaError(true);
                }}
                className={`max-h-[70vh] max-w-full rounded-lg shadow-lg ${mediaLoading ? 'hidden' : 'block'}`}
                src={streamUrl}
              >
                Your browser does not support HTML5 video playback.
              </video>
              {mediaError && (
                <div className="text-center p-6 space-y-3">
                  <AlertCircle className="w-10 h-10 mx-auto text-amber-500" />
                  <div className="text-sm font-medium text-stone-800 dark:text-stone-200">Video playback unavailable</div>
                  <div className="text-xs text-stone-500 max-w-xs mx-auto">
                    Your browser could not play this video format. Download to play with a media player like VLC.
                  </div>
                  <button
                    onClick={() => onDownload(file)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Video</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 3. Audio Player */}
          {viewerType === 'audio' && (
            <div className="w-full max-w-md p-6 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 text-center space-y-4 shadow-sm">
              <div className="p-4 rounded-full bg-stone-100 dark:bg-stone-800 inline-block">
                <FileCode className="w-8 h-8 text-indigo-500" />
              </div>
              <div className="text-sm font-medium text-stone-900 dark:text-stone-100 truncate">{file.name}</div>
              <div className="text-xs text-stone-500">{formatBytes(file.size)}</div>
              <audio controls className="w-full mt-2" src={streamUrl}>
                Your browser does not support HTML5 audio playback.
              </audio>
            </div>
          )}

          {/* 4. PDF Viewer */}
          {viewerType === 'pdf' && (
            <div className="w-full h-[70vh] flex flex-col bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-sm">
              <iframe
                src={streamUrl}
                title={file.name}
                className="w-full h-full border-0"
              />
            </div>
          )}

          {/* 5. Text & Source Code Viewer */}
          {viewerType === 'text' && (
            <div className="w-full h-full max-h-[70vh] flex flex-col bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden">
              <div className="px-4 py-2 border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/60 flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
                <div className="flex items-center gap-1.5 font-mono">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Text / Source Document</span>
                </div>
                <span>UTF-8</span>
              </div>
              <div className="flex-1 overflow-auto p-4 flex font-mono text-xs">
                {isLoadingText ? (
                  <div className="h-48 w-full flex flex-col items-center justify-center gap-2 text-xs text-stone-400">
                    <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
                    <span>Loading document text...</span>
                  </div>
                ) : (
                  <div className="flex w-full">
                    {/* Line Numbers */}
                    {textLines.length > 0 && (
                      <div className="select-none text-stone-400 dark:text-stone-600 text-right pr-4 border-r border-stone-200 dark:border-stone-800 space-y-0.5 leading-relaxed shrink-0">
                        {textLines.map((_, i) => (
                          <div key={i}>{i + 1}</div>
                        ))}
                      </div>
                    )}
                    {/* Text Body */}
                    <pre className="pl-4 whitespace-pre-wrap break-words leading-relaxed select-text text-stone-800 dark:text-stone-200 flex-1">
                      {textContent || ''}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 6. Generic File Overview (Archives, Binaries, Apps) */}
          {viewerType === 'generic' && (
            <div className="w-full max-w-md p-8 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 text-center space-y-4 shadow-sm">
              <div className="p-4 rounded-2xl bg-stone-100 dark:bg-stone-800 inline-block shadow-2xs">
                {getGenericFileIcon(file.name, file.mime_type)}
              </div>
              <div>
                <div className="text-base font-semibold text-stone-900 dark:text-stone-100 truncate" title={file.name}>
                  {file.name}
                </div>
                <div className="text-xs text-stone-500 dark:text-stone-400 mt-1 flex items-center justify-center gap-2">
                  <span>{formatBytes(file.size)}</span>
                  <span>•</span>
                  <span>{file.mime_type}</span>
                </div>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 max-w-xs mx-auto leading-relaxed">
                Direct in-browser preview is not supported for this file format. You can download the file to inspect or execute it on your device.
              </p>
              <div className="pt-2 flex items-center justify-center gap-3">
                <button
                  onClick={() => onDownload(file)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-xl transition-colors cursor-pointer shadow-xs"
                >
                  <Download className="w-4 h-4" />
                  <span>Download File</span>
                </button>
                {onShare && (
                  <button
                    onClick={() => onShare(file)}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-medium rounded-xl border border-stone-200 dark:border-stone-700/60 transition-colors cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Share</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

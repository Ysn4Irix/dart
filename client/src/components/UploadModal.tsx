import React, { useState, useRef, useEffect } from 'react';
import { X, UploadCloud, File as FileIcon, Loader2 } from 'lucide-react';
import { api, formatBytes } from '../api.js';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  folderId: string | null;
  onUploadComplete: () => void;
  initialFile?: File | null;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  folderId,
  onUploadComplete,
  initialFile,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialFile) {
        setSelectedFile(initialFile);
      } else {
        setSelectedFile(null);
      }
      setIsUploading(false);
      setProgress(0);
      setError(null);
    }
  }, [isOpen, initialFile]);

  useEffect(() => {
    if (!isOpen || isUploading) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isUploading, onClose]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setProgress(0);
    setError(null);

    try {
      await api.uploadFile(selectedFile, folderId, (percent) => {
        setProgress(percent);
      });
      setIsUploading(false);
      setSelectedFile(null);
      onUploadComplete();
      onClose();
    } catch (err: unknown) {
      setIsUploading(false);
      const e = err as Error;
      setError(e.message || 'Upload failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/70 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl w-full max-w-lg p-6 shadow-2xl space-y-4 transition-colors">
        <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
          <h3 className="font-semibold text-stone-900 dark:text-stone-100">Upload to Saved Messages</h3>
          <button
            onClick={onClose}
            disabled={isUploading}
            className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors p-1 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 text-xs bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-300 rounded-lg">
            {error}
          </div>
        )}

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
            selectedFile
              ? 'border-emerald-500/60 bg-emerald-50/70 dark:bg-emerald-950/10'
              : 'border-stone-300 dark:border-stone-800 hover:border-stone-400 dark:hover:border-stone-700 bg-stone-50 dark:bg-stone-950/40'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            disabled={isUploading}
          />

          {selectedFile ? (
            <div className="space-y-2">
              <FileIcon className="w-8 h-8 mx-auto text-emerald-500 dark:text-emerald-400" />
              <div className="font-medium text-stone-900 dark:text-stone-200 truncate max-w-xs mx-auto">
                {selectedFile.name}
              </div>
              <div className="text-xs text-stone-500 dark:text-stone-400">{formatBytes(selectedFile.size)}</div>
            </div>
          ) : (
            <div className="space-y-2">
              <UploadCloud className="w-10 h-10 mx-auto text-stone-400 dark:text-stone-500" />
              <div className="text-sm font-medium text-stone-800 dark:text-stone-300">
                Click to browse or drag file here
              </div>
              <div className="text-xs text-stone-500">Supports files up to 2GB (or 4GB Premium)</div>
            </div>
          )}
        </div>

        {isUploading && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-stone-600 dark:text-stone-400">
              <span>Uploading to Telegram...</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-stone-200 dark:bg-stone-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            disabled={isUploading}
            className="px-4 py-2 text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            {isUploading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{isUploading ? 'Uploading...' : 'Start Upload'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

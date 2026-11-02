import React from 'react';
import { Trash2, FolderInput, X, Archive, AlertTriangle } from 'lucide-react';
import { formatBytes } from '../api.js';

interface BulkActionBarProps {
  selectedCount: number;
  totalSize: number;
  onDownloadZip: () => void;
  onMove: () => void;
  onDelete: () => void;
  onClearSelection: () => void;
  isProcessing?: boolean;
}

export const BulkActionBar: React.FC<BulkActionBarProps> = ({
  selectedCount,
  totalSize,
  onDownloadZip,
  onMove,
  onDelete,
  onClearSelection,
  isProcessing = false,
}) => {
  if (selectedCount === 0) return null;

  const MAX_ZIP_BYTES = 1024 * 1024 * 1024; // 1 GB
  const isOverZipLimit = totalSize > MAX_ZIP_BYTES;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-xl w-[calc(100%-2rem)] sm:w-auto transition-transform duration-200 ease-out">
      <div className="bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border border-stone-300 dark:border-stone-700 shadow-2xl rounded-2xl px-4 py-2.5 sm:px-5 sm:py-3 flex flex-wrap sm:flex-nowrap items-center justify-between sm:justify-start gap-3 sm:gap-4 transition-all">
        {/* Selected count & Total size info (plain text, no decorative pills) */}
        <div className="flex items-center gap-2.5 text-xs text-stone-700 dark:text-stone-300">
          <span className="font-semibold text-stone-900 dark:text-stone-100">
            {selectedCount} {selectedCount === 1 ? 'file' : 'files'}
          </span>
          <span className="text-stone-300 dark:text-stone-600">•</span>
          <span className="text-stone-600 dark:text-stone-400 font-mono">
            {formatBytes(totalSize)}
          </span>
          {isOverZipLimit && (
            <span
              className="flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 ml-1"
              title="Exceeds 1 GB ZIP limit"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span className="hidden md:inline">&gt; 1 GB ZIP cap</span>
            </span>
          )}
        </div>

        <div className="hidden sm:block h-4 w-px bg-stone-200 dark:bg-stone-700" />

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Download ZIP */}
          <button
            onClick={onDownloadZip}
            disabled={isProcessing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-300/60 dark:border-emerald-800/60 rounded-lg transition-colors cursor-pointer shadow-2xs disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-hidden"
            title={
              isOverZipLimit
                ? 'Selected files exceed 1 GB maximum ZIP bundle limit'
                : 'Download all selected files as a ZIP archive'
            }
          >
            <Archive className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Download ZIP</span>
          </button>

          {/* Move to Folder */}
          <button
            onClick={onMove}
            disabled={isProcessing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-700 dark:text-stone-200 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700/60 rounded-lg transition-colors cursor-pointer shadow-2xs disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-hidden"
            title="Move selected files to a folder"
          >
            <FolderInput className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
            <span>Move</span>
          </button>

          {/* Delete Permanently */}
          <button
            onClick={onDelete}
            disabled={isProcessing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/40 border border-red-200 dark:border-red-900/60 rounded-lg transition-colors cursor-pointer shadow-2xs disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:outline-hidden"
            title="Permanently delete selected files"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>

          {/* Clear Selection */}
          <button
            onClick={onClearSelection}
            disabled={isProcessing}
            className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors cursor-pointer ml-1 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-hidden"
            title="Deselect all (Esc)"
            aria-label="Deselect all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

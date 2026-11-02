import React, { useState, useEffect } from 'react';
import { Folder as FolderIcon, X, Plus, FolderInput, HardDrive, Check, Loader2 } from 'lucide-react';
import { Folder } from '../types.js';
import { useDialog } from '../context/DialogContext.js';
import { useToast } from '../context/ToastContext.js';
import { api } from '../api.js';

interface MoveFilesModalProps {
  isOpen: boolean;
  onClose: () => void;
  folders: Folder[];
  currentFolderId: string | null;
  fileCount: number;
  onConfirmMove: (targetFolderId: string | null) => Promise<void>;
  onFolderCreated?: () => void;
}

export const MoveFilesModal: React.FC<MoveFilesModalProps> = ({
  isOpen,
  onClose,
  folders,
  currentFolderId,
  fileCount,
  onConfirmMove,
  onFolderCreated,
}) => {
  const dialog = useDialog();
  const toast = useToast();
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  // Set initial selected folder to root if currently inside a folder, or first folder
  useEffect(() => {
    if (isOpen) {
      setSelectedFolderId(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCreateNewFolder = async () => {
    const name = await dialog.prompt({
      title: 'New Destination Folder',
      message: 'Enter a name for the new folder:',
      placeholder: 'e.g. Archives, Photos, Invoices',
      confirmText: 'Create & Select',
      validate: (val) => (!val.trim() ? 'Folder name cannot be empty' : null),
    });

    if (name && name.trim()) {
      setIsCreatingFolder(true);
      try {
        const newFolder = await api.createFolder(name.trim(), null);
        if (onFolderCreated) onFolderCreated();
        setSelectedFolderId(newFolder.id);
        toast.success('Folder Created', `Created folder "${newFolder.name}" and selected as target`);
      } catch (err: unknown) {
        const error = err as Error;
        toast.error('Folder Creation Failed', error.message || 'Could not create folder');
      } finally {
        setIsCreatingFolder(false);
      }
    }
  };

  const handleMove = async () => {
    setIsSubmitting(true);
    try {
      await onConfirmMove(selectedFolderId);
      onClose();
    } catch {
      // handled by caller
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-xs transition-opacity"
      role="dialog"
      aria-modal="true"
      aria-labelledby="move-modal-title"
    >
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden transition-colors flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50/70 dark:bg-stone-900/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 text-emerald-600 dark:text-emerald-400">
              <FolderInput className="w-4 h-4" />
            </div>
            <div>
              <h3 id="move-modal-title" className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                Move {fileCount} {fileCount === 1 ? 'file' : 'files'}
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">Choose a destination folder</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-hidden"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Toolbar inside Modal: "+ New Folder" */}
        <div className="px-6 py-2.5 border-b border-stone-200 dark:border-stone-800/80 bg-white dark:bg-stone-900 flex items-center justify-between">
          <span className="text-xs text-stone-500 dark:text-stone-400">Destinations</span>
          <button
            onClick={handleCreateNewFolder}
            disabled={isCreatingFolder}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-hidden"
          >
            {isCreatingFolder ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Plus className="w-3.5 h-3.5" />
            )}
            <span>New Folder</span>
          </button>
        </div>

        {/* Folder List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1.5 min-h-[220px]">
          {/* Option: Root Drive */}
          <button
            type="button"
            onClick={() => setSelectedFolderId(null)}
            className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-hidden ${
              selectedFolderId === null
                ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-500/50 dark:border-emerald-500/40 text-stone-900 dark:text-stone-100 shadow-2xs'
                : 'bg-white dark:bg-stone-800/40 border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800/70'
            }`}
          >
            <div className="flex items-center gap-3">
              <HardDrive className={`w-4 h-4 ${selectedFolderId === null ? 'text-emerald-600 dark:text-emerald-400' : 'text-stone-400'}`} />
              <div>
                <div className="text-xs font-medium">Root Drive (All Files)</div>
                {currentFolderId === null && (
                  <div className="text-[11px] text-stone-500 dark:text-stone-400">Current location</div>
                )}
              </div>
            </div>
            {selectedFolderId === null && (
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            )}
          </button>

          {/* User Folders */}
          {folders.map((folder) => {
            const isSelected = selectedFolderId === folder.id;
            const isCurrent = currentFolderId === folder.id;

            return (
              <button
                key={folder.id}
                type="button"
                onClick={() => setSelectedFolderId(folder.id)}
                className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-hidden ${
                  isSelected
                    ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-500/50 dark:border-emerald-500/40 text-stone-900 dark:text-stone-100 shadow-2xs'
                    : 'bg-white dark:bg-stone-800/40 border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800/70'
                }`}
              >
                <div className="flex items-center gap-3 truncate mr-2">
                  <FolderIcon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500 dark:text-amber-400'}`} />
                  <div className="truncate">
                    <div className="text-xs font-medium truncate">{folder.name}</div>
                    {isCurrent && (
                      <div className="text-[11px] text-stone-500 dark:text-stone-400">Current location</div>
                    )}
                  </div>
                </div>
                {isSelected && (
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-900/60 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/60 dark:hover:bg-stone-800 rounded-lg transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-hidden"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleMove}
            disabled={isSubmitting || selectedFolderId === currentFolderId}
            className="flex items-center gap-2 px-4 py-2 text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-hidden"
          >
            {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{isSubmitting ? 'Moving...' : 'Move Here'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

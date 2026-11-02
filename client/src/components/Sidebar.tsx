import React from 'react';
import { Folder as FolderIcon, HardDrive, Trash2, FolderPlus, Clock, X } from 'lucide-react';
import { Folder } from '../types.js';
import { formatBytes } from '../api.js';

interface SidebarProps {
  folders: Folder[];
  currentFolderId: string | null;
  onSelectFolder: (id: string | null) => void;
  onDeleteFolder: (id: string, name?: string) => void;
  onNewFolder: () => void;
  totalFilesCount: number;
  totalSize: number;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  folders,
  currentFolderId,
  onSelectFolder,
  onDeleteFolder,
  onNewFolder,
  totalFilesCount,
  totalSize,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const handleSelectFolder = (id: string | null) => {
    onSelectFolder(id);
    onCloseMobile?.();
  };

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-xs md:hidden transition-opacity"
          aria-label="Close navigation drawer"
          role="button"
          tabIndex={0}
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-72 md:w-64 border-r border-stone-200 dark:border-stone-800 flex flex-col justify-between bg-white dark:bg-stone-900 md:bg-stone-50/80 md:dark:bg-stone-900/50 p-4 shrink-0 transition-transform md:translate-x-0 duration-200 ease-in-out ${
          isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        <div className="space-y-6">
          {/* Mobile Drawer Header */}
          <div className="flex md:hidden items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
            <span className="text-sm font-semibold text-stone-900 dark:text-stone-100">Storage & Folders</span>
            <button
              onClick={onCloseMobile}
              className="p-1.5 text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
              aria-label="Close drawer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-2 px-2">
              Storage
            </div>
            <nav className="space-y-1">
              <button
                onClick={() => handleSelectFolder(null)}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-hidden ${
                  currentFolderId === null
                    ? 'bg-stone-200/80 dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-medium'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 hover:bg-stone-200/50 dark:hover:bg-stone-800/40'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <HardDrive className="w-4 h-4 text-emerald-500" />
                  <span>All Files</span>
                </div>
                <span className="text-xs text-stone-500 dark:text-stone-400">{totalFilesCount}</span>
              </button>
              <button
                onClick={() => handleSelectFolder('__recent__')}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-hidden ${
                  currentFolderId === '__recent__'
                    ? 'bg-stone-200/80 dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-medium'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 hover:bg-stone-200/50 dark:hover:bg-stone-800/40'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  <span>Recent Files</span>
                </div>
              </button>
            </nav>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-2 px-2">
              <span>Folders</span>
              <button
                onClick={onNewFolder}
                className="text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 transition-colors cursor-pointer p-0.5 rounded focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-hidden"
                title="Create folder"
                aria-label="Create new folder"
              >
                <FolderPlus className="w-3.5 h-3.5" />
              </button>
            </div>

            <nav className="space-y-1 max-h-60 overflow-y-auto">
              {folders.length === 0 ? (
                <div className="text-xs text-stone-500 dark:text-stone-400 px-3 py-1.5 italic">No folders yet</div>
              ) : (
                folders.map((folder) => (
                  <div
                    key={folder.id}
                    className={`group flex items-center justify-between px-3 py-1.5 text-sm rounded-lg transition-colors cursor-pointer ${
                      currentFolderId === folder.id
                        ? 'bg-stone-200/80 dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-medium'
                        : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 hover:bg-stone-200/50 dark:hover:bg-stone-800/40'
                    }`}
                  >
                    <button
                      onClick={() => handleSelectFolder(folder.id)}
                      className="flex items-center gap-2.5 flex-1 text-left truncate cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-hidden rounded"
                    >
                      <FolderIcon className="w-4 h-4 text-stone-400 dark:text-stone-400 group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors shrink-0" />
                      <span className="truncate">{folder.name}</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteFolder(folder.id, folder.name);
                      }}
                      className="opacity-70 md:opacity-0 md:group-hover:opacity-100 p-1 text-stone-400 hover:text-red-500 dark:text-stone-400 dark:hover:text-red-400 transition-opacity cursor-pointer rounded focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:outline-hidden"
                      title="Delete folder"
                      aria-label={`Delete folder ${folder.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </nav>
          </div>
        </div>

        <div className="pt-4 border-t border-stone-200 dark:border-stone-800/80">
          <div className="px-2">
            <div className="text-xs text-stone-500 dark:text-stone-400 mb-1">Telegram Cloud Storage</div>
            <div className="text-sm font-medium text-stone-800 dark:text-stone-200">{formatBytes(totalSize)} stored</div>
            <div className="text-xs text-stone-500 dark:text-stone-400 mt-1">Unlimited space via Saved Messages</div>
          </div>
        </div>
      </aside>
    </>
  );
};

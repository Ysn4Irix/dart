import React from 'react';
import { Folder as FolderIcon, HardDrive, Trash2, FolderPlus, Clock } from 'lucide-react';
import { Folder } from '../types.js';
import { formatBytes } from '../api.js';

interface SidebarProps {
  folders: Folder[];
  currentFolderId: string | null;
  onSelectFolder: (id: string | null) => void;
  onDeleteFolder: (id: string) => void;
  onNewFolder: () => void;
  totalFilesCount: number;
  totalSize: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  folders,
  currentFolderId,
  onSelectFolder,
  onDeleteFolder,
  onNewFolder,
  totalFilesCount,
  totalSize,
}) => {
  return (
    <aside className="w-64 border-r border-stone-800 flex flex-col justify-between bg-stone-900/50 p-4 shrink-0">
      <div className="space-y-6">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2 px-2">
            Storage
          </div>
          <nav className="space-y-1">
            <button
              onClick={() => onSelectFolder(null)}
              className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors cursor-pointer ${
                currentFolderId === null
                  ? 'bg-stone-800 text-stone-100 font-medium'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/40'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <HardDrive className="w-4 h-4 text-emerald-500" />
                <span>All Files</span>
              </div>
              <span className="text-xs text-stone-500">{totalFilesCount}</span>
            </button>
            <button
              onClick={() => onSelectFolder('__recent__')}
              className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors cursor-pointer ${
                currentFolderId === '__recent__'
                  ? 'bg-stone-800 text-stone-100 font-medium'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/40'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-teal-400" />
                <span>Recent Files</span>
              </div>
            </button>
          </nav>
        </div>

        <div>
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2 px-2">
            <span>Folders</span>
            <button
              onClick={onNewFolder}
              className="text-stone-400 hover:text-stone-200 transition-colors cursor-pointer p-0.5"
              title="Create folder"
            >
              <FolderPlus className="w-3.5 h-3.5" />
            </button>
          </div>

          <nav className="space-y-1 max-h-60 overflow-y-auto">
            {folders.length === 0 ? (
              <div className="text-xs text-stone-500 px-3 py-1.5 italic">No folders yet</div>
            ) : (
              folders.map((folder) => (
                <div
                  key={folder.id}
                  className={`group flex items-center justify-between px-3 py-1.5 text-sm rounded-lg transition-colors cursor-pointer ${
                    currentFolderId === folder.id
                      ? 'bg-stone-800 text-stone-100 font-medium'
                      : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/40'
                  }`}
                >
                  <button
                    onClick={() => onSelectFolder(folder.id)}
                    className="flex items-center gap-2.5 flex-1 text-left truncate cursor-pointer"
                  >
                    <FolderIcon className="w-4 h-4 text-stone-400 group-hover:text-amber-400 transition-colors shrink-0" />
                    <span className="truncate">{folder.name}</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete folder "${folder.name}"?`)) {
                        onDeleteFolder(folder.id);
                      }
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-stone-500 hover:text-red-400 transition-opacity cursor-pointer"
                    title="Delete folder"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </nav>
        </div>
      </div>

      <div className="pt-4 border-t border-stone-800/80">
        <div className="px-2">
          <div className="text-xs text-stone-400 mb-1">Telegram Cloud Storage</div>
          <div className="text-sm font-medium text-stone-200">{formatBytes(totalSize)} stored</div>
          <div className="text-xs text-stone-500 mt-1">Unlimited space via Saved Messages</div>
        </div>
      </div>
    </aside>
  );
};

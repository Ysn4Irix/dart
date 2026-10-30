import React from 'react';
import { Search, UploadCloud, FolderPlus } from 'lucide-react';
import { AuthStatus } from '../types.js';
import { DartLogo } from './DartLogo.js';

interface HeaderProps {
  search: string;
  onSearchChange: (value: string) => void;
  onOpenUpload: () => void;
  onOpenNewFolder: () => void;
  onOpenAuth: () => void;
  authStatus: AuthStatus | null;
}

export const Header: React.FC<HeaderProps> = ({
  search,
  onSearchChange,
  onOpenUpload,
  onOpenNewFolder,
  onOpenAuth,
  authStatus,
}) => {
  return (
    <header className="h-16 border-b border-stone-800 px-6 flex items-center justify-between bg-stone-900/80 backdrop-blur sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <div className="p-1 rounded-lg bg-stone-800/80 border border-stone-700/60">
          <DartLogo size={22} />
        </div>
        <span className="font-semibold text-stone-100 text-lg tracking-tight">Dart</span>
        <span className="text-xs text-stone-400 border-l border-stone-700 pl-3">Telegram File Storage</span>
      </div>

      <div className="flex-1 max-w-md mx-8">
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search files in Saved Messages..."
            className="w-full bg-stone-800/80 border border-stone-700/60 rounded-lg pl-9 pr-4 py-1.5 text-sm text-stone-200 placeholder-stone-500 focus:outline-none focus:border-stone-500 focus:ring-1 focus:ring-stone-500 transition-colors"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onOpenNewFolder}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-stone-300 hover:text-stone-100 hover:bg-stone-800 rounded-lg border border-stone-700/60 transition-colors cursor-pointer"
        >
          <FolderPlus className="w-4 h-4" />
          <span>New Folder</span>
        </button>

        <button
          onClick={onOpenUpload}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors cursor-pointer"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload</span>
        </button>

        <button
          onClick={onOpenAuth}
          className="flex items-center gap-2 pl-3 border-l border-stone-800 text-xs text-stone-400 hover:text-stone-200 cursor-pointer"
        >
          <span
            className={`w-2 h-2 rounded-full ${
              authStatus?.authorized ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
            }`}
          />
          <span>{authStatus?.authorized ? 'Telegram Connected' : 'Connect Telegram'}</span>
        </button>
      </div>
    </header>
  );
};

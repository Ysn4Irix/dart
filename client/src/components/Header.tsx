import React from 'react';
import { Search, UploadCloud, FolderPlus, RefreshCw, Sun, Moon, LogOut } from 'lucide-react';
import { AppUser, AuthStatus, Theme } from '../types.js';
import { DartLogo } from './DartLogo.js';

interface HeaderProps {
  search: string;
  onSearchChange: (value: string) => void;
  onOpenUpload: () => void;
  onOpenNewFolder: () => void;
  onOpenAuth: () => void;
  onSync: () => void;
  isSyncing: boolean;
  authStatus: AuthStatus | null;
  theme: Theme;
  onToggleTheme: () => void;
  currentUser?: AppUser | null;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  search,
  onSearchChange,
  onOpenUpload,
  onOpenNewFolder,
  onOpenAuth,
  onSync,
  isSyncing,
  authStatus,
  theme,
  onToggleTheme,
  currentUser,
  onLogout,
}) => {
  return (
    <header className="h-16 border-b border-stone-200 dark:border-stone-800 px-6 flex items-center justify-between bg-white/80 dark:bg-stone-900/80 backdrop-blur sticky top-0 z-10 transition-colors">
      <div className="flex items-center gap-3">
        <div className="p-1 rounded-lg bg-stone-100 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700/60">
          <DartLogo size={22} />
        </div>
        <span className="font-semibold text-stone-900 dark:text-stone-100 text-lg tracking-tight">Dart</span>
        <span className="text-xs text-stone-500 dark:text-stone-400 border-l border-stone-200 dark:border-stone-700 pl-3">Telegram File Storage</span>
      </div>

      <div className="flex-1 max-w-md mx-8">
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search files in Saved Messages..."
            className="w-full bg-stone-100 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700/60 rounded-lg pl-9 pr-4 py-1.5 text-sm text-stone-900 dark:text-stone-200 placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none focus:border-emerald-500 dark:focus:border-stone-500 focus:ring-1 focus:ring-emerald-500 dark:focus:ring-stone-500 transition-colors"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onSync}
          disabled={isSyncing || !authStatus?.authorized}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-50 rounded-lg border border-stone-200 dark:border-stone-700/60 transition-colors cursor-pointer"
          title="Scan and import all files from Telegram Saved Messages"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-emerald-500 dark:text-emerald-400' : ''}`} />
          <span>{isSyncing ? 'Syncing...' : 'Sync Messages'}</span>
        </button>

        <button
          onClick={onOpenNewFolder}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700/60 transition-colors cursor-pointer"
        >
          <FolderPlus className="w-4 h-4" />
          <span>New Folder</span>
        </button>

        <button
          onClick={onOpenUpload}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors cursor-pointer shadow-xs"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload</span>
        </button>

        {/* Theme toggle (Light / Dark) */}
        <button
          onClick={onToggleTheme}
          className="p-1.5 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700/60 transition-colors cursor-pointer"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label="Toggle color theme"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-stone-600" />
          )}
        </button>

        <button
          onClick={onOpenAuth}
          className="flex items-center gap-2 pl-3 border-l border-stone-200 dark:border-stone-800 text-xs text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 cursor-pointer"
        >
          <span
            className={`w-2 h-2 rounded-full ${
              authStatus?.authorized ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
            }`}
          />
          <span>{authStatus?.authorized ? 'Connected' : 'Connect Telegram'}</span>
        </button>

        {currentUser && onLogout && (
          <div className="flex items-center gap-2.5 pl-3 border-l border-stone-200 dark:border-stone-800 text-xs">
            <span className="text-stone-600 dark:text-stone-400 font-medium">
              {currentUser.username}
            </span>
            <button
              onClick={onLogout}
              className="p-1.5 text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 rounded transition-colors cursor-pointer"
              title="Sign out of master account"
              aria-label="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

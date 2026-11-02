import React from 'react';
import { Search, UploadCloud, FolderPlus, RefreshCw, Sun, Moon, LogOut, Menu, X } from 'lucide-react';
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
  onToggleMobileSidebar?: () => void;
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
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
  onToggleMobileSidebar,
  searchInputRef,
}) => {
  return (
    <header className="h-16 border-b border-stone-200 dark:border-stone-800 px-3 sm:px-6 flex items-center justify-between bg-white/80 dark:bg-stone-900/80 backdrop-blur sticky top-0 z-20 transition-colors">
      <div className="flex items-center gap-2 sm:gap-3">
        {onToggleMobileSidebar && (
          <button
            onClick={onToggleMobileSidebar}
            className="md:hidden p-2 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-hidden"
            title="Toggle sidebar folders"
            aria-label="Toggle navigation drawer"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="p-1 rounded-lg bg-stone-100 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700/60 shrink-0">
          <DartLogo size={22} />
        </div>
        <span className="font-semibold text-stone-900 dark:text-stone-100 text-lg tracking-tight">Dart</span>
        <span className="hidden xl:inline text-xs text-stone-500 dark:text-stone-400 border-l border-stone-200 dark:border-stone-700 pl-3">
          Telegram File Storage
        </span>
      </div>

      <div className="flex-1 max-w-xs sm:max-w-md mx-2 sm:mx-6">
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search files..."
            className="w-full bg-stone-100 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700/60 rounded-lg pl-9 pr-8 sm:pr-14 py-1.5 text-sm text-stone-900 dark:text-stone-200 placeholder-stone-400 dark:placeholder-stone-500 focus:outline-hidden focus:border-emerald-500 dark:focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
          />
          {search ? (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors cursor-pointer"
              title="Clear search"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-block pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-stone-400 dark:text-stone-500 bg-stone-200/50 dark:bg-stone-700/50 border border-stone-300 dark:border-stone-600 rounded px-1.5 py-0.5">
              ⌘K
            </kbd>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2.5">
        <button
          onClick={onSync}
          disabled={isSyncing || !authStatus?.authorized}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-sm text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-50 rounded-lg border border-stone-200 dark:border-stone-700/60 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-hidden"
          title="Scan and import all files from Telegram Saved Messages"
          aria-label="Sync files with Telegram"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-emerald-500 dark:text-emerald-400' : ''}`} />
          <span className="hidden lg:inline">{isSyncing ? 'Syncing...' : 'Sync Messages'}</span>
        </button>

        <button
          onClick={onOpenNewFolder}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-sm text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700/60 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-hidden"
          title="Create a new folder"
          aria-label="New folder"
        >
          <FolderPlus className="w-4 h-4" />
          <span className="hidden md:inline">New Folder</span>
        </button>

        <button
          onClick={onOpenUpload}
          className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors cursor-pointer shadow-xs focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:outline-hidden"
          title="Upload file to Saved Messages"
          aria-label="Upload file"
        >
          <UploadCloud className="w-4 h-4" />
          <span className="hidden sm:inline">Upload</span>
        </button>

        {/* Theme toggle (Light / Dark) */}
        <button
          onClick={onToggleTheme}
          className="p-1.5 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700/60 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-hidden"
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
          className="flex items-center gap-1.5 sm:gap-2 pl-2 sm:pl-3 border-l border-stone-200 dark:border-stone-800 text-xs text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-hidden"
          title="Telegram connection status"
          aria-label="Telegram connection settings"
        >
          <span
            className={`w-2 h-2 rounded-full ${
              authStatus?.authorized ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
            }`}
          />
          <span className="hidden md:inline">{authStatus?.authorized ? 'Connected' : 'Connect Telegram'}</span>
        </button>

        {currentUser && onLogout && (
          <div className="flex items-center gap-1.5 sm:gap-2 pl-2 sm:pl-3 border-l border-stone-200 dark:border-stone-800 text-xs">
            <span className="hidden sm:inline text-stone-600 dark:text-stone-400 font-medium">
              {currentUser.username}
            </span>
            <button
              onClick={onLogout}
              className="p-1.5 text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 rounded transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-hidden"
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

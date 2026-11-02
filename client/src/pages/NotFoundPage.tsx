import React from 'react';
import { FileQuestion, ArrowLeft, Home, Sun, Moon } from 'lucide-react';
import { DartLogo } from '../components/DartLogo.js';
import { Theme } from '../types.js';

interface NotFoundPageProps {
  theme?: Theme;
  onToggleTheme?: () => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ theme = 'light', onToggleTheme }) => {
  const handleGoHome = () => {
    window.location.href = '/';
  };

  const handleGoBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '/';
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 p-6 sm:p-10 transition-colors">
      {/* Top Header */}
      <header className="w-full max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-stone-100 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700/60 shadow-xs">
            <DartLogo size={24} />
          </div>
          <span className="font-semibold text-stone-900 dark:text-stone-100 text-lg tracking-tight">
            Dart
          </span>
        </div>

        {onToggleTheme && (
          <button
            type="button"
            onClick={onToggleTheme}
            className="p-2 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700/60 transition-colors cursor-pointer"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-stone-600" />
            )}
          </button>
        )}
      </header>

      {/* Main 404 Container */}
      <main className="w-full max-w-md mx-auto my-auto py-8">
        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xl p-8 text-center transition-colors">
          <div className="w-14 h-14 rounded-2xl bg-stone-100 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 flex items-center justify-center mx-auto mb-5">
            <FileQuestion className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
          </div>

          <div className="text-xs font-semibold tracking-wider uppercase text-stone-400 dark:text-stone-500 mb-1">
            404 &bull; Page Not Found
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-50 mb-3">
            Lost in storage?
          </h1>

          <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed mb-8">
            The page or document you are looking for doesn't exist, has been removed, or has moved to another address.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleGoHome}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              <Home className="w-4 h-4" />
              <span>Dashboard</span>
            </button>
            <button
              type="button"
              onClick={handleGoBack}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-sm font-medium rounded-lg border border-stone-200 dark:border-stone-700 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Go Back</span>
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-4xl mx-auto text-center text-xs text-stone-500 dark:text-stone-400 py-4">
        Dart Cloud Storage &bull; Private Telegram MTProto Storage Engine
      </footer>
    </div>
  );
};

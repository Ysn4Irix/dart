import React, { useState } from 'react';
import { ShieldCheck, ArrowRight, Sun, Moon, AlertCircle, AlertTriangle, KeyRound, User } from 'lucide-react';
import { DartLogo } from './DartLogo.js';
import { api } from '../api.js';
import { AppUser, Theme } from '../types.js';

interface SetupScreenProps {
  onSetupSuccess: (user: AppUser) => void;
  onSwitchToLogin?: () => void;
  theme: Theme;
  onToggleTheme: () => void;
}

export const SetupScreen: React.FC<SetupScreenProps> = ({
  onSetupSuccess,
  onSwitchToLogin,
  theme,
  onToggleTheme,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanUsername = username.trim();
    if (!cleanUsername) {
      setError('Please provide a master username');
      return;
    }

    if (cleanUsername.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(cleanUsername)) {
      setError('Username can only contain letters, numbers, hyphens, and underscores');
      return;
    }

    if (!password) {
      setError('Please provide a master password');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!acknowledged) {
      setError('You must acknowledge that this master account is unrecoverable and immutable');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.registerOwner(cleanUsername, password);
      onSetupSuccess(res.user);
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || 'Failed to create master account');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 transition-colors p-6 sm:p-10">
      {/* Top Header bar with Theme switch */}
      <header className="w-full max-w-5xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-stone-100 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700/60 shadow-xs">
            <DartLogo size={24} />
          </div>
          <div>
            <span className="font-semibold text-stone-900 dark:text-stone-100 text-lg tracking-tight">Dart</span>
            <span className="text-xs text-stone-500 dark:text-stone-400 border-l border-stone-200 dark:border-stone-800 ml-2.5 pl-2.5">
              Initial Setup
            </span>
          </div>
        </div>

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
      </header>

      {/* Main Card */}
      <main className="w-full max-w-md mx-auto my-auto py-8">
        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xl p-8 transition-colors">
          <div className="mb-8">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/70 flex items-center justify-center mb-5">
              <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-50">
              Create Master Account
            </h1>
            <p className="mt-2 text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
              This instance of Dart requires an owner account to safeguard your private cloud storage and files.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3.5 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 flex items-start gap-2.5 text-sm text-red-800 dark:text-red-300">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="setup-username"
                className="block text-xs font-medium uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5"
              >
                Owner Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="setup-username"
                  type="text"
                  autoComplete="username"
                  autoFocus
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full bg-stone-50 dark:bg-stone-800/80 border border-stone-300 dark:border-stone-700 rounded-lg pl-9 pr-4 py-2.5 text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                />
              </div>
              <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                Alphanumeric characters, underscores, and hyphens.
              </p>
            </div>

            <div>
              <label
                htmlFor="setup-password"
                className="block text-xs font-medium uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5"
              >
                Master Password
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="setup-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-stone-50 dark:bg-stone-800/80 border border-stone-300 dark:border-stone-700 rounded-lg pl-9 pr-4 py-2.5 text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                />
              </div>
              <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                Minimum 6 characters with secure native scrypt hashing.
              </p>
            </div>

            <div>
              <label
                htmlFor="setup-confirm-password"
                className="block text-xs font-medium uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5"
              >
                Confirm Password
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="setup-confirm-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-stone-50 dark:bg-stone-800/80 border border-stone-300 dark:border-stone-700 rounded-lg pl-9 pr-4 py-2.5 text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                />
              </div>
            </div>

            {/* Warning: Account is unrecoverable and immutable */}
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 dark:border-amber-500/20 flex items-start gap-3 text-xs leading-relaxed text-amber-900 dark:text-amber-200">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-semibold text-xs uppercase tracking-wider block text-amber-950 dark:text-amber-100">
                  Warning: Account is Unrecoverable & Immutable
                </span>
                <p className="text-amber-800/90 dark:text-amber-300/90">
                  This master account cannot be recovered, altered, or reset once created. If credentials are lost, there is no password reset mechanism, and access to this instance and files cannot be restored.
                </p>
              </div>
            </div>

            <div className="pt-1">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  required
                  checked={acknowledged}
                  onChange={(e) => setAcknowledged(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-stone-300 dark:border-stone-700 text-emerald-600 focus:ring-emerald-500 focus:ring-offset-0 bg-stone-50 dark:bg-stone-800 cursor-pointer"
                />
                <span className="text-xs text-stone-700 dark:text-stone-300 leading-normal">
                  I understand that this account is unrecoverable and immutable, and I have stored my credentials safely.
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading || !acknowledged}
              className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{isLoading ? 'Creating Master Account...' : 'Complete Setup & Enter Dart'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {onSwitchToLogin && (
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={onSwitchToLogin}
                  className="text-xs text-stone-600 dark:text-stone-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  Already have an account? <span className="underline font-medium">Sign in</span>
                </button>
              </div>
            )}
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-5xl mx-auto text-center text-xs text-stone-500 dark:text-stone-400 py-4">
        Dart Cloud Storage &bull; Private Telegram MTProto Storage Engine
      </footer>
    </div>
  );
};

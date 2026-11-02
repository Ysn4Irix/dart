import React, { useState } from 'react';
import { Lock, ArrowRight, Sun, Moon, AlertCircle, AlertTriangle, KeyRound, User, UserPlus } from 'lucide-react';
import { DartLogo } from './DartLogo.js';
import { api } from '../api.js';
import { AppUser, Theme } from '../types.js';

interface LoginScreenProps {
  onLoginSuccess: (user: AppUser) => void;
  initialMode?: 'login' | 'register';
  onSwitchToSetup?: () => void;
  theme: Theme;
  onToggleTheme: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  initialMode = 'login',
  onSwitchToSetup,
  theme,
  onToggleTheme,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
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
      setError('Please enter your username');
      return;
    }

    if (mode === 'register') {
      if (cleanUsername.length < 3) {
        setError('Username must be at least 3 characters');
        return;
      }

      if (!/^[a-zA-Z0-9_-]+$/.test(cleanUsername)) {
        setError('Username can only contain letters, numbers, hyphens, and underscores');
        return;
      }

      if (!password) {
        setError('Please enter a password');
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
        setError('You must acknowledge that this account is unrecoverable and immutable');
        return;
      }
    } else {
      if (!password) {
        setError('Please enter your password');
        return;
      }
    }

    setIsLoading(true);
    try {
      if (mode === 'register') {
        const res = await api.register(cleanUsername, password);
        onLoginSuccess(res.user);
      } else {
        const res = await api.login(cleanUsername, password);
        onLoginSuccess(res.user);
      }
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || (mode === 'register' ? 'Failed to create account' : 'Invalid username or password'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitchMode = (newMode: 'login' | 'register') => {
    setError(null);
    setMode(newMode);
    setPassword('');
    setConfirmPassword('');
    setAcknowledged(false);
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
              Secure Cloud
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
          <div className="mb-6">
            <div className="w-12 h-12 rounded-xl bg-stone-100 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 flex items-center justify-center mb-5">
              {mode === 'login' ? (
                <Lock className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <UserPlus className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              )}
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-50">
              {mode === 'login' ? 'Sign In to Dart' : 'Create an Account'}
            </h1>
            <p className="mt-2 text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
              {mode === 'login'
                ? 'Enter your account credentials to access your private files and storage.'
                : 'Create your personal account credentials to access and manage cloud storage.'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3.5 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 flex items-start gap-2.5 text-sm text-red-800 dark:text-red-300">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="login-username"
                className="block text-xs font-medium uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5"
              >
                Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="login-username"
                  type="text"
                  autoComplete="username"
                  autoFocus
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={mode === 'login' ? 'username' : 'choose a username'}
                  className="w-full bg-stone-50 dark:bg-stone-800/80 border border-stone-300 dark:border-stone-700 rounded-lg pl-9 pr-4 py-2.5 text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="block text-xs font-medium uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="login-password"
                  type="password"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'login' ? '••••••••••••' : 'at least 6 characters'}
                  className="w-full bg-stone-50 dark:bg-stone-800/80 border border-stone-300 dark:border-stone-700 rounded-lg pl-9 pr-4 py-2.5 text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                />
              </div>
            </div>

            {mode === 'register' && (
              <>
                <div>
                  <label
                    htmlFor="login-confirm-password"
                    className="block text-xs font-medium uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5"
                  >
                    Confirm Password
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="login-confirm-password"
                      type="password"
                      autoComplete="new-password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="re-enter your password"
                      className="w-full bg-stone-50 dark:bg-stone-800/80 border border-stone-300 dark:border-stone-700 rounded-lg pl-9 pr-4 py-2.5 text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-1 text-stone-700 dark:text-stone-300">
                    <span className="font-semibold text-amber-800 dark:text-amber-300 block">
                      Unrecoverable Credentials
                    </span>
                    <p className="text-stone-600 dark:text-stone-400 leading-normal">
                      This account cannot be recovered or reset if credentials are lost. Store your password securely.
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
                      I understand that this account is unrecoverable and immutable, and I have stored my password safely.
                    </span>
                  </label>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={isLoading || (mode === 'register' && !acknowledged)}
              className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>
                {isLoading
                  ? mode === 'register'
                    ? 'Creating Account...'
                    : 'Signing In...'
                  : mode === 'register'
                    ? 'Create Account & Enter Dart'
                    : 'Sign In to Dart'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="pt-3 border-t border-stone-100 dark:border-stone-800 text-center space-y-2">
              {mode === 'login' ? (
                <button
                  type="button"
                  onClick={() => handleSwitchMode('register')}
                  className="text-xs text-stone-600 dark:text-stone-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  Don't have an account? <span className="underline font-medium">Create an account</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSwitchMode('login')}
                  className="text-xs text-stone-600 dark:text-stone-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  Already have an account? <span className="underline font-medium">Sign in</span>
                </button>
              )}

              {onSwitchToSetup && (
                <div>
                  <button
                    type="button"
                    onClick={onSwitchToSetup}
                    className="text-xs text-stone-500 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 transition-colors cursor-pointer"
                  >
                    Need initial master setup? <span className="underline">Set up master account</span>
                  </button>
                </div>
              )}
            </div>
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

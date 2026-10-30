import React, { useState } from 'react';
import { X, Shield, Loader2, CheckCircle2 } from 'lucide-react';
import { api } from '../api.js';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthSuccess }) => {
  const [step, setStep] = useState<'credentials' | 'code' | 'success'>('credentials');
  const [apiId, setApiId] = useState('');
  const [apiHash, setApiHash] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneCodeHash, setPhoneCodeHash] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await api.sendLoginCode(Number(apiId), apiHash.trim(), phoneNumber.trim());
      setPhoneCodeHash(res.phoneCodeHash);
      setStep('code');
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || 'Failed to send verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await api.completeSignIn(
        phoneNumber.trim(),
        phoneCodeHash,
        code.trim(),
        password.trim() || undefined
      );
      setStep('success');
      setTimeout(() => {
        onAuthSuccess();
        onClose();
      }, 1500);
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || 'Verification failed. Check your code or 2FA password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/70 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl w-full max-w-md p-6 shadow-2xl space-y-4 transition-colors">
        <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
          <h3 className="font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            <span>Connect Telegram MTProto</span>
          </h3>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors p-1 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 text-xs bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-300 rounded-lg">
            {error}
          </div>
        )}

        {step === 'credentials' && (
          <form onSubmit={handleSendCode} className="space-y-4">
            <div className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
              To read and write directly to your Saved Messages, obtain your{' '}
              <a
                href="https://my.telegram.org"
                target="_blank"
                rel="noreferrer"
                className="text-emerald-600 dark:text-emerald-400 underline hover:text-emerald-500 dark:hover:text-emerald-300"
              >
                API ID and API Hash
              </a>{' '}
              from Telegram.
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-stone-600 dark:text-stone-400 mb-1">Telegram API ID</label>
                <input
                  type="number"
                  required
                  value={apiId}
                  onChange={(e) => setApiId(e.target.value)}
                  placeholder="e.g. 1234567"
                  className="w-full bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg px-3 py-2 text-sm text-stone-900 dark:text-stone-200 focus:outline-none focus:border-emerald-500 dark:focus:border-stone-500"
                />
              </div>

              <div>
                <label className="block text-xs text-stone-600 dark:text-stone-400 mb-1">Telegram API Hash</label>
                <input
                  type="text"
                  required
                  value={apiHash}
                  onChange={(e) => setApiHash(e.target.value)}
                  placeholder="e.g. 0123456789abcdef0123456789abcdef"
                  className="w-full bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg px-3 py-2 text-sm text-stone-900 dark:text-stone-200 focus:outline-none focus:border-emerald-500 dark:focus:border-stone-500 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-xs text-stone-600 dark:text-stone-400 mb-1">Phone Number (International)</label>
                <input
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="e.g. +1234567890"
                  className="w-full bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg px-3 py-2 text-sm text-stone-900 dark:text-stone-200 focus:outline-none focus:border-emerald-500 dark:focus:border-stone-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 text-sm font-medium bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{isLoading ? 'Connecting...' : 'Send Verification Code'}</span>
            </button>
          </form>
        )}

        {step === 'code' && (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div className="text-xs text-stone-600 dark:text-stone-400">
              Enter the code sent to your Telegram app for{' '}
              <span className="font-medium text-stone-900 dark:text-stone-200">{phoneNumber}</span>.
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-stone-600 dark:text-stone-400 mb-1">Verification Code</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. 12345"
                  className="w-full bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg px-3 py-2 text-sm text-stone-900 dark:text-stone-200 text-center tracking-widest font-mono text-lg focus:outline-none focus:border-emerald-500 dark:focus:border-stone-500"
                />
              </div>

              <div>
                <label className="block text-xs text-stone-600 dark:text-stone-400 mb-1">2FA Password (if enabled)</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Optional 2FA password"
                  className="w-full bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg px-3 py-2 text-sm text-stone-900 dark:text-stone-200 focus:outline-none focus:border-emerald-500 dark:focus:border-stone-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 text-sm font-medium bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{isLoading ? 'Verifying...' : 'Complete Sign In'}</span>
            </button>
          </form>
        )}

        {step === 'success' && (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500 dark:text-emerald-400 animate-bounce" />
            <div className="font-semibold text-stone-900 dark:text-stone-100">Telegram Connected!</div>
            <div className="text-xs text-stone-500 dark:text-stone-400">Saved Messages session initialized successfully.</div>
          </div>
        )}
      </div>
    </div>
  );
};

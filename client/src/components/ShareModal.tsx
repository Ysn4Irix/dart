import React, { useState } from 'react';
import { X, Copy, Check, ExternalLink } from 'lucide-react';
import { FileRecord } from '../types.js';
import { api } from '../api.js';
import { useDialog } from '../context/DialogContext.js';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: FileRecord | null;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, file }) => {
  const dialog = useDialog();
  const [copied, setCopied] = useState(false);
  const [expiresIn, setExpiresIn] = useState<number | undefined>(undefined);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen || !file) return null;

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const res = await api.createShare(file.id, expiresIn);
      const fullUrl = `${window.location.origin}/s/${res.share.id}`;
      setShareUrl(fullUrl);
    } catch (err) {
      dialog.alert({
        title: 'Share Error',
        message: 'Failed to generate public share link. Please try again.',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/70 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl w-full max-w-md p-6 shadow-2xl space-y-4 transition-colors">
        <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
          <h3 className="font-semibold text-stone-900 dark:text-stone-100">Share File</h3>
          <button
            onClick={() => {
              setShareUrl(null);
              onClose();
            }}
            className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors p-1 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <div className="text-xs text-stone-500 mb-1">Sharing target</div>
          <div className="font-medium text-stone-900 dark:text-stone-200 text-sm truncate">{file.name}</div>
        </div>

        {!shareUrl ? (
          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-xs text-stone-600 dark:text-stone-400 mb-2">Link Expiration</label>
              <select
                value={expiresIn || ''}
                onChange={(e) => setExpiresIn(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg px-3 py-2 text-sm text-stone-900 dark:text-stone-200 focus:outline-none focus:border-emerald-500 dark:focus:border-stone-500"
              >
                <option value="" className="bg-white dark:bg-stone-900">Never expires</option>
                <option value="24" className="bg-white dark:bg-stone-900">Expires in 24 hours</option>
                <option value="168" className="bg-white dark:bg-stone-900">Expires in 7 days</option>
                <option value="720" className="bg-white dark:bg-stone-900">Expires in 30 days</option>
              </select>
            </div>

            <button
              onClick={handleGenerate}
              disabled={isLoading}
              className="w-full py-2.5 text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              {isLoading ? 'Generating Link...' : 'Create Public Share Link'}
            </button>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-xs text-stone-600 dark:text-stone-400 mb-1.5">Public Download URL</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="flex-1 bg-stone-100 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg px-3 py-2 text-xs text-stone-800 dark:text-stone-300 font-mono select-all focus:outline-none"
                />
                <button
                  onClick={handleCopy}
                  className="px-3 py-2 bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <div className="p-3 bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-800 rounded-lg text-xs space-y-2 text-stone-600 dark:text-stone-400">
              <div className="flex items-center gap-2 text-stone-800 dark:text-stone-300 font-medium">
                <ExternalLink className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                <span>Non-Telegram Users</span>
              </div>
              <p>
                Recipients can open this link in any browser to stream or download the file directly from your Telegram storage.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setShareUrl(null);
                  onClose();
                }}
                className="px-4 py-2 text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

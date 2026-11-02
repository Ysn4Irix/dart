import React, { useEffect, useState } from 'react';
import {
  Download,
  Send,
  Clock,
  Loader2,
  FileX,
  Home,
} from 'lucide-react';
import { PublicShareDetails } from '../types.js';
import { api, formatBytes } from '../api.js';
import { DartLogo } from '../components/DartLogo.js';

interface PublicSharePageProps {
  slug: string;
}

export const PublicSharePage: React.FC<PublicSharePageProps> = ({ slug }) => {
  const [details, setDetails] = useState<PublicShareDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getPublicShare(slug)
      .then(setDetails)
      .catch((err) => setError(err.message || 'Share link not found or expired'))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-stone-900 flex items-center justify-center p-4 transition-colors">
        <div className="flex items-center gap-3 text-stone-500 dark:text-stone-400">
          <Loader2 className="w-5 h-5 animate-spin text-emerald-600 dark:text-emerald-400" />
          <span className="text-sm font-medium">Retrieving shared file...</span>
        </div>
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className="min-h-screen w-full flex flex-col justify-between bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 p-6 sm:p-10 transition-colors">
        <header className="w-full max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-stone-100 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700/60 shadow-xs">
              <DartLogo size={24} />
            </div>
            <span className="font-semibold text-stone-900 dark:text-stone-100 text-lg tracking-tight">Dart</span>
          </div>
        </header>

        <main className="w-full max-w-md mx-auto my-auto py-8">
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xl p-8 text-center transition-colors">
            <div className="w-14 h-14 rounded-2xl bg-stone-100 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 flex items-center justify-center mx-auto mb-5">
              <FileX className="w-7 h-7 text-amber-500 dark:text-amber-400" />
            </div>
            <div className="text-xs font-semibold tracking-wider uppercase text-stone-400 dark:text-stone-500 mb-1">
              Share Link Inactive
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-50 mb-3">
              File Unavailable
            </h1>
            <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed mb-8">
              {error || 'This shared link has expired or the file has been deleted by its owner.'}
            </p>
            <div className="flex items-center justify-center">
              <a
                href="/"
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer shadow-xs"
              >
                <Home className="w-4 h-4" />
                <span>Return to Dart</span>
              </a>
            </div>
          </div>
        </main>

        <footer className="w-full max-w-4xl mx-auto text-center text-xs text-stone-500 dark:text-stone-400 py-4">
          Dart Cloud Storage &bull; Private Telegram MTProto Storage Engine
        </footer>
      </div>
    );
  }

  const isVideo = details.mimeType.startsWith('video/');
  const isAudio = details.mimeType.startsWith('audio/');
  const isImage = details.mimeType.startsWith('image/');
  const isPdf = details.mimeType === 'application/pdf';

  const telegramShareLink = `tg://openmessage?message_id=${details.telegramMessageId}`;

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-stone-950 flex flex-col items-center justify-center p-6 text-stone-900 dark:text-stone-100 transition-colors">
      <div className="w-full max-w-2xl bg-white dark:bg-stone-900/90 border border-stone-200 dark:border-stone-800/80 rounded-2xl p-8 shadow-2xl space-y-6">
        {/* Header Branding */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-200 dark:border-stone-800">
          <div className="flex items-center gap-2.5">
            <DartLogo size={22} />
            <span className="font-semibold text-stone-900 dark:text-stone-100 tracking-tight">Dart</span>
          </div>
          <span className="text-xs text-stone-500">Served directly from Telegram Storage</span>
        </div>

        {/* Media Preview if supported */}
        {isVideo && (
          <div className="rounded-xl overflow-hidden bg-black flex items-center justify-center">
            <video controls className="w-full max-h-[400px]" src={details.streamUrl}>
              Your browser does not support the video tag.
            </video>
          </div>
        )}

        {isAudio && (
          <div className="p-6 bg-stone-50 dark:bg-stone-950 rounded-xl border border-stone-200 dark:border-stone-800">
            <audio controls className="w-full" src={details.streamUrl}>
              Your browser does not support the audio element.
            </audio>
          </div>
        )}

        {isImage && (
          <div className="rounded-xl overflow-hidden bg-black flex items-center justify-center">
            <img
              src={details.streamUrl}
              alt={details.fileName}
              className="max-h-[400px] object-contain"
            />
          </div>
        )}

        {isPdf && (
          <div className="rounded-xl overflow-hidden bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
            <iframe
              src={details.streamUrl}
              title={details.fileName}
              className="w-full h-[400px]"
            />
          </div>
        )}

        {/* File Info */}
        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-stone-900 dark:text-stone-100 break-words">{details.fileName}</h1>

          {/* Plain text metadata (No badges per UI rule) */}
          <div className="flex items-center gap-4 text-xs text-stone-600 dark:text-stone-400 pt-1">
            <span>{formatBytes(details.fileSize)}</span>
            <span>•</span>
            <span>{details.mimeType}</span>
            <span>•</span>
            <span>{details.downloadCount} downloads</span>
            {details.expiresAt && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-stone-400 dark:text-stone-500" />
                  Expires {new Date(details.expiresAt).toLocaleDateString()}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <a
            href={details.downloadUrl}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm rounded-xl transition-colors shadow-lg shadow-emerald-950/20 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-hidden"
          >
            <Download className="w-4 h-4" />
            <span>Download File</span>
          </a>

          <a
            href={telegramShareLink}
            className="flex items-center justify-center gap-2 py-3 px-5 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-sm font-medium rounded-xl border border-stone-200 dark:border-stone-700/60 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-hidden"
          >
            <Send className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <span>Open in Telegram</span>
          </a>
        </div>
      </div>
    </div>
  );
};

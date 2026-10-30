import React, { useEffect, useState } from 'react';
import {
  Download,
  Send,
  Clock,
  AlertCircle,
  Loader2,
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
      <div className="min-h-screen bg-stone-900 flex items-center justify-center p-4">
        <div className="flex items-center gap-3 text-stone-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading shared file...</span>
        </div>
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className="min-h-screen bg-stone-900 flex items-center justify-center p-4">
        <div className="bg-stone-800/60 border border-stone-800 rounded-2xl p-8 max-w-md w-full text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
          <h2 className="text-xl font-semibold text-stone-100">Link Unavailable</h2>
          <p className="text-sm text-stone-400">{error || 'This file is no longer accessible.'}</p>
        </div>
      </div>
    );
  }

  const isVideo = details.mimeType.startsWith('video/');
  const isAudio = details.mimeType.startsWith('audio/');
  const isImage = details.mimeType.startsWith('image/');
  const isPdf = details.mimeType === 'application/pdf';

  const telegramShareLink = `tg://openmessage?message_id=${details.telegramMessageId}`;

  return (
    <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center p-6 text-stone-100">
      <div className="w-full max-w-2xl bg-stone-900/90 border border-stone-800/80 rounded-2xl p-8 shadow-2xl space-y-6">
        {/* Header Branding */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-800">
          <div className="flex items-center gap-2.5">
            <DartLogo size={22} />
            <span className="font-semibold text-stone-100 tracking-tight">Dart</span>
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
          <div className="p-6 bg-stone-950 rounded-xl border border-stone-800">
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
          <div className="rounded-xl overflow-hidden bg-stone-900 border border-stone-800">
            <iframe
              src={details.streamUrl}
              title={details.fileName}
              className="w-full h-[400px]"
            />
          </div>
        )}

        {/* File Info */}
        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-stone-100 break-words">{details.fileName}</h1>

          {/* Plain text metadata (No badges per UI rule) */}
          <div className="flex items-center gap-4 text-xs text-stone-400 pt-1">
            <span>{formatBytes(details.fileSize)}</span>
            <span>•</span>
            <span>{details.mimeType}</span>
            <span>•</span>
            <span>{details.downloadCount} downloads</span>
            {details.expiresAt && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-stone-500" />
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
            className="flex-1 flex items-center justify-center gap-2 py-3 px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm rounded-xl transition-colors shadow-lg shadow-emerald-950/40"
          >
            <Download className="w-4 h-4" />
            <span>Download File</span>
          </a>

          <a
            href={telegramShareLink}
            className="flex items-center justify-center gap-2 py-3 px-5 bg-stone-800 hover:bg-stone-700 text-stone-200 text-sm font-medium rounded-xl border border-stone-700/60 transition-colors"
          >
            <Send className="w-4 h-4 text-sky-400" />
            <span>Open in Telegram</span>
          </a>
        </div>
      </div>
    </div>
  );
};

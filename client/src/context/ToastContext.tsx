import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: ToastAction;
}

export interface ToastOptions {
  message?: string;
  duration?: number;
  action?: ToastAction;
}

export interface ToastContextValue {
  show: (type: ToastType, title: string, options?: ToastOptions) => string;
  success: (title: string, messageOrOptions?: string | ToastOptions) => string;
  error: (title: string, messageOrOptions?: string | ToastOptions) => string;
  info: (title: string, messageOrOptions?: string | ToastOptions) => string;
  warning: (title: string, messageOrOptions?: string | ToastOptions) => string;
  dismiss: (id: string) => void;
  clearAll: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const DEFAULT_DURATIONS: Record<ToastType, number> = {
  success: 3500,
  info: 4000,
  warning: 5000,
  error: 6000,
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    const timer = timeoutsRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timeoutsRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    timeoutsRef.current.forEach((timer) => clearTimeout(timer));
    timeoutsRef.current.clear();
    setToasts([]);
  }, []);

  const show = useCallback(
    (type: ToastType, title: string, options?: ToastOptions): string => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const duration = options?.duration ?? DEFAULT_DURATIONS[type];

      const newToast: ToastItem = {
        id,
        type,
        title,
        message: options?.message,
        duration,
        action: options?.action,
      };

      setToasts((prev) => {
        // Keep maximum of 5 toasts to prevent clutter
        const updated = [...prev, newToast];
        if (updated.length > 5) {
          const removed = updated.shift();
          if (removed) {
            const timer = timeoutsRef.current.get(removed.id);
            if (timer) clearTimeout(timer);
            timeoutsRef.current.delete(removed.id);
          }
        }
        return updated;
      });

      if (duration > 0) {
        const timer = setTimeout(() => {
          dismiss(id);
        }, duration);
        timeoutsRef.current.set(id, timer);
      }

      return id;
    },
    [dismiss]
  );

  const normalizeOptions = (messageOrOptions?: string | ToastOptions): ToastOptions => {
    if (typeof messageOrOptions === 'string') {
      return { message: messageOrOptions };
    }
    return messageOrOptions || {};
  };

  const success = useCallback(
    (title: string, messageOrOptions?: string | ToastOptions) =>
      show('success', title, normalizeOptions(messageOrOptions)),
    [show]
  );

  const error = useCallback(
    (title: string, messageOrOptions?: string | ToastOptions) =>
      show('error', title, normalizeOptions(messageOrOptions)),
    [show]
  );

  const info = useCallback(
    (title: string, messageOrOptions?: string | ToastOptions) =>
      show('info', title, normalizeOptions(messageOrOptions)),
    [show]
  );

  const warning = useCallback(
    (title: string, messageOrOptions?: string | ToastOptions) =>
      show('warning', title, normalizeOptions(messageOrOptions)),
    [show]
  );

  // Pause timer on hover
  const handleMouseEnter = (id: string) => {
    const timer = timeoutsRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timeoutsRef.current.delete(id);
    }
  };

  const handleMouseLeave = (toast: ToastItem) => {
    if (toast.duration && toast.duration > 0 && !timeoutsRef.current.has(toast.id)) {
      const timer = setTimeout(() => {
        dismiss(toast.id);
      }, 2000); // 2s grace period on mouse leave
      timeoutsRef.current.set(toast.id, timer);
    }
  };

  useEffect(() => {
    const currentTimers = timeoutsRef.current;
    return () => {
      currentTimers.forEach((timer) => clearTimeout(timer));
      currentTimers.clear();
    };
  }, []);

  const getToastIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />;
      case 'info':
        return <Info className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />;
    }
  };

  return (
    <ToastContext.Provider value={{ show, success, error, info, warning, dismiss, clearAll }}>
      {children}
      {/* Toast Notification Container */}
      <aside
        aria-label="Notifications"
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-md w-full px-4 sm:px-0 pointer-events-none"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role={toast.type === 'error' ? 'alert' : 'status'}
            aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
            onMouseEnter={() => handleMouseEnter(toast.id)}
            onMouseLeave={() => handleMouseLeave(toast)}
            className="pointer-events-auto bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border border-stone-200 dark:border-stone-800 rounded-xl p-3.5 shadow-lg flex items-start gap-3 transition-all duration-200 animate-in fade-in slide-in-from-bottom-2"
          >
            {getToastIcon(toast.type)}
            <div className="flex-1 min-w-0 pr-1">
              <div className="text-sm font-medium text-stone-900 dark:text-stone-100 tracking-tight">
                {toast.title}
              </div>
              {toast.message && (
                <div className="text-xs text-stone-600 dark:text-stone-400 mt-0.5 leading-relaxed break-words">
                  {toast.message}
                </div>
              )}
              {toast.action && (
                <button
                  type="button"
                  onClick={() => {
                    toast.action?.onClick();
                    dismiss(toast.id);
                  }}
                  className="mt-2 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 underline underline-offset-2 cursor-pointer transition-colors"
                >
                  {toast.action.label}
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              className="p-1 rounded-md text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer shrink-0"
              title="Dismiss notification"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </aside>
    </ToastContext.Provider>
  );
};

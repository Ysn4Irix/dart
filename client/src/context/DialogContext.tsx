import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { AlertTriangle, AlertCircle, CheckCircle2, Info, X, Trash2, FolderPlus } from 'lucide-react';

export interface AlertOptions {
  title: string;
  message: string;
  confirmText?: string;
  type?: 'info' | 'error' | 'success' | 'warning';
}

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'default';
  icon?: 'trash' | 'warning' | 'info';
}

export interface PromptOptions {
  title: string;
  message?: string;
  placeholder?: string;
  defaultValue?: string;
  confirmText?: string;
  cancelText?: string;
  icon?: 'folder' | 'input';
  validate?: (value: string) => string | null;
}

interface DialogState {
  isOpen: boolean;
  mode: 'alert' | 'confirm' | 'prompt';
  title: string;
  message?: string;
  confirmText: string;
  cancelText?: string;
  variant?: 'danger' | 'default';
  type?: 'info' | 'error' | 'success' | 'warning';
  icon?: 'trash' | 'warning' | 'info' | 'folder' | 'input';
  promptValue?: string;
  promptPlaceholder?: string;
  promptError?: string | null;
  validate?: (value: string) => string | null;
}

interface DialogContextValue {
  alert: (options: AlertOptions | string) => Promise<void>;
  confirm: (options: ConfirmOptions | string) => Promise<boolean>;
  prompt: (options: PromptOptions | string) => Promise<string | null>;
}

const DialogContext = createContext<DialogContextValue | null>(null);

export const useDialog = (): DialogContextValue => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return context;
};

export const DialogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dialog, setDialog] = useState<DialogState>({
    isOpen: false,
    mode: 'alert',
    title: '',
    confirmText: 'OK',
  });

  const [promptInput, setPromptInput] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);

  // References to resolve promises
  const alertResolver = useRef<(() => void) | null>(null);
  const confirmResolver = useRef<((value: boolean) => void) | null>(null);
  const promptResolver = useRef<((value: string | null) => void) | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const alert = useCallback((options: AlertOptions | string): Promise<void> => {
    return new Promise((resolve) => {
      alertResolver.current = resolve;
      const opts: AlertOptions =
        typeof options === 'string' ? { title: 'Notice', message: options } : options;

      setDialog({
        isOpen: true,
        mode: 'alert',
        title: opts.title || 'Notice',
        message: opts.message,
        confirmText: opts.confirmText || 'OK',
        type: opts.type || 'info',
      });
    });
  }, []);

  const confirm = useCallback((options: ConfirmOptions | string): Promise<boolean> => {
    return new Promise((resolve) => {
      confirmResolver.current = resolve;
      const opts: ConfirmOptions =
        typeof options === 'string' ? { title: 'Confirm', message: options } : options;

      setDialog({
        isOpen: true,
        mode: 'confirm',
        title: opts.title || 'Are you sure?',
        message: opts.message,
        confirmText: opts.confirmText || 'Confirm',
        cancelText: opts.cancelText || 'Cancel',
        variant: opts.variant || 'default',
        icon: opts.icon || (opts.variant === 'danger' ? 'trash' : 'warning'),
      });
    });
  }, []);

  const prompt = useCallback((options: PromptOptions | string): Promise<string | null> => {
    return new Promise((resolve) => {
      promptResolver.current = resolve;
      const opts: PromptOptions =
        typeof options === 'string' ? { title: options } : options;

      const initialVal = opts.defaultValue || '';
      setPromptInput(initialVal);
      setInputError(null);

      setDialog({
        isOpen: true,
        mode: 'prompt',
        title: opts.title || 'Enter value',
        message: opts.message,
        confirmText: opts.confirmText || 'Submit',
        cancelText: opts.cancelText || 'Cancel',
        promptPlaceholder: opts.placeholder || '',
        icon: opts.icon || 'folder',
        validate: opts.validate,
      });
    });
  }, []);

  // Autofocus input when prompt opens
  useEffect(() => {
    if (dialog.isOpen && dialog.mode === 'prompt') {
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [dialog.isOpen, dialog.mode]);

  // Handle Close / Cancel
  const handleCancel = () => {
    if (dialog.mode === 'confirm' && confirmResolver.current) {
      confirmResolver.current(false);
      confirmResolver.current = null;
    } else if (dialog.mode === 'prompt' && promptResolver.current) {
      promptResolver.current(null);
      promptResolver.current = null;
    } else if (dialog.mode === 'alert' && alertResolver.current) {
      alertResolver.current();
      alertResolver.current = null;
    }
    setDialog((prev) => ({ ...prev, isOpen: false }));
  };

  // Handle Confirm
  const handleConfirm = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (dialog.mode === 'prompt') {
      const cleanVal = promptInput.trim();
      if (dialog.validate) {
        const error = dialog.validate(cleanVal);
        if (error) {
          setInputError(error);
          return;
        }
      }
      if (promptResolver.current) {
        promptResolver.current(cleanVal);
        promptResolver.current = null;
      }
    } else if (dialog.mode === 'confirm') {
      if (confirmResolver.current) {
        confirmResolver.current(true);
        confirmResolver.current = null;
      }
    } else if (dialog.mode === 'alert') {
      if (alertResolver.current) {
        alertResolver.current();
        alertResolver.current = null;
      }
    }

    setDialog((prev) => ({ ...prev, isOpen: false }));
  };

  // Keyboard shortcut listener (Escape to cancel, Enter to submit)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!dialog.isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        handleCancel();
      } else if (e.key === 'Enter' && dialog.mode !== 'prompt') {
        e.preventDefault();
        handleConfirm();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dialog.isOpen, dialog.mode, promptInput]);

  const renderIcon = () => {
    if (dialog.mode === 'confirm') {
      if (dialog.icon === 'trash') {
        return (
          <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/60 border border-red-200 dark:border-red-900/60 flex items-center justify-center shrink-0">
            <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
        );
      }
      return (
        <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900/60 flex items-center justify-center shrink-0">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        </div>
      );
    }

    if (dialog.mode === 'prompt') {
      return (
        <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900/60 flex items-center justify-center shrink-0">
          <FolderPlus className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        </div>
      );
    }

    // Alert icons
    switch (dialog.type) {
      case 'error':
        return (
          <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/60 border border-red-200 dark:border-red-900/60 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
        );
      case 'success':
        return (
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900/60 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
        );
      case 'warning':
        return (
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900/60 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
        );
      case 'info':
      default:
        return (
          <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-center shrink-0">
            <Info className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
        );
    }
  };

  return (
    <DialogContext.Provider value={{ alert, confirm, prompt }}>
      {children}

      {dialog.isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={handleCancel}
        >
          <div
            className="w-full max-w-md bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-2xl p-6 transition-colors overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4">
              {renderIcon()}

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100 tracking-tight">
                    {dialog.title}
                  </h3>
                  <button
                    onClick={handleCancel}
                    className="p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 rounded transition-colors cursor-pointer -mr-1 -mt-1"
                    aria-label="Close dialog"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {dialog.message && (
                  <p className="mt-2 text-sm text-stone-600 dark:text-stone-400 whitespace-pre-wrap leading-relaxed">
                    {dialog.message}
                  </p>
                )}

                {/* Prompt Input Form */}
                {dialog.mode === 'prompt' && (
                  <form onSubmit={handleConfirm} className="mt-4 space-y-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={promptInput}
                      onChange={(e) => {
                        setPromptInput(e.target.value);
                        if (inputError) setInputError(null);
                      }}
                      placeholder={dialog.promptPlaceholder}
                      className="w-full bg-stone-50 dark:bg-stone-800/80 border border-stone-300 dark:border-stone-700 rounded-lg px-3.5 py-2 text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                    />
                    {inputError && (
                      <p className="text-xs text-red-600 dark:text-red-400">{inputError}</p>
                    )}
                  </form>
                )}

                {/* Action Buttons */}
                <div className="mt-6 flex items-center justify-end gap-2.5">
                  {(dialog.mode === 'confirm' || dialog.mode === 'prompt') && (
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="px-4 py-2 text-xs font-medium text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-lg border border-stone-200 dark:border-stone-700/60 transition-colors cursor-pointer"
                    >
                      {dialog.cancelText || 'Cancel'}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleConfirm()}
                    className={`px-4 py-2 text-xs font-medium text-white rounded-lg transition-colors cursor-pointer shadow-xs ${
                      dialog.variant === 'danger'
                        ? 'bg-red-600 hover:bg-red-500'
                        : 'bg-emerald-600 hover:bg-emerald-500'
                    }`}
                  >
                    {dialog.confirmText}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
};

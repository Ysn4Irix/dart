import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Copy, Check } from 'lucide-react';
import { DartLogo } from './DartLogo.js';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  copied: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    copied: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
      copied: false,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    console.error('Uncaught error caught by Dart ErrorBoundary:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleCopyError = () => {
    const errorDetails = [
      `Dart Crash Report:`,
      `Message: ${this.state.error?.message || 'Unknown error'}`,
      `Stack: ${this.state.error?.stack || 'No stack trace'}`,
      `Component Stack: ${this.state.errorInfo?.componentStack || 'N/A'}`,
      `User Agent: ${navigator.userAgent}`,
      `Time: ${new Date().toISOString()}`,
    ].join('\n\n');

    navigator.clipboard.writeText(errorDetails).then(() => {
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2500);
    });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex flex-col justify-between bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 p-6 sm:p-10 transition-colors">
          {/* Header */}
          <header className="w-full max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-lg bg-stone-100 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700/60 shadow-xs">
                <DartLogo size={24} />
              </div>
              <span className="font-semibold text-stone-900 dark:text-stone-100 text-lg tracking-tight">
                Dart
              </span>
            </div>
          </header>

          {/* Main Error View */}
          <main className="w-full max-w-xl mx-auto my-auto py-8">
            <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xl p-8 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center justify-center mb-5">
                <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-50 mb-2">
                Something unexpected happened
              </h1>
              <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed mb-6">
                Dart encountered a runtime issue while rendering this interface. Your stored files and sessions in Telegram remain completely safe.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <button
                  type="button"
                  onClick={this.handleReload}
                  className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer shadow-xs"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Reload Application</span>
                </button>
                <button
                  type="button"
                  onClick={this.handleGoHome}
                  className="flex items-center gap-2 px-4 py-2.5 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-sm font-medium rounded-lg border border-stone-200 dark:border-stone-700 transition-colors cursor-pointer"
                >
                  <Home className="w-4 h-4" />
                  <span>Return to Home</span>
                </button>
                <button
                  type="button"
                  onClick={this.handleCopyError}
                  className="flex items-center gap-1.5 px-3 py-2 text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 text-xs transition-colors cursor-pointer ml-auto"
                  title="Copy technical diagnostic details to clipboard"
                >
                  {this.state.copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Diagnostics</span>
                    </>
                  )}
                </button>
              </div>

              {/* Collapsible Error Technical Information */}
              {this.state.error && (
                <details className="group border-t border-stone-100 dark:border-stone-800 pt-4 text-xs">
                  <summary className="font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 cursor-pointer select-none">
                    Technical Error Details
                  </summary>
                  <div className="mt-3 p-3.5 rounded-lg bg-stone-50 dark:bg-stone-950 font-mono text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-800 overflow-x-auto space-y-2">
                    <p className="font-semibold text-red-600 dark:text-red-400">{this.state.error.message}</p>
                    {this.state.error.stack && (
                      <pre className="text-[11px] text-stone-500 dark:text-stone-400 whitespace-pre-wrap leading-tight">
                        {this.state.error.stack}
                      </pre>
                    )}
                  </div>
                </details>
              )}
            </div>
          </main>

          {/* Footer */}
          <footer className="w-full max-w-4xl mx-auto text-center text-xs text-stone-500 dark:text-stone-400 py-4">
            Dart Cloud Storage &bull; Private Telegram MTProto Storage Engine
          </footer>
        </div>
      );
    }

    return this.props.children;
  }
}

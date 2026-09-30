import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Application ErrorBoundary Caught Error]:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleClearCacheAndReset = () => {
    try {
      localStorage.removeItem('nexus_active_view');
      localStorage.removeItem('nexus_current_user');
      localStorage.removeItem('nexus_seller_session');
      localStorage.removeItem('nexus_admin_session');
      localStorage.removeItem('nexus_session_notice');
    } catch {}
    window.location.href = window.location.origin + window.location.pathname;
  };

  private handleGoHome = () => {
    try {
      localStorage.setItem('nexus_active_view', 'home');
    } catch {}
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = window.location.origin + window.location.pathname;
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 sm:p-6 text-slate-100 font-sans">
          <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-400/10 border border-amber-400/20 text-amber-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl sm:text-2xl font-bold font-serif text-white">
                Store Session Restored
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                An unexpected update was detected while synchronizing with the catalog. Click below to continue shopping smoothly.
              </p>
            </div>

            {this.state.error && (
              <div className="text-left bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-[11px] font-mono text-rose-300/80 overflow-x-auto max-h-24">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={this.handleGoHome}
                className="flex-1 px-4 py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>Go to Storefront</span>
              </button>

              <button
                onClick={this.handleReload}
                className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all border border-slate-700 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh Page</span>
              </button>
            </div>

            <button
              onClick={this.handleClearCacheAndReset}
              className="text-[11px] text-slate-500 hover:text-amber-400 flex items-center justify-center gap-1.5 mx-auto transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear cached session & reset</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { FaExclamationTriangle, FaRedo, FaHome, FaBug } from 'react-icons/fa';
import { logger } from '../../utils/logger';
import { markCrashed } from '../../utils/crashRecovery';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  module?: string;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    markCrashed();
    logger.error(
      this.props.module || 'ErrorBoundary',
      `Caught error: ${error.message}`,
      { stack: error.stack, componentStack: errorInfo.componentStack }
    );
    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex items-center justify-center min-h-[400px] p-8" role="alert">
          <div className="bg-theme-surface border border-theme-border/30 rounded-2xl p-8 max-w-md w-full text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-red-500/10 flex items-center justify-center">
              <FaExclamationTriangle className="w-7 h-7 text-red-400" />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-theme-text">Something went wrong</h2>
              <p className="text-sm text-theme-text/50 mt-1">
                {this.props.module
                  ? `The ${this.props.module} module encountered an error.`
                  : 'An unexpected error occurred.'}
              </p>
            </div>

            {this.state.error && (
              <details className="text-left">
                <summary className="text-xs text-theme-text/40 cursor-pointer hover:text-theme-text/60 flex items-center gap-1">
                  <FaBug className="w-3 h-3" /> Error details
                </summary>
                <pre className="mt-2 p-3 bg-theme-background rounded-xl text-xs text-red-400 overflow-auto max-h-32">
                  {this.state.error.message}
                  {'\n'}
                  {this.state.error.stack?.split('\n').slice(0, 4).join('\n')}
                </pre>
              </details>
            )}

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={this.handleGoHome}
                className="flex items-center gap-2 px-4 py-2 bg-theme-surface border border-theme-border/50 text-theme-text rounded-xl text-sm hover:bg-theme-surface/80 transition-colors"
              >
                <FaHome className="w-3 h-3" /> Go Home
              </button>
              <button
                onClick={this.handleReset}
                className="flex items-center gap-2 px-4 py-2 bg-theme-icon text-white rounded-xl text-sm font-medium hover:bg-theme-icon/90 transition-colors"
              >
                <FaRedo className="w-3 h-3" /> Try Again
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

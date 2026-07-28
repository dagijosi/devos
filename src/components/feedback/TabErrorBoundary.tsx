import { Component, type ReactNode, type ErrorInfo } from 'react';
import { FaExclamationTriangle, FaRedo } from 'react-icons/fa';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, info: ErrorInfo) => void;
  title?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class TabErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.props.onError?.(error, info);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center mb-4">
            <FaExclamationTriangle className="w-6 h-6 text-red-400" />
          </div>
          <h3 className="text-base font-semibold text-theme-text mb-1">
            {this.props.title || 'Something went wrong'}
          </h3>
          <p className="text-xs text-theme-text/40 text-center max-w-sm mb-4">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={this.handleRetry}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-theme-icon text-white rounded-xl hover:bg-theme-icon/90 transition-colors"
          >
            <FaRedo className="w-3 h-3" /> Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

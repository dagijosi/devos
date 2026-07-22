import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import Button from '../forms/Button';

interface Props {
  children: ReactNode;
  formName?: string;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class FormErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`Form error in ${this.props.formName || 'unknown form'}:`, error, errorInfo);
    
    this.setState({ error });
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
    this.props.onRetry?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="shrink-0">
              <AlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-red-800">
                Form Error
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>
                  There was an error with the {this.props.formName || 'form'}. 
                  Please try again or refresh the page.
                </p>
                {import.meta.env.DEV && this.state.error && (
                  <details className="mt-2">
                    <summary className="cursor-pointer font-medium">
                      Error Details (Development)
                    </summary>
                    <div className="mt-1 font-mono text-xs bg-red-100 p-2 rounded border">
                      {this.state.error.message}
                    </div>
                  </details>
                )}
              </div>
              <div className="mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={this.handleRetry}
                  leftIcon={<RefreshCw size={14} />}
                  className="bg-white text-red-700 border-red-300 hover:bg-red-50"
                >
                  Try Again
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default FormErrorBoundary;

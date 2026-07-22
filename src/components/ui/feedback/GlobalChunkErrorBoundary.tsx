import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { motion } from "framer-motion";
import { RefreshCcw, AlertCircle } from "lucide-react";
import Button from "../forms/Button";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class GlobalChunkErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(
      "GlobalChunkErrorBoundary caught an error:",
      error,
      errorInfo,
    );

    const chunkFailedMessage = /Failed to fetch dynamically imported module/;
    const mimeErrorMessage = /Expected a JavaScript-or-Wasm module script/;

    if (
      chunkFailedMessage.test(error.message) ||
      mimeErrorMessage.test(error.message) ||
      error.name === "ChunkLoadError" ||
      error.message.includes("dynamically imported module")
    ) {
      console.warn(
        "Chunk load error detected. Forcing a hard reload to fetch newest version.",
      );
      window.location.reload();
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-theme-background">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="max-w-md w-full bg-theme-surface/80 backdrop-blur-xl border border-theme-border/50 rounded-3xl p-8 shadow-2xl text-center relative overflow-hidden"
          >
            {/* Background Accent */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-theme-icon/10 rounded-full blur-3xl -z-10" />
            
            <div className="flex justify-center mb-6">
              <motion.div 
                initial={{ rotate: -10, scale: 0.9 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ 
                  type: "spring",
                  stiffness: 260,
                  damping: 20,
                  delay: 0.1
                }}
                className="w-16 h-16 rounded-2xl bg-theme-icon/10 flex items-center justify-center text-theme-icon"
              >
                <AlertCircle size={32} />
              </motion.div>
            </div>

            <h2 className="text-2xl font-bold text-theme-text mb-4">
              Refresh Required
            </h2>
            
            <p className="text-theme-text/70 mb-8 leading-relaxed">
              We've updated the application. Please refresh to continue using the latest version.
            </p>

            <div className="flex flex-col gap-3">
              <Button 
                onClick={() => window.location.reload()}
                variant="primary"
                size="lg"
                leftIcon={<RefreshCcw size={18} />}
                className="w-full"
              >
                Refresh Now
              </Button>
              
              <Button 
                onClick={() => window.history.back()}
                variant="secondary"
                size="lg"
                className="w-full text-theme-text/60"
              >
                Go Back
              </Button>
            </div>

            <div className="mt-8 pt-6 border-t border-theme-border/30 flex flex-col items-center">
              <p className="text-[10px] text-theme-text/40 font-mono uppercase tracking-widest mb-2 font-bold">
                Error Details
              </p>
              <p className="text-xs text-theme-text/40 font-mono break-all line-clamp-2 max-w-[280px]">
                {this.state.error?.message || "Chunk load failure"}
              </p>
            </div>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GlobalChunkErrorBoundary;

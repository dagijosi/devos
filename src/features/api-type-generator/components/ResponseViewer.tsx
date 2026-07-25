import { FaCheckCircle, FaExclamationCircle, FaSpinner, FaCode } from 'react-icons/fa';
import type { ApiResponse } from '../types';

interface Props {
  response: ApiResponse | null;
  error: string | null;
  loading: boolean;
}

export function ResponseViewer({ response, error, loading }: Props) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-theme-text/30">
        <FaSpinner className="w-5 h-5 animate-spin mr-2" />
        <span className="text-xs">Executing request...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <FaExclamationCircle className="w-4 h-4 text-red-400" />
          <span className="text-xs font-semibold text-red-400">Request Failed</span>
        </div>
        <pre className="text-xs text-red-300/80 font-mono whitespace-pre-wrap">{error}</pre>
      </div>
    );
  }

  if (!response) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-theme-text/20">
        <FaCode className="w-10 h-10 mb-3" />
        <p className="text-xs">Execute a request to see the response</p>
      </div>
    );
  }

  const isSuccess = response.status >= 200 && response.status < 300;
  const statusColor = isSuccess ? 'text-green-400' : 'text-red-400';

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {isSuccess ? <FaCheckCircle className="w-3.5 h-3.5 text-green-400" /> : <FaExclamationCircle className="w-3.5 h-3.5 text-red-400" />}
        <span className={`text-xs font-semibold ${statusColor}`}>{response.status} {response.statusText}</span>
        <span className="text-[10px] text-theme-text/30">{response.duration}ms</span>
      </div>

      <pre className="bg-theme-background border border-theme-border/20 rounded-xl p-4 text-xs font-mono text-theme-text/80 overflow-x-auto max-h-80 overflow-y-auto whitespace-pre">
        {formatJson(response.data)}
      </pre>
    </div>
  );
}

function formatJson(data: unknown): string {
  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return String(data);
  }
}

import { useState, useCallback, useMemo } from 'react';
import { FaCog } from 'react-icons/fa';
import { toast } from 'sonner';
import type { ApiRequestConfig, ApiResponse, GeneratedFile } from '../types';
import { DEFAULT_TYPE_OPTIONS } from '../types';
import { executeRequest } from '../utils/requestExecutor';
import { generateTypes } from '../utils/typeGenerator';
import { copyToClipboard, downloadFile, copyAllFiles, downloadAllAsZip } from '../utils/exportUtils';
import { ApiRequestForm } from '../components/ApiRequestForm';
import { ResponseViewer } from '../components/ResponseViewer';
import { FileExplorer, TypePreview } from '../components/TypePreview';
import { ExportActions } from '../components/ExportActions';

export function ApiTypeGeneratorPage() {
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<GeneratedFile[]>([]);
  const [activeFilename, setActiveFilename] = useState<string | null>(null);
  const [lastConfig, setLastConfig] = useState<ApiRequestConfig | null>(null);
  const [options, setOptions] = useState(DEFAULT_TYPE_OPTIONS);
  const [showOptions, setShowOptions] = useState(false);

  const activeFile = useMemo(() => {
    if (!activeFilename) return null;
    return files.find(f => f.filename === activeFilename) ?? null;
  }, [files, activeFilename]);

  const handleExecute = useCallback(async (config: ApiRequestConfig) => {
    setLoading(true);
    setError(null);
    setResponse(null);
    setFiles([]);
    setActiveFilename(null);
    setLastConfig(config);

    try {
      const res = await executeRequest(config);
      setResponse(res);

      const isSuccess = res.status >= 200 && res.status < 300;
      const successData = isSuccess ? res.data : null;
      const errorData = !isSuccess ? res.data : null;

      const result = generateTypes(successData, errorData, options.rootName, options);

      const generated: GeneratedFile[] = [];

      if (result.interfaces.length > 0) {
        generated.push({
          filename: 'api.types.ts',
          content: result.interfaces.join('\n\n'),
          language: 'typescript',
        });
      }

      if (result.zodSchemas.length > 0) {
        generated.push({
          filename: 'zod.schema.ts',
          content: `import { z } from 'zod';\n\n${result.zodSchemas.join('\n\n')}`,
          language: 'typescript',
        });
      }

      if (result.apiService) {
        generated.push({
          filename: 'api.service.ts',
          content: result.apiService,
          language: 'typescript',
        });
      }

      setFiles(generated);
      if (generated.length > 0) setActiveFilename(generated[0].filename);

    } catch (e: any) {
      setError(e.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  }, [options]);

  const handleCopy = useCallback(() => {
    if (activeFile) copyToClipboard(activeFile.content);
  }, [activeFile]);

  const handleDownload = useCallback(() => {
    if (activeFile) downloadFile(activeFile);
  }, [activeFile]);

  const handleCopyAll = useCallback(() => {
    if (files.length > 0) copyAllFiles(files);
  }, [files]);

  const handleDownloadAll = useCallback(async () => {
    if (files.length > 0) await downloadAllAsZip(files);
  }, [files]);

  const handleRegenerate = useCallback(() => {
    if (lastConfig) handleExecute(lastConfig);
  }, [lastConfig, handleExecute]);

  const handleFormat = useCallback(() => {
    if (!activeFile) return;
    try {
      const formatted = JSON.stringify(JSON.parse(activeFile.content), null, 2);
      setFiles(prev => prev.map(f => f.filename === activeFile.filename ? { ...f, content: formatted } : f));
      toast.success('Formatted');
    } catch {
      toast.error('Could not format (invalid JSON in generated code)');
    }
  }, [activeFile]);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-theme-text">API Type Generator</h1>
          <p className="text-xs text-theme-text/40 mt-0.5">Execute API requests and generate TypeScript types from responses</p>
        </div>
        <button onClick={() => setShowOptions(!showOptions)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-theme-surface border border-theme-border/20 rounded-lg text-xs text-theme-text/60 hover:text-theme-icon transition-colors">
          <FaCog className="w-3 h-3" /> Options
        </button>
      </div>

      {/* Options panel */}
      {showOptions && (
        <div className="bg-theme-surface border border-theme-border/20 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-theme-text/70">Generation Options</span>
            <span className="text-[10px] text-theme-text/30">Root type name</span>
          </div>
          <div className="flex flex-wrap gap-3">
            <label className="flex items-center gap-2 text-xs text-theme-text/60 cursor-pointer">
              <input type="checkbox" checked={options.generateApiWrapper} onChange={e => setOptions({ ...options, generateApiWrapper: e.target.checked })} className="accent-theme-icon" />
              API Response Wrapper
            </label>
            <label className="flex items-center gap-2 text-xs text-theme-text/60 cursor-pointer">
              <input type="checkbox" checked={options.generateZodSchema} onChange={e => setOptions({ ...options, generateZodSchema: e.target.checked })} className="accent-theme-icon" />
              Zod Schema
            </label>
            <label className="flex items-center gap-2 text-xs text-theme-text/60 cursor-pointer">
              <input type="checkbox" checked={options.generateApiService} onChange={e => setOptions({ ...options, generateApiService: e.target.checked })} className="accent-theme-icon" />
              API Service
            </label>
          </div>
          <input type="text" value={options.rootName} onChange={e => setOptions({ ...options, rootName: e.target.value })}
            placeholder="ApiResponse"
            className="w-48 bg-theme-background border border-theme-border/30 rounded-lg px-3 py-1.5 text-xs font-mono text-theme-text outline-none" />
        </div>
      )}

      {/* Request form */}
      <div className="bg-theme-surface border border-theme-border/20 rounded-2xl p-4">
        <ApiRequestForm onExecute={handleExecute} loading={loading} />
      </div>

      {/* Response + Type output */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-theme-surface border border-theme-border/20 rounded-2xl p-4">
          <h3 className="text-xs font-semibold text-theme-text/70 mb-3">Response</h3>
          <ResponseViewer response={response} error={error} loading={loading} />
        </div>

        <div className="bg-theme-surface border border-theme-border/20 rounded-2xl overflow-hidden flex flex-col min-h-[400px]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-theme-border/10">
            <h3 className="text-xs font-semibold text-theme-text/70">Generated Types</h3>
            <ExportActions
              files={files}
              activeFile={activeFile}
              onCopy={handleCopy}
              onDownload={handleDownload}
              onCopyAll={handleCopyAll}
              onDownloadAll={handleDownloadAll}
              onRegenerate={handleRegenerate}
              onFormat={handleFormat}
            />
          </div>
          <div className="flex flex-1 min-h-0">
            <div className="w-44 shrink-0 border-r border-theme-border/10 p-3 overflow-y-auto">
              <FileExplorer files={files} activeFile={activeFilename} onSelectFile={setActiveFilename} />
            </div>
            <div className="flex-1 overflow-hidden">
              <TypePreview
                file={activeFile}
                onCopy={handleCopy}
                onDownload={handleDownload}
                onRegenerate={handleRegenerate}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

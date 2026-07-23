import { useState } from 'react';
import { FaDownload, FaFileCsv, FaFileCode, FaFileAlt, FaFilePdf } from 'react-icons/fa';
import { toast } from 'sonner';

interface Props {
  onExport: (format: 'csv' | 'json' | 'md' | 'pdf') => Promise<string>;
}

export function ExportMenu({ onExport }: Props) {
  const [open, setOpen] = useState(false);

  const handleExport = async (format: 'csv' | 'json' | 'md' | 'pdf') => {
    setOpen(false);
    try {
      const content = await onExport(format);
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `insights-${new Date().toISOString().slice(0, 10)}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported as ${format.toUpperCase()}`);
    } catch {
      toast.error('Export failed');
    }
  };

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-theme-text/60 hover:text-theme-text bg-theme-background/50 border border-theme-border/20 rounded-xl transition-colors">
        <FaDownload className="w-3 h-3" /> Export
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 bg-theme-surface border border-theme-border/20 rounded-xl shadow-2xl py-1 min-w-[140px]">
            {[
              { format: 'csv' as const, icon: FaFileCsv, label: 'CSV' },
              { format: 'json' as const, icon: FaFileCode, label: 'JSON' },
              { format: 'md' as const, icon: FaFileAlt, label: 'Markdown' },
              { format: 'pdf' as const, icon: FaFilePdf, label: 'PDF' },
            ].map((opt) => (
              <button key={opt.format} onClick={() => handleExport(opt.format)}
                className="flex items-center gap-2 w-full px-4 py-2 text-xs text-theme-text/70 hover:text-theme-text hover:bg-theme-background/50 transition-colors">
                <opt.icon className="w-3.5 h-3.5" /> {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

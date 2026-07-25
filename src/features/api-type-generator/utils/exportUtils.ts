import { toast } from 'sonner';
import type { GeneratedFile } from '../types';

export async function copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  } catch {
    toast.error('Failed to copy');
  }
}

export function downloadFile(file: GeneratedFile): void {
  const blob = new Blob([file.content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.filename;
  a.click();
  URL.revokeObjectURL(url);
  toast.success(`Downloaded ${file.filename}`);
}

export function copyAllFiles(files: GeneratedFile[]): void {
  const combined = files.map(f => `// === ${f.filename} ===\n\n${f.content}`).join('\n\n');
  copyToClipboard(combined);
}

export async function downloadAllAsZip(files: GeneratedFile[]): Promise<void> {
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();
  for (const f of files) {
    zip.file(f.filename, f.content);
  }
  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'api-types.zip';
  a.click();
  URL.revokeObjectURL(url);
  toast.success('Downloaded api-types.zip');
}

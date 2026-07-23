import { useNavigate } from 'react-router-dom';
import { FaCode, FaFingerprint, FaLock, FaQrcode, FaKey, FaPalette, FaClock, FaTerminal, FaSearch, FaExternalLinkAlt } from 'react-icons/fa';
import { UTILITIES } from '../../../../routes/types/routeConstants';

interface Props {
  project: { id: number; name: string; local_path?: string };
}

const TOOLS = [
  { id: 'json-formatter', name: 'JSON Formatter', icon: FaCode, desc: 'Format & validate JSON' },
  { id: 'uuid-generator', name: 'UUID Generator', icon: FaFingerprint, desc: 'Generate unique IDs' },
  { id: 'base64', name: 'Base64', icon: FaLock, desc: 'Encode / decode Base64' },
  { id: 'jwt-decoder', name: 'JWT Decoder', icon: FaKey, desc: 'Decode JWT tokens' },
  { id: 'regex-tester', name: 'Regex Tester', icon: FaSearch, desc: 'Test regular expressions' },
  { id: 'color-picker', name: 'Color Picker', icon: FaPalette, desc: 'Pick & convert colors' },
  { id: 'timestamp-converter', name: 'Timestamp', icon: FaClock, desc: 'Convert timestamps' },
  { id: 'password-generator', name: 'Passwords', icon: FaKey, desc: 'Generate passwords' },
  { id: 'qr-generator', name: 'QR Code', icon: FaQrcode, desc: 'Generate QR codes' },
  { id: 'hash-generator', name: 'Hash', icon: FaTerminal, desc: 'SHA hashes & checksums' },
];

export function UtilitiesTab({ project }: Props) {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-theme-text">Developer Tools</h3>
          <p className="text-xs text-theme-text/40 mt-0.5">Quick-access utilities for {project.name}</p>
        </div>
        <button onClick={() => navigate(UTILITIES)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-theme-icon hover:bg-theme-icon/10 rounded-lg transition-colors">
          All Tools <FaExternalLinkAlt className="w-2.5 h-2.5" />
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
        {TOOLS.map(tool => {
          const Icon = tool.icon;
          return (
            <button key={tool.id} onClick={() => navigate(`${UTILITIES}?tool=${tool.id}`)}
              className="bg-theme-surface border border-theme-border/20 rounded-xl p-3 text-left hover:border-theme-icon/30 hover:bg-theme-icon/5 transition-colors group"
            >
              <div className="w-8 h-8 rounded-lg bg-theme-icon/10 flex items-center justify-center mb-2 group-hover:bg-theme-icon/20 transition-colors">
                <Icon className="w-4 h-4 text-theme-icon" />
              </div>
              <p className="text-xs font-medium text-theme-text truncate">{tool.name}</p>
              <p className="text-[9px] text-theme-text/30 mt-0.5 line-clamp-1">{tool.desc}</p>
            </button>
          );
        })}
      </div>

      {project.local_path && (
        <div className="bg-theme-background border border-theme-border/10 rounded-xl p-3">
          <p className="text-[10px] text-theme-text/30 uppercase tracking-wider mb-1">Project Path</p>
          <p className="text-xs font-mono text-theme-text/60 truncate" title={project.local_path}>{project.local_path}</p>
        </div>
      )}
    </div>
  );
}

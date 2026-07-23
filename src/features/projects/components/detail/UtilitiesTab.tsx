import { useNavigate } from 'react-router-dom';
import { FaCode, FaFingerprint, FaLock, FaQrcode, FaKey, FaPalette, FaClock, FaTerminal, FaSearch, FaExternalLinkAlt, FaDatabase, FaFileCode, FaMarkdown, FaRandom, FaCube, FaGlobe, FaPlug, FaImage, FaCrop, FaFont, FaCodeBranch, FaRuler, FaPaintBrush, FaCog, FaNetworkWired } from 'react-icons/fa';
import { UTILITIES } from '../../../../routes/types/routeConstants';

interface Props {
  project: { id: number; name: string; local_path?: string };
}

const TOOLS = [
  // Formatters
  { id: 'json-formatter', name: 'JSON Formatter', icon: FaCode, desc: 'Format & validate JSON' },
  { id: 'xml-formatter', name: 'XML Formatter', icon: FaFileCode, desc: 'Format XML' },
  { id: 'markdown-preview', name: 'Markdown', icon: FaMarkdown, desc: 'Preview markdown' },
  { id: 'yaml-formatter', name: 'YAML Formatter', icon: FaDatabase, desc: 'Format YAML/JSON' },
  // Generators
  { id: 'uuid-generator', name: 'UUID Generator', icon: FaCube, desc: 'Generate unique IDs' },
  { id: 'nanoid-generator', name: 'Nano ID', icon: FaFingerprint, desc: 'Compact unique IDs' },
  { id: 'password-generator', name: 'Passwords', icon: FaKey, desc: 'Generate passwords' },
  { id: 'lorem-ipsum', name: 'Lorem Ipsum', icon: FaRandom, desc: 'Placeholder text' },
  // Encoders
  { id: 'base64', name: 'Base64', icon: FaLock, desc: 'Encode / decode Base64' },
  { id: 'url-encode', name: 'URL Encode', icon: FaGlobe, desc: 'Encode / decode URLs' },
  { id: 'jwt-decoder', name: 'JWT Decoder', icon: FaKey, desc: 'Decode JWT tokens' },
  // API/Database
  { id: 'api-tester', name: 'API Tester', icon: FaNetworkWired, desc: 'Send HTTP requests' },
  { id: 'graphql-client', name: 'GraphQL', icon: FaPlug, desc: 'Query GraphQL APIs' },
  // Developer
  { id: 'regex-tester', name: 'Regex Tester', icon: FaSearch, desc: 'Test regular expressions' },
  { id: 'color-picker', name: 'Color Picker', icon: FaPalette, desc: 'Pick & convert colors' },
  { id: 'timestamp-converter', name: 'Timestamp', icon: FaClock, desc: 'Convert timestamps' },
  { id: 'hash-generator', name: 'Hash', icon: FaTerminal, desc: 'SHA hashes' },
  { id: 'qr-generator', name: 'QR Code', icon: FaQrcode, desc: 'Generate QR codes' },
  { id: 'diff-viewer', name: 'Diff Viewer', icon: FaCodeBranch, desc: 'Compare text' },
  { id: 'word-counter', name: 'Word Counter', icon: FaRuler, desc: 'Count words/chars' },
  { id: 'resize-image', name: 'Resize Image', icon: FaCrop, desc: 'Resize images' },
  { id: 'gradient-builder', name: 'Gradient', icon: FaPaintBrush, desc: 'CSS gradients' },
  { id: 'env-viewer', name: 'Env Viewer', icon: FaCog, desc: 'Parse .env files' },
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

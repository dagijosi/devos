import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCode, FaLock, FaKey, FaPalette, FaClock, FaTerminal, FaSearch, FaExternalLinkAlt, FaCube, FaCog, FaNetworkWired } from 'react-icons/fa';
import { UTILITIES } from '../../../../routes/types/routeConstants';
import { useUtilitiesStore } from '../../../utilities/store/utilities.store';
import allTools from '../../../utilities/toolDefinitions';

interface Props {
  project: { id: number; name: string; local_path?: string };
}

const FALLBACK_TOOLS = [
  { id: 'json-formatter', icon: FaCode, desc: 'Format & validate JSON' },
  { id: 'base64', icon: FaLock, desc: 'Encode / decode Base64' },
  { id: 'jwt-decoder', icon: FaKey, desc: 'Decode JWT tokens' },
  { id: 'api-tester', icon: FaNetworkWired, desc: 'Send HTTP requests' },
  { id: 'regex-tester', icon: FaSearch, desc: 'Test regular expressions' },
  { id: 'timestamp-converter', icon: FaClock, desc: 'Convert timestamps' },
  { id: 'hash-generator', icon: FaTerminal, desc: 'SHA hashes' },
  { id: 'uuid-generator', icon: FaCube, desc: 'Generate unique IDs' },
  { id: 'color-picker', icon: FaPalette, desc: 'Pick & convert colors' },
  { id: 'env-viewer', icon: FaCog, desc: 'Parse .env files' },
];

export function UtilitiesTab({ project }: Props) {
  const navigate = useNavigate();
  const { favoriteTools } = useUtilitiesStore();

  const displayTools = useMemo(() => {
    if (favoriteTools.length > 0) {
      return favoriteTools.map(id => {
        const def = allTools.find(t => t.id === id);
        if (!def) return null;
        return { id: def.id, name: def.name, icon: def.icon, desc: def.description };
      }).filter(Boolean) as { id: string; name: string; icon: any; desc: string }[];
    }
    return FALLBACK_TOOLS.map(t => {
      const def = allTools.find(d => d.id === t.id);
      return { id: t.id, name: def?.name || t.id, icon: t.icon, desc: t.desc };
    });
  }, [favoriteTools]);

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
        {displayTools.map(tool => {
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

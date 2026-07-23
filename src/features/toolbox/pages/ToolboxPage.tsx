import { useMemo } from 'react';
import { FaWrench } from 'react-icons/fa';
import { useToolboxStore } from '../store/toolbox.store';
import { toolDefinitions, toolCategories } from '../toolDefinitions';
import { ToolSearch } from '../components/ToolSearch';
import { ToolCard } from '../components/ToolCard';
import { ToolShell } from '../components/ToolShell';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { ApiTester } from '../components/tools/ApiTester';
import { JsonFormatter } from '../components/tools/JsonFormatter';
import { JwtDecoder } from '../components/tools/JwtDecoder';
import { Base64Tool } from '../components/tools/Base64Tool';
import { UuidGenerator } from '../components/tools/UuidGenerator';
import { RegexTester } from '../components/tools/RegexTester';
import { TimestampConverter } from '../components/tools/TimestampConverter';
import { ColorPicker } from '../components/tools/ColorPicker';
import { HashGenerator } from '../components/tools/HashGenerator';
import { ImageCompressor } from '../components/tools/ImageCompressor';
import { QrGenerator } from '../components/tools/QrGenerator';
import { PasswordGenerator } from '../components/tools/PasswordGenerator';
import { SqlFormatter } from '../components/tools/SqlFormatter';
import type { ToolCategory } from '../types';

const toolComponents: Record<string, React.ComponentType> = {
  'api-tester': ApiTester,
  'json-formatter': JsonFormatter,
  'jwt-decoder': JwtDecoder,
  'base64': Base64Tool,
  'uuid': UuidGenerator,
  'regex-tester': RegexTester,
  'timestamp': TimestampConverter,
  'color-picker': ColorPicker,
  'hash-generator': HashGenerator,
  'image-compressor': ImageCompressor,
  'qr-generator': QrGenerator,
  'password-generator': PasswordGenerator,
  'sql-formatter': SqlFormatter,
};

function filteredTools(
  tools: typeof toolDefinitions,
  query: string,
  favorites: string[],
  showFavoritesOnly: boolean,
  recentTools: string[]
) {
  let filtered = tools;

  if (showFavoritesOnly) {
    filtered = filtered.filter(t => favorites.includes(t.id));
  }

  if (query.trim()) {
    const q = query.toLowerCase();
    filtered = filtered.filter(t =>
      t.name.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.keywords.some(k => k.toLowerCase().includes(q))
    );
  }

  return filtered;
}

export function ToolboxPage() {
  const { activeTool, searchQuery, favoriteTools, showFavoritesOnly, recentTools, setActiveTool, setSearchQuery, setShowFavoritesOnly } = useToolboxStore();

  useKeyboardShortcuts();

  const visible = useMemo(
    () => filteredTools(toolDefinitions, searchQuery, favoriteTools, showFavoritesOnly, recentTools),
    [searchQuery, favoriteTools, showFavoritesOnly, recentTools]
  );

  if (activeTool) {
    const toolDef = toolDefinitions.find(t => t.id === activeTool);
    const Component = toolComponents[activeTool];
    if (!toolDef || !Component) {
      return (
        <div className="space-y-6">
          <h1 className="text-2xl font-bold text-theme-text">Tool not found</h1>
          <button onClick={() => setActiveTool(null)} className="text-theme-icon hover:underline">Back to toolbox</button>
        </div>
      );
    }
    return (
      <div className="max-w-4xl mx-auto">
        <ToolShell tool={toolDef}>
          <Component />
        </ToolShell>
      </div>
    );
  }

  const recent = recentTools
    .map(id => toolDefinitions.find(t => t.id === id))
    .filter((t): t is (typeof toolDefinitions)[number] => t !== undefined)
    .slice(0, 6);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-theme-text">Toolbox</h1>
        <p className="text-sm text-theme-text/60 mt-1">Developer utilities at your fingertips</p>
      </div>

      <ToolSearch />

      {recent.length > 0 && !searchQuery && !showFavoritesOnly && (
        <section>
          <h2 className="text-sm font-semibold text-theme-text/50 uppercase tracking-wider mb-3">Recent Tools</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {recent.map(tool => (
              <ToolCard key={tool.id} tool={tool} isRecent />
            ))}
          </div>
        </section>
      )}

      {searchQuery || showFavoritesOnly ? (
        <section>
          <h2 className="text-sm font-semibold text-theme-text/50 uppercase tracking-wider mb-3">
            {showFavoritesOnly ? 'Favorites' : `Results (${visible.length})`}
          </h2>
          {visible.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {visible.map(tool => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          ) : (
            <div className="bg-theme-surface border border-theme-border/30 rounded-2xl p-8 text-center">
              <FaWrench className="w-8 h-8 text-theme-text/20 mx-auto mb-3" />
              <p className="text-sm text-theme-text/40">No tools match your search</p>
              <button onClick={() => { setSearchQuery(''); setShowFavoritesOnly(false); }} className="mt-2 text-xs text-theme-icon hover:underline">
                Clear filters
              </button>
            </div>
          )}
        </section>
      ) : (
        toolCategories.map(cat => {
          const catTools = toolDefinitions.filter(t => t.category === cat.id);
          return (
            <section key={cat.id}>
              <h2 className="text-sm font-semibold text-theme-text/50 uppercase tracking-wider mb-3">{cat.label}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {catTools.map(tool => (
                  <ToolCard key={tool.id} tool={tool} />
                ))}
              </div>
            </section>
          );
        })
      )}

      <div className="text-center text-[10px] text-theme-text/20 py-4 border-t border-theme-border/10">
        Ctrl+1-7 for quick access &middot; Ctrl+F to search
      </div>
    </div>
  );
}

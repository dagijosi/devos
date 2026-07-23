import React, { useMemo, type ComponentType } from 'react';
import { UtilitiesSidebar } from '../components/UtilitiesSidebar';
import { ToolGrid } from '../components/ToolGrid';
import { ToolShell } from '../components/ToolShell';
import { useUtilitiesStore } from '../store/utilities.store';
import allTools from '../toolDefinitions';

import { JsonFormatter } from '../components/tools/JsonFormatter';
import { SqlFormatter } from '../components/tools/SqlFormatter';
import { Base64Tool } from '../components/tools/Base64Tool';
import { ColorPicker } from '../components/tools/ColorPicker';
import { HashGenerator } from '../components/tools/HashGenerator';
import { ImageCompressor } from '../components/tools/ImageCompressor';
import { JwtDecoder } from '../components/tools/JwtDecoder';
import { PasswordGenerator } from '../components/tools/PasswordGenerator';
import { QrGenerator } from '../components/tools/QrGenerator';
import { RegexTester } from '../components/tools/RegexTester';
import { TimestampConverter } from '../components/tools/TimestampConverter';
import { UuidGenerator } from '../components/tools/UuidGenerator';
import { ApiTester } from '../components/tools/ApiTester';

const toolComponentMap: Record<string, ComponentType> = {
  'json-formatter': JsonFormatter,
  'sql-formatter': SqlFormatter,
  'base64': Base64Tool,
  'color-picker': ColorPicker,
  'hash-generator': HashGenerator,
  'image-compressor': ImageCompressor,
  'jwt-decoder': JwtDecoder,
  'password-generator': PasswordGenerator,
  'qr-generator': QrGenerator,
  'regex-tester': RegexTester,
  'timestamp-converter': TimestampConverter,
  'uuid-generator': UuidGenerator,
  'api-tester': ApiTester,
};

function Placeholder() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-theme-text/30">
      <p className="text-sm">Coming soon</p>
    </div>
  );
}

export function UtilitiesPage() {
  const { activeTool, setActiveTool, searchQuery, activeCategory, showFavoritesOnly, favoriteTools, recentTools } = useUtilitiesStore();

  const matchedTool = useMemo(() => {
    if (!activeTool) return null;
    return allTools.find((t) => t.id === activeTool) ?? null;
  }, [activeTool]);

  const visibleTools = useMemo(() => {
    let list = [...allTools];
    if (showFavoritesOnly) list = list.filter((t) => favoriteTools.includes(t.id));
    if (activeCategory) list = list.filter((t) => t.category === activeCategory);
    if (searchQuery && searchQuery !== 'recent:') {
      const q = searchQuery.toLowerCase();
      list = list.filter((t) =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.keywords.some((k) => k.includes(q))
      );
    }
    if (searchQuery === 'recent:') {
      const recentSet = new Set(recentTools);
      list = list.filter((t) => recentSet.has(t.id));
      list.sort((a, b) => recentTools.indexOf(a.id) - recentTools.indexOf(b.id));
    }
    return list;
  }, [searchQuery, activeCategory, showFavoritesOnly, favoriteTools, recentTools]);

  if (matchedTool) {
    const Icon = matchedTool.icon;
    const ToolComponent = toolComponentMap[matchedTool.id] || Placeholder;
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <ToolShell
          toolId={matchedTool.id}
          name={matchedTool.name}
          description={matchedTool.description}
          icon={<Icon className="w-5 h-5 text-theme-icon" />}
        >
          <ToolComponent />
        </ToolShell>
      </div>
    );
  }

  return (
    <div className="p-6 flex gap-6 h-full">
      <UtilitiesSidebar />
      <div className="flex-1 min-w-0">
        <ToolGrid tools={visibleTools} favorites={favoriteTools} recent={recentTools} />
      </div>
    </div>
  );
}

import type { ToolCategory } from '../types';
import { CATEGORY_LABELS } from '../types';
import type { ToolDefinition } from '../types';
import { ToolCard } from './ToolCard';
import { useUtilitiesStore } from '../store/utilities.store';

interface Props {
  tools: ToolDefinition[];
  favorites: string[];
  recent: string[];
}

export function ToolGrid({ tools, favorites, recent }: Props) {
  const { activeCategory } = useUtilitiesStore();

  const grouped = tools.reduce<Record<string, ToolDefinition[]>>((acc, tool) => {
    const key = activeCategory || tool.category;
    (acc[key] = acc[key] || []).push(tool);
    return acc;
  }, {});

  if (tools.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-theme-text/30">
        <p className="text-sm">No tools found</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {Object.entries(grouped).map(([cat, catTools]) => (
        <section key={cat}>
          {!activeCategory && (
            <h3 className="text-xs font-medium text-theme-text/40 uppercase tracking-wider mb-3">
              {CATEGORY_LABELS[cat as ToolCategory] || cat}
            </h3>
          )}
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {catTools.map((tool) => (
              <ToolCard
                key={tool.id}
                tool={tool}
                isFavorite={favorites.includes(tool.id)}
                isRecent={recent.includes(tool.id)}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

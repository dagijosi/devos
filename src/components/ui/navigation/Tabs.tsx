import React from 'react';

interface Tab {
  id: string;
  label: string;
  icon?: React.ElementType;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (id: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onTabChange, className = '' }: TabsProps) {
  return (
    <div className={`flex items-center gap-1 p-1 bg-theme-surface rounded-xl border border-theme-border/20 ${className}`}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              isActive
                ? 'bg-theme-icon/15 text-theme-text shadow-sm'
                : 'text-theme-text/40 hover:text-theme-text hover:bg-theme-background/50'
            }`}
          >
            {Icon && <Icon className="w-3 h-3" />}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

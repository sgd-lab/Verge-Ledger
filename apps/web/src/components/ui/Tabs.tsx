import React, { useState, useRef, useId } from 'react';
import { cn } from '../../lib/utils';

export interface TabItem {
  id: string;
  label: string;
  content: React.ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  defaultTab?: string;
  ariaLabel?: string;
  className?: string;
}

export function Tabs({
  tabs,
  defaultTab,
  ariaLabel = 'Content tabs',
  className,
}: TabsProps): React.ReactElement {
  const [activeTab, setActiveTab] = useState<string>(defaultTab || tabs[0]?.id || '');
  const tabListRef = useRef<HTMLDivElement>(null);
  const baseId = useId();

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    let newIndex = index;
    if (e.key === 'ArrowRight') {
      newIndex = (index + 1) % tabs.length;
    } else if (e.key === 'ArrowLeft') {
      newIndex = (index - 1 + tabs.length) % tabs.length;
    } else if (e.key === 'Home') {
      newIndex = 0;
    } else if (e.key === 'End') {
      newIndex = tabs.length - 1;
    } else {
      return;
    }

    e.preventDefault();
    const targetTab = tabs[newIndex];
    if (targetTab) {
      setActiveTab(targetTab.id);
      const buttons = tabListRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
      buttons?.[newIndex]?.focus();
    }
  };

  return (
    <div className={cn('w-full', className)}>
      <div
        ref={tabListRef}
        role="tablist"
        aria-label={ariaLabel}
        className="flex border-b border-slate-200 gap-1 overflow-x-auto"
      >
        {tabs.map((tab, idx) => {
          const isSelected = tab.id === activeTab;
          const tabId = `${baseId}-tab-${tab.id}`;
          const panelId = `${baseId}-panel-${tab.id}`;

          return (
            <button
              key={tab.id}
              role="tab"
              id={tabId}
              aria-selected={isSelected}
              aria-controls={panelId}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => setActiveTab(tab.id)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              className={cn(
                'min-h-[44px] px-4 py-2 text-sm font-semibold whitespace-nowrap transition-colors rounded-t-md border-b-2',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2',
                isSelected
                  ? 'border-emerald-700 text-emerald-900 bg-emerald-50/50'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100',
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      {tabs.map((tab) => {
        const isSelected = tab.id === activeTab;
        const tabId = `${baseId}-tab-${tab.id}`;
        const panelId = `${baseId}-panel-${tab.id}`;

        return (
          <div
            key={tab.id}
            role="tabpanel"
            id={panelId}
            aria-labelledby={tabId}
            tabIndex={0}
            hidden={!isSelected}
            className="pt-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 rounded"
          >
            {isSelected && tab.content}
          </div>
        );
      })}
    </div>
  );
}

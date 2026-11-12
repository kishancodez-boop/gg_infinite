import type { KeyboardEvent, ReactNode } from 'react';
import { useId } from 'react';

export interface TabItem {
  id: string;
  label: string;
  icon?: ReactNode;
  content: ReactNode;
}

export interface TabsProps {
  items: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  ariaLabel?: string;
}

export function Tabs({
  items,
  activeTab,
  onChange,
  ariaLabel = 'Section tabs',
}: TabsProps) {
  const baseId = useId();

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      const next = items[(index + 1) % items.length];
      if (next) onChange(next.id);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      const prev = items[(index - 1 + items.length) % items.length];
      if (prev) onChange(prev.id);
    }
  };

  const currentItem = items.find((item) => item.id === activeTab) ?? items[0];

  return (
    <div className="space-y-4">
      <div
        role="tablist"
        aria-label={ariaLabel}
        className="inline-flex flex-wrap gap-1 p-1 rounded-xl bg-[#F5F8F5] border border-[#DCE6DF]"
      >
        {items.map((item, idx) => {
          const isSelected = item.id === currentItem?.id;
          return (
            <button
              key={item.id}
              id={`${baseId}-tab-${item.id}`}
              role="tab"
              type="button"
              aria-selected={isSelected}
              aria-controls={`${baseId}-panel-${item.id}`}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => onChange(item.id)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                isSelected
                  ? 'bg-white text-[#102A25] shadow-xs border border-[#DCE6DF]'
                  : 'text-[#64736B] hover:text-[#17231F]'
              }`}
            >
              {item.icon && <span aria-hidden="true">{item.icon}</span>}
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {currentItem && (
        <div
          id={`${baseId}-panel-${currentItem.id}`}
          role="tabpanel"
          aria-labelledby={`${baseId}-tab-${currentItem.id}`}
          tabIndex={0}
        >
          {currentItem.content}
        </div>
      )}
    </div>
  );
}


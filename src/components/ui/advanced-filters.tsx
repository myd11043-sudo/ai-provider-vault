'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, X, ArrowUpDown, Filter } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

export interface FilterOption {
  value: string;
  label: string;
  color?: string;
  textColor?: string;
}

export interface FilterConfig {
  key: string;
  label: string;
  options: FilterOption[];
  multiple?: boolean;
}

export interface SortOption {
  value: string;
  label: string;
}

export interface FilterState {
  [key: string]: string | string[];
}

interface AdvancedFiltersProps {
  filters?: FilterConfig[];
  sortOptions?: SortOption[];
  filterState: FilterState;
  sortValue?: string;
  onFilterChange: (key: string, value: string | string[]) => void;
  onSortChange?: (value: string) => void;
  onClearFilters?: () => void;
}

const Dropdown = ({
  trigger,
  children,
  align = 'left',
}: {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: 'left' | 'right';
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <div onClick={() => setOpen(!open)}>{trigger}</div>
      {open && (
        <div
          className={cn(
            'absolute top-full z-50 mt-1 min-w-[180px] rounded-md border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-800 dark:bg-zinc-900',
            align === 'right' ? 'right-0' : 'left-0'
          )}
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  );
};

const FilterDropdown = ({
  config,
  value,
  onChange,
}: {
  config: FilterConfig;
  value: string | string[];
  onChange: (value: string | string[]) => void;
}) => {
  const selectedValues = Array.isArray(value) ? value : value ? [value] : [];
  const hasSelection = selectedValues.length > 0;

  const getSelectedLabel = () => {
    if (!hasSelection) return config.label;
    if (selectedValues.length === 1) {
      const option = config.options.find((o) => o.value === selectedValues[0]);
      return option?.label || config.label;
    }
    return `${selectedValues.length} selected`;
  };

  const handleSelect = (optionValue: string) => {
    if (config.multiple) {
      const newValues = selectedValues.includes(optionValue)
        ? selectedValues.filter((v) => v !== optionValue)
        : [...selectedValues, optionValue];
      onChange(newValues);
    } else {
      onChange(optionValue === value ? '' : optionValue);
    }
  };

  return (
    <Dropdown
      trigger={
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'gap-1',
            hasSelection && 'border-zinc-400 dark:border-zinc-600'
          )}
        >
          <Filter className="h-3.5 w-3.5" />
          {getSelectedLabel()}
          <ChevronDown className="h-3.5 w-3.5" />
        </Button>
      }
    >
      <div onClick={(e) => e.stopPropagation()}>
        {config.options.map((option) => {
          const isSelected = selectedValues.includes(option.value);
          return (
            <button
              key={option.value}
              onClick={() => handleSelect(option.value)}
              className={cn(
                'flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800',
                isSelected && 'bg-zinc-100 dark:bg-zinc-800'
              )}
            >
              {config.multiple && (
                <span
                  className={cn(
                    'flex h-4 w-4 items-center justify-center rounded border',
                    isSelected
                      ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900'
                      : 'border-zinc-300 dark:border-zinc-700'
                  )}
                >
                  {isSelected && (
                    <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none">
                      <path
                        d="M2 6l3 3 5-5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </span>
              )}
              {option.color && (
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: option.color }}
                />
              )}
              <span>{option.label}</span>
              {!config.multiple && isSelected && (
                <svg
                  className="ml-auto h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
          );
        })}
      </div>
    </Dropdown>
  );
};

const SortDropdown = ({
  options,
  value,
  onChange,
}: {
  options: SortOption[];
  value: string;
  onChange: (value: string) => void;
}) => {
  const selectedOption = options.find((o) => o.value === value);

  return (
    <Dropdown
      trigger={
        <Button variant="outline" size="sm" className="gap-1">
          <ArrowUpDown className="h-3.5 w-3.5" />
          {selectedOption?.label || 'Sort'}
          <ChevronDown className="h-3.5 w-3.5" />
        </Button>
      }
      align="right"
    >
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            'flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800',
            option.value === value && 'bg-zinc-100 dark:bg-zinc-800'
          )}
        >
          <span>{option.label}</span>
          {option.value === value && (
            <svg
              className="ml-auto h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </button>
      ))}
    </Dropdown>
  );
};

export const AdvancedFilters = ({
  filters = [],
  sortOptions = [],
  filterState,
  sortValue,
  onFilterChange,
  onSortChange,
  onClearFilters,
}: AdvancedFiltersProps) => {
  // Calculate active filters for pills
  const activeFilters: { key: string; label: string; value: string; optionLabel: string; color?: string }[] = [];

  filters.forEach((filter) => {
    const value = filterState[filter.key];
    if (!value || (Array.isArray(value) && value.length === 0)) return;

    const values = Array.isArray(value) ? value : [value];
    values.forEach((v) => {
      const option = filter.options.find((o) => o.value === v);
      if (option) {
        activeFilters.push({
          key: filter.key,
          label: filter.label,
          value: v,
          optionLabel: option.label,
          color: option.color,
        });
      }
    });
  });

  const handleRemoveFilter = (key: string, value: string) => {
    const currentValue = filterState[key];
    if (Array.isArray(currentValue)) {
      onFilterChange(key, currentValue.filter((v) => v !== value));
    } else {
      onFilterChange(key, '');
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {filters.map((filter) => (
          <FilterDropdown
            key={filter.key}
            config={filter}
            value={filterState[filter.key] || (filter.multiple ? [] : '')}
            onChange={(value) => onFilterChange(filter.key, value)}
          />
        ))}
        {sortOptions.length > 0 && onSortChange && sortValue && (
          <SortDropdown
            options={sortOptions}
            value={sortValue}
            onChange={onSortChange}
          />
        )}
      </div>

      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {activeFilters.map((filter) => (
            <span
              key={`${filter.key}-${filter.value}`}
              className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium dark:bg-zinc-800"
            >
              {filter.color && (
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: filter.color }}
                />
              )}
              <span className="text-zinc-500 dark:text-zinc-400">{filter.label}:</span>
              <span>{filter.optionLabel}</span>
              <button
                onClick={() => handleRemoveFilter(filter.key, filter.value)}
                className="ml-0.5 rounded-full p-0.5 hover:bg-zinc-200 dark:hover:bg-zinc-700"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          {onClearFilters && (
            <button
              onClick={onClearFilters}
              className="text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            >
              Clear all
            </button>
          )}
        </div>
      )}
    </div>
  );
};

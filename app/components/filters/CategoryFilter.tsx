'use client';

import { MultiSelectDimension } from '../../types';
import { CATEGORIES, CATEGORY_COLORS } from '../../constants';
import { getCategoryDisplayName, getSectionHeader } from '../../utils';

interface CategoryFilterProps {
  selectedCategories: string[];
  multiSelectDimension: MultiSelectDimension;
  onToggleCategory: (category: string) => void;
  onReset: () => void;
}

export const CategoryFilter = ({
  selectedCategories,
  multiSelectDimension,
  onToggleCategory,
  onReset
}: CategoryFilterProps) => {
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 mb-2">
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
          {getSectionHeader('categories').title}
        </h2>
        {multiSelectDimension === 'categories' && (
          <span className="text-xs font-medium bg-blue-600/30 text-blue-300 px-2 py-0.5 rounded-full">
            Comparing
          </span>
        )}
        <button
          onClick={onReset}
          className="ml-auto text-sm text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
          title="Reset to default"
        >
          Reset
        </button>
      </div>
      <div className="space-y-1.5 flex-1 overflow-y-auto pr-1 scrollbar-thin">
        {CATEGORIES.map((category) => {
          const isSelected = selectedCategories.includes(category);

          return (
            <label
              key={category}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all duration-200 ${
                isSelected
                  ? 'bg-blue-600/20 border border-blue-500/30'
                  : 'bg-slate-700/30 border border-transparent hover:bg-slate-700/50'
              }`}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onToggleCategory(category)}
                className="sr-only"
              />
              <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-colors ${
                isSelected
                  ? 'bg-blue-500'
                  : 'bg-slate-600/50 border border-slate-500'
              }`}>
                {isSelected && (
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className="text-sm text-slate-300 leading-tight truncate">{getCategoryDisplayName(category)}</span>
              {isSelected && multiSelectDimension === 'categories' && (
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0 ml-auto"
                  style={{ backgroundColor: (CATEGORY_COLORS as Record<string, string>)[category] }}
                ></span>
              )}
            </label>
          );
        })}
      </div>
    </div>
  );
};

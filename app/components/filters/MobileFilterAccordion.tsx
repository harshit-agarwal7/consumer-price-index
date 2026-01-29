'use client';

import { ReactNode } from 'react';
import { MultiSelectDimension } from '../../types';

interface FilterSection {
  id: string;
  title: string;
  dimension: 'states' | 'categories' | 'sectors' | 'dateRange';
  content: ReactNode;
}

interface MobileFilterAccordionProps {
  sections: FilterSection[];
  expandedId: string | null;
  onToggle: (id: string) => void;
  multiSelectDimension: MultiSelectDimension;
}

const DIMENSION_COLORS: Record<string, { bg: string; text: string }> = {
  states: { bg: 'bg-cyan-600/30', text: 'text-cyan-300' },
  categories: { bg: 'bg-blue-600/30', text: 'text-blue-300' },
  sectors: { bg: 'bg-green-600/30', text: 'text-green-300' },
};

export const MobileFilterAccordion = ({
  sections,
  expandedId,
  onToggle,
  multiSelectDimension
}: MobileFilterAccordionProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
      {/* Helper message for mobile users - spans full width */}
      <p className="col-span-1 sm:col-span-2 text-xs text-slate-400 pb-3 border-b border-slate-700/50">
        Tap on a dimension below to see options and view the Consumer Price Index along that dimension.
      </p>
      {sections.map((section, index) => {
        const isExpanded = expandedId === section.id;
        const isComparing = multiSelectDimension === section.dimension;
        const colors = DIMENSION_COLORS[section.dimension];
        const isLastRow = index >= sections.length - 2;

        return (
          <div key={section.id} className={`border-b border-slate-700/50 ${isLastRow ? 'sm:border-b-0' : ''} last:border-b-0`}>
            {/* Clickable Header */}
            <button
              onClick={() => onToggle(section.id)}
              className="flex items-center justify-between w-full py-3 cursor-pointer"
              aria-expanded={isExpanded}
              aria-controls={`filter-content-${section.id}`}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
                  {section.title}
                </span>
                {isComparing && colors && (
                  <span className={`text-xs font-medium ${colors.bg} ${colors.text} px-2 py-0.5 rounded-full`}>
                    Comparing
                  </span>
                )}
              </div>

              <svg
                className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${
                  isExpanded ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Collapsible Content with grid animation for smooth height transitions */}
            <div
              id={`filter-content-${section.id}`}
              className="grid transition-all duration-200 ease-in-out"
              style={{ gridTemplateRows: isExpanded ? '1fr' : '0fr' }}
            >
              <div className="overflow-hidden">
                <div className="pb-3">
                  {section.content}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

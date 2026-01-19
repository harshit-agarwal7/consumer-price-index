'use client';

import { useRef } from 'react';
import { MultiSelectDimension } from '../../types';
import { STATE_COLORS } from '../../constants';
import { getStateDisplayName, getSectionHeader } from '../../utils';

interface StateFilterProps {
  states: string[];
  selectedStates: string[];
  multiSelectDimension: MultiSelectDimension;
  stateSearch: string;
  onStateSearchChange: (search: string) => void;
  onToggleState: (state: string) => void;
  onReset: () => void;
}

export const StateFilter = ({
  states,
  selectedStates,
  multiSelectDimension,
  stateSearch,
  onStateSearchChange,
  onToggleState,
  onReset
}: StateFilterProps) => {
  const stateDropdownRef = useRef<HTMLDivElement>(null);

  const filteredStates = states.filter(state =>
    state.toLowerCase().includes(stateSearch.toLowerCase())
  );

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 mb-2">
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
          {getSectionHeader('states').title}
        </h2>
        {multiSelectDimension === 'states' && (
          <span className="text-xs font-medium bg-cyan-600/30 text-cyan-300 px-2 py-0.5 rounded-full">
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

      <div ref={stateDropdownRef}>
        <input
          type="text"
          value={stateSearch}
          onChange={(e) => onStateSearchChange(e.target.value)}
          placeholder="Search states..."
          className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-sm mb-2"
        />
      </div>

      <div className="space-y-1.5 max-h-[248px] overflow-y-auto pr-1 scrollbar-thin">
        {filteredStates
          .sort((a, b) => {
            if (a === 'ALL India') return -1;
            if (b === 'ALL India') return 1;
            return a.localeCompare(b);
          })
          .map((state) => {
            const stateIndex = states.indexOf(state);
            const isSelected = selectedStates.includes(state);

            return (
              <div
                key={state}
                onClick={() => onToggleState(state)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all duration-200 select-none ${
                  isSelected
                    ? 'bg-cyan-600/20 border border-cyan-500/30'
                    : 'bg-slate-700/30 border border-transparent hover:bg-slate-700/50'
                }`}
              >
                <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-colors ${
                  isSelected
                    ? 'bg-cyan-500'
                    : 'bg-slate-600/50 border border-slate-500'
                }`}>
                  {isSelected && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className="text-sm text-slate-300 leading-tight truncate">{getStateDisplayName(state)}</span>
                {multiSelectDimension === 'states' && (
                  <span
                    className={`w-3 h-3 rounded-full flex-shrink-0 ml-auto ${isSelected ? '' : 'opacity-30'}`}
                    style={{ backgroundColor: STATE_COLORS[stateIndex % STATE_COLORS.length] }}
                  ></span>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
};

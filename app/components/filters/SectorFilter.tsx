'use client';

import { MultiSelectDimension } from '../../types';
import { SECTORS, SECTOR_COLORS } from '../../constants';
import { getSectionHeader } from '../../utils';

interface SectorFilterProps {
  selectedSectors: string[];
  multiSelectDimension: MultiSelectDimension;
  onToggleSector: (sector: string) => void;
  onReset: () => void;
}

export const SectorFilter = ({
  selectedSectors,
  multiSelectDimension,
  onToggleSector,
  onReset
}: SectorFilterProps) => {
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 mb-2">
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
          {getSectionHeader('sectors').title}
        </h2>
        {multiSelectDimension === 'sectors' && (
          <span className="text-xs font-medium bg-green-600/30 text-green-300 px-2 py-0.5 rounded-full">
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
      <div className="space-y-2">
        {SECTORS.map((sector) => {
          const isSelected = selectedSectors.includes(sector);

          return (
            <label
              key={sector}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 ${
                isSelected
                  ? 'bg-green-600/20 border border-green-500/30'
                  : 'bg-slate-700/30 border border-transparent hover:bg-slate-700/50'
              }`}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onToggleSector(sector)}
                className="sr-only"
              />
              <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-colors ${
                isSelected
                  ? 'bg-green-500'
                  : 'bg-slate-600/50 border border-slate-500'
              }`}>
                {isSelected && (
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className="text-sm font-medium text-slate-300">{sector}</span>
              {isSelected && multiSelectDimension === 'sectors' && (
                <span
                  className="w-3 h-3 rounded-full ml-auto"
                  style={{ backgroundColor: SECTOR_COLORS[sector] }}
                ></span>
              )}
            </label>
          );
        })}
      </div>
    </div>
  );
};

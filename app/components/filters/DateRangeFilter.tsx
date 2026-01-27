'use client';

import { AVAILABLE_MONTHS } from '../../constants';
import { isEndMonthDisabled, isEndYearDisabled } from '../../utils';

interface DateRangeFilterProps {
  startMonth: string;
  startYear: string;
  endMonth: string;
  endYear: string;
  availableYears: string[];
  onStartMonthChange: (month: string) => void;
  onStartYearChange: (year: string) => void;
  onEndMonthChange: (month: string) => void;
  onEndYearChange: (year: string) => void;
  onReset: () => void;
  hideHeader?: boolean;
}

export const DateRangeFilter = ({
  startMonth,
  startYear,
  endMonth,
  endYear,
  availableYears,
  onStartMonthChange,
  onStartYearChange,
  onEndMonthChange,
  onEndYearChange,
  onReset,
  hideHeader = false
}: DateRangeFilterProps) => {
  return (
    <div className="space-y-2">
      {!hideHeader && (
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
            Date Range
          </h2>
          <button
            onClick={onReset}
            className="ml-auto text-sm text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
            title="Reset to full range"
          >
            Reset
          </button>
        </div>
      )}
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">
            From
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div className="relative">
              <button
                onClick={(e) => {
                  const select = e.currentTarget.nextElementSibling as HTMLSelectElement;
                  select?.click();
                }}
                className="w-full px-3 py-2.5 pr-8 bg-slate-700/50 border border-slate-600/50 rounded-xl text-slate-200 text-sm text-left focus:outline-none focus:ring-2 focus:ring-purple-500/50 cursor-pointer hover:bg-slate-700 transition-all duration-200"
              >
                {startMonth ? startMonth.slice(0, 3) : 'Month'}
              </button>
              <select
                value={startMonth}
                onChange={(e) => onStartMonthChange(e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer w-full"
              >
                {AVAILABLE_MONTHS.map(month => (
                  <option key={month} value={month}>
                    {month.slice(0, 3)}
                  </option>
                ))}
              </select>
              <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            <div className="relative">
              <button
                onClick={(e) => {
                  const select = e.currentTarget.nextElementSibling as HTMLSelectElement;
                  select?.click();
                }}
                className="w-full px-3 py-2.5 pr-8 bg-slate-700/50 border border-slate-600/50 rounded-xl text-slate-200 text-sm text-left focus:outline-none focus:ring-2 focus:ring-purple-500/50 cursor-pointer hover:bg-slate-700 transition-all duration-200"
              >
                {startYear || 'Year'}
              </button>
              <select
                value={startYear}
                onChange={(e) => onStartYearChange(e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer w-full"
              >
                {availableYears.map(year => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">
            To
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div className="relative">
              <button
                onClick={(e) => {
                  const select = e.currentTarget.nextElementSibling as HTMLSelectElement;
                  select?.click();
                }}
                className="w-full px-3 py-2.5 pr-8 bg-slate-700/50 border border-slate-600/50 rounded-xl text-slate-200 text-sm text-left focus:outline-none focus:ring-2 focus:ring-purple-500/50 cursor-pointer hover:bg-slate-700 transition-all duration-200"
              >
                {endMonth ? endMonth.slice(0, 3) : 'Month'}
              </button>
              <select
                value={endMonth}
                onChange={(e) => onEndMonthChange(e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer w-full"
              >
                {AVAILABLE_MONTHS.map(month => (
                  <option
                    key={month}
                    value={month}
                    disabled={isEndMonthDisabled(month, startYear, endYear, startMonth)}
                  >
                    {month.slice(0, 3)}
                  </option>
                ))}
              </select>
              <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            <div className="relative">
              <button
                onClick={(e) => {
                  const select = e.currentTarget.nextElementSibling as HTMLSelectElement;
                  select?.click();
                }}
                className="w-full px-3 py-2.5 pr-8 bg-slate-700/50 border border-slate-600/50 rounded-xl text-slate-200 text-sm text-left focus:outline-none focus:ring-2 focus:ring-purple-500/50 cursor-pointer hover:bg-slate-700 transition-all duration-200"
              >
                {endYear || 'Year'}
              </button>
              <select
                value={endYear}
                onChange={(e) => onEndYearChange(e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer w-full"
              >
                {availableYears.map(year => (
                  <option
                    key={year}
                    value={year}
                    disabled={isEndYearDisabled(year, startYear)}
                  >
                    {year}
                  </option>
                ))}
              </select>
              <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

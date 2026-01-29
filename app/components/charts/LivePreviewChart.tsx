'use client';

import { RefObject, useState, useEffect, useRef } from 'react';
import { LineChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DateRange, MultiSelectDimension, Selections } from '../../types';
import { CustomTooltip } from '../CustomTooltip';
import { renderChartLines } from './ChartLines';
import { generateChartTitle } from '../../utils';

interface LivePreviewChartProps {
  chartData: any[];
  hasNoData: boolean;
  housingWarning: string | null;
  selections: Selections;
  multiSelectDimension: MultiSelectDimension;
  allStates: string[];
  dateRange: DateRange;
  editingChartId: string | null;
  chartPreviewRef: RefObject<HTMLDivElement | null>;
  onAddChart: () => void;
  onSaveChanges: () => void;
  onCancelEditing: () => void;
}

export const LivePreviewChart = ({
  chartData,
  hasNoData,
  housingWarning,
  selections,
  multiSelectDimension,
  allStates,
  dateRange,
  editingChartId,
  chartPreviewRef,
  onAddChart,
  onSaveChanges,
  onCancelEditing
}: LivePreviewChartProps) => {
  // Calculate aspect ratio based on actual container dimensions
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [aspectRatio, setAspectRatio] = useState(1.7);

  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container) return;

    const calculateAspectRatio = () => {
      const { width, height } = container.getBoundingClientRect();
      // Reserve space for the caption below the chart (~30px)
      const availableHeight = height - 30;

      if (width <= 0 || availableHeight <= 0) return;

      const minAspect = 1.1;
      const maxAspect = 1.7;

      // Calculate natural aspect ratio from available space
      const naturalAspect = width / availableHeight;

      // Clamp between bounds
      const clampedAspect = Math.max(minAspect, Math.min(maxAspect, naturalAspect));
      setAspectRatio(clampedAspect);
    };

    const resizeObserver = new ResizeObserver(calculateAspectRatio);
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, []);

  return (
    <div ref={chartPreviewRef} className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-4 md:p-5 shadow-xl flex-1 min-w-0 flex flex-col">
      <div className="flex items-center justify-between mb-4 md:mb-6 gap-2">
        <h2 className="text-lg md:text-xl font-semibold text-slate-200">
          {editingChartId ? 'Editing Chart' : 'Live Preview'}
        </h2>
        <div className="flex gap-2">
          {editingChartId ? (
            <>
              <button
                onClick={onSaveChanges}
                className="px-3 py-1.5 md:px-4 md:py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-medium rounded-lg transition-colors duration-200 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="hidden sm:inline">Save Changes</span>
                <span className="sm:hidden">Save</span>
              </button>
              <button
                onClick={onCancelEditing}
                className="px-3 py-1.5 md:px-4 md:py-2 bg-slate-600 hover:bg-slate-500 text-white text-sm font-medium rounded-lg transition-colors duration-200"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={onAddChart}
              className="px-3 py-1.5 md:px-4 md:py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors duration-200 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">Add to Board</span>
              <span className="sm:hidden">Add</span>
            </button>
          )}
        </div>
      </div>

      <div ref={chartContainerRef} className="flex-1 flex flex-col justify-center">
        {hasNoData || housingWarning ? (
          <div className="flex items-center justify-center aspect-[16/10] max-w-4xl mx-auto w-full">
            <div className="text-center px-4 max-w-md">
              <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${housingWarning ? 'bg-amber-600/20' : 'bg-slate-700/50'}`}>
                {housingWarning ? (
                  <svg className="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                )}
              </div>
              <p className={`text-sm md:text-base ${housingWarning ? 'text-amber-300' : 'text-slate-400'}`}>
                {housingWarning || 'There is no data published for the selected state and category during this time period.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto w-full">
            <ResponsiveContainer width="100%" aspect={aspectRatio}>
              <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  stroke="#475569"
                  tickLine={{ stroke: '#475569' }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  stroke="#475569"
                  tickLine={{ stroke: '#475569' }}
                  domain={[100, 'dataMax + 10']}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ paddingTop: '20px' }}
                  formatter={(value) => <span className="text-slate-300 text-sm md:text-sm">{value}</span>}
                />
                {renderChartLines({
                  selections,
                  dimension: multiSelectDimension,
                  allStates
                })}
              </LineChart>
            </ResponsiveContainer>
            <p className="text-sm text-slate-400 text-center mt-2">
              {generateChartTitle(selections, multiSelectDimension, dateRange)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

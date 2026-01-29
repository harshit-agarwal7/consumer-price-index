/**
 * ChartBoard.tsx
 *
 * Renders the dashboard section that displays
 * user-created CPI charts and handles chart-level actions
 * such as edit, duplicate, and delete.
 */

'use client';

import { LineChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartDefinition, CPIData } from '../../types';
import { CustomTooltip } from '../CustomTooltip';
import { renderChartLines } from './ChartLines';
import { generateChartData, getHousingDataWarning } from '../../utils';

interface ChartBoardProps {
  chartBoard: ChartDefinition[];
  cpiData: CPIData[];
  allStates: string[];
  editingChartId: string | null;
  isMobile: boolean;
  onEditChart: (chart: ChartDefinition) => void;
  onDuplicateChart: (chart: ChartDefinition) => void;
  onRemoveChart: (chartId: string) => void;
}

export const ChartBoard = ({
  chartBoard,
  cpiData,
  allStates,
  editingChartId,
  isMobile,
  onEditChart,
  onDuplicateChart,
  onRemoveChart
}: ChartBoardProps) => {
  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-4 md:p-6 shadow-xl">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 md:mb-6 gap-2">
        <div>
          <h2 className="text-lg md:text-xl font-semibold text-slate-200">Chart Board</h2>
          <p className="text-sm text-slate-500 mt-1">
            {chartBoard.length === 0
              ? 'Add charts to compare multiple views side by side'
              : `${chartBoard.length} chart${chartBoard.length !== 1 ? 's' : ''} on board`}
          </p>
        </div>
        {chartBoard.length >= 6 && (
          <p className="text-sm text-amber-400 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Too many charts may reduce readability
          </p>
        )}
      </div>

      {chartBoard.length === 0 ? (
        <div className="flex items-center justify-center h-64 border-2 border-dashed border-slate-700 rounded-xl">
          <div className="text-center px-4">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-700/50 flex items-center justify-center">
              <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
            </div>
            <p className="text-slate-400 text-sm md:text-base mb-2">
              Build a chart using the filters above and click &apos;Add to Board&apos; to compare multiple views.
            </p>
            <p className="text-slate-500 text-sm">
              Charts will be saved and persist across page reloads.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {chartBoard.map(chart => {
            const chartResult = generateChartData(cpiData, chart.selections, chart.dateRange);
            const chartHousingWarning = getHousingDataWarning(chart.selections);

            return (
              <div
                key={chart.id}
                data-chart-id={chart.id}
                className={`bg-slate-900/50 rounded-xl border p-4 ${
                  editingChartId === chart.id
                    ? 'border-blue-500/50 ring-2 ring-blue-500/20'
                    : 'border-slate-700/50'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-slate-200 truncate">{chart.title}</h3>
                  </div>

                  <div className="flex items-center gap-1 ml-2">
                    <button
                      onClick={() => onEditChart(chart)}
                      className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-700/50 rounded-lg transition-colors cursor-pointer"
                      title="Edit"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => onDuplicateChart(chart)}
                      className="p-1.5 text-slate-400 hover:text-green-400 hover:bg-slate-700/50 rounded-lg transition-colors cursor-pointer"
                      title="Duplicate"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => onRemoveChart(chart.id)}
                      className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700/50 rounded-lg transition-colors cursor-pointer"
                      title="Remove"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                {chartResult.hasNoData || chartHousingWarning ? (
                  <div className="flex items-center justify-center aspect-[16/9] bg-slate-800/30 rounded-lg">
                    <p className={`text-sm text-center px-4 ${chartHousingWarning ? 'text-amber-400' : 'text-slate-500'}`}>
                      {chartHousingWarning || 'No data available'}
                    </p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" aspect={isMobile ? 1.1 : 1.7}>
                    <LineChart data={chartResult.chartData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 9, fill: '#94a3b8' }}
                        stroke="#475569"
                        tickLine={{ stroke: '#475569' }}
                      />
                      <YAxis
                        tick={{ fontSize: 9, fill: '#94a3b8' }}
                        stroke="#475569"
                        tickLine={{ stroke: '#475569' }}
                        domain={[100, 'dataMax + 10']}
                      />
                      <Tooltip content={<CustomTooltip small />} />
                      <Legend
                        wrapperStyle={{ paddingTop: '10px', left: '0px' }}
                        formatter={(value) => <span className="text-slate-300 text-sm">{value}</span>}
                      />
                      {renderChartLines({
                        selections: chart.selections,
                        dimension: chart.multiSelectDimension,
                        allStates
                      })}
                    </LineChart>
                  </ResponsiveContainer>
                )}
                <h3 className="text-sm text-slate-400 truncate text-center">{chart.title}</h3>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

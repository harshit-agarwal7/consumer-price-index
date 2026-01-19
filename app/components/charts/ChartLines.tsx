'use client';

import { ReactElement } from 'react';
import { Line } from 'recharts';
import { MultiSelectDimension } from '../../types';
import { STATE_COLORS, CATEGORY_COLORS, SECTOR_COLORS } from '../../constants';
import { getStateDisplayName, getCategoryDisplayName } from '../../utils';

interface RenderChartLinesProps {
  chartStates: string[];
  chartCategories: string[];
  chartSectors: string[];
  dimension: MultiSelectDimension;
  allStates: string[];
}

export const renderChartLines = ({
  chartStates,
  chartCategories,
  chartSectors,
  dimension,
  allStates
}: RenderChartLinesProps): ReactElement[] => {
  const lines: ReactElement[] = [];

  if (dimension === 'states') {
    chartStates.forEach((state) => {
      const stateIndex = allStates.indexOf(state);
      const colorIndex = stateIndex >= 0 ? stateIndex : chartStates.indexOf(state);
      const key = `${state}_${chartSectors[0]}_${chartCategories[0]}`;
      lines.push(
        <Line
          key={key}
          type="monotone"
          dataKey={key}
          name={getStateDisplayName(state)}
          stroke={STATE_COLORS[colorIndex % STATE_COLORS.length]}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 5, strokeWidth: 0 }}
          connectNulls
        />
      );
    });
  } else if (dimension === 'categories') {
    chartCategories.forEach(category => {
      const key = `${chartStates[0]}_${chartSectors[0]}_${category}`;
      lines.push(
        <Line
          key={key}
          type="monotone"
          dataKey={key}
          name={category}
          stroke={CATEGORY_COLORS[category] || '#8b5cf6'}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 5, strokeWidth: 0 }}
          connectNulls
        />
      );
    });
  } else if (dimension === 'sectors') {
    chartSectors.forEach(sector => {
      const key = `${chartStates[0]}_${sector}_${chartCategories[0]}`;
      lines.push(
        <Line
          key={key}
          type="monotone"
          dataKey={key}
          name={sector}
          stroke={SECTOR_COLORS[sector]}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 5, strokeWidth: 0 }}
          connectNulls
        />
      );
    });
  } else {
    const key = `${chartStates[0]}_${chartSectors[0]}_${chartCategories[0]}`;
    lines.push(
      <Line
        key={key}
        type="monotone"
        dataKey={key}
        name={`${getStateDisplayName(chartStates[0])} - ${getCategoryDisplayName(chartCategories[0])} - ${chartSectors[0]}`}
        stroke={CATEGORY_COLORS[chartCategories[0]] || '#8b5cf6'}
        strokeWidth={2}
        dot={false}
        activeDot={{ r: 5, strokeWidth: 0 }}
        connectNulls
      />
    );
  }

  return lines;
};

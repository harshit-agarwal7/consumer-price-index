'use client';

import { ReactElement } from 'react';
import { Line } from 'recharts';
import { MultiSelectDimension, Selections } from '../../types';
import { STATE_COLORS, CATEGORY_COLORS, SECTOR_COLORS } from '../../constants';

const getCategoryColor = (category: string): string => {
  return (CATEGORY_COLORS as Record<string, string>)[category] || '#8b5cf6';
};

const getSectorColor = (sector: string): string => {
  return (SECTOR_COLORS as Record<string, string>)[sector] || '#3b82f6';
};
import { getStateDisplayName, getCategoryDisplayName } from '../../utils';

interface RenderChartLinesProps {
  selections: Selections;
  dimension: MultiSelectDimension;
  allStates: string[];
}

export const renderChartLines = ({
  selections,
  dimension,
  allStates
}: RenderChartLinesProps): ReactElement[] => {
  const { states, categories, sectors } = selections;
  const lines: ReactElement[] = [];

  if (dimension === 'states') {
    states.forEach((state) => {
      const stateIndex = allStates.indexOf(state);
      const colorIndex = stateIndex >= 0 ? stateIndex : states.indexOf(state);
      const key = `${state}_${sectors[0]}_${categories[0]}`;
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
    categories.forEach(category => {
      const key = `${states[0]}_${sectors[0]}_${category}`;
      lines.push(
        <Line
          key={key}
          type="monotone"
          dataKey={key}
          name={category}
          stroke={getCategoryColor(category)}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 5, strokeWidth: 0 }}
          connectNulls
        />
      );
    });
  } else if (dimension === 'sectors') {
    sectors.forEach(sector => {
      const key = `${states[0]}_${sector}_${categories[0]}`;
      lines.push(
        <Line
          key={key}
          type="monotone"
          dataKey={key}
          name={sector}
          stroke={getSectorColor(sector)}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 5, strokeWidth: 0 }}
          connectNulls
        />
      );
    });
  } else {
    const key = `${states[0]}_${sectors[0]}_${categories[0]}`;
    lines.push(
      <Line
        key={key}
        type="monotone"
        dataKey={key}
        name={`${getStateDisplayName(states[0])} - ${getCategoryDisplayName(categories[0])} - ${sectors[0]}`}
        stroke={getCategoryColor(categories[0])}
        strokeWidth={2}
        dot={false}
        activeDot={{ r: 5, strokeWidth: 0 }}
        connectNulls
      />
    );
  }

  return lines;
};

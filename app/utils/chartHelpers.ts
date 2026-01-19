import { CPIData, ChartDataResult, MultiSelectDimension } from '../types';
import { SECTOR_MAP } from '../constants';
import { monthToNumber, formatDate } from './dateHelpers';
import { getStateDisplayName, getCategoryDisplayName } from './displayHelpers';

export const generateChartData = (
  data: CPIData[],
  chartStates: string[],
  chartCategories: string[],
  chartSectors: string[],
  chartStartMonth: string,
  chartStartYear: string,
  chartEndMonth: string,
  chartEndYear: string
): ChartDataResult => {
  if (data.length === 0 || chartCategories.length === 0 || chartSectors.length === 0 || chartStates.length === 0) {
    return { chartData: [], hasNoData: true };
  }

  const normalizedStart = chartStartYear && chartStartMonth
    ? `${chartStartYear}-${monthToNumber(chartStartMonth)}`
    : null;
  const normalizedEnd = chartEndYear && chartEndMonth
    ? `${chartEndYear}-${monthToNumber(chartEndMonth)}`
    : null;

  const filteredData = data.filter(row => {
    const dateKey = `${row.Year}-${monthToNumber(row.Month)}`;
    const inDateRange = (!normalizedStart || dateKey >= normalizedStart) &&
                        (!normalizedEnd || dateKey <= normalizedEnd);
    return chartStates.includes(row.State) &&
           chartCategories.includes(row.Description) &&
           inDateRange;
  });

  const transformed = filteredData.reduce((acc: any[], row) => {
    const sortKey = `${row.Year}-${monthToNumber(row.Month)}`;
    const displayDate = formatDate(row.Year, row.Month);

    let dateEntry = acc.find(item => item.sortKey === sortKey);

    if (!dateEntry) {
      dateEntry = { date: displayDate, sortKey };
      acc.push(dateEntry);
    }

    chartSectors.forEach(sector => {
      chartCategories.forEach(category => {
        chartStates.forEach(state => {
          if (row.State === state && row.Description === category) {
            const dataColumn = SECTOR_MAP[sector];
            const value = row[dataColumn as keyof CPIData];
            if (value && value !== '' && !isNaN(parseFloat(value))) {
              const key = `${state}_${sector}_${category}`;
              dateEntry[key] = parseFloat(value);
            }
          }
        });
      });
    });

    return acc;
  }, []);

  transformed.sort((a, b) => a.sortKey.localeCompare(b.sortKey));

  const hasData = transformed.some(entry => {
    return chartSectors.some(sector =>
      chartCategories.some(category =>
        chartStates.some(state => {
          const key = `${state}_${sector}_${category}`;
          return entry[key] !== undefined;
        })
      )
    );
  });

  return { chartData: transformed, hasNoData: !hasData };
};

export const generateChartTitle = (
  chartStates: string[],
  chartCategories: string[],
  chartSectors: string[],
  dimension: MultiSelectDimension,
  startMonth: string,
  startYear: string,
  endMonth: string,
  endYear: string
): string => {
  const dateRange = `${startMonth?.slice(0, 3)} ${startYear} - ${endMonth?.slice(0, 3)} ${endYear}`;

  if (dimension === 'states') {
    return `${getCategoryDisplayName(chartCategories[0])} · ${chartSectors[0]} · ${dateRange}`;
  } else if (dimension === 'categories') {
    return `${getStateDisplayName(chartStates[0])} · ${chartSectors[0]} · ${dateRange}`;
  } else if (dimension === 'sectors') {
    return `${getStateDisplayName(chartStates[0])} · ${getCategoryDisplayName(chartCategories[0])} · ${dateRange}`;
  } else {
    return `${getStateDisplayName(chartStates[0])} · ${getCategoryDisplayName(chartCategories[0])} · ${chartSectors[0]} · ${dateRange}`;
  }
};

export const generateChartSubtitle = (
  chartStates: string[],
  chartCategories: string[],
  chartSectors: string[]
): string => {
  const displayStates = chartStates.map(getStateDisplayName);
  const displayCategories = chartCategories.map(getCategoryDisplayName);
  const statesStr = displayStates.length > 2
    ? `${displayStates.slice(0, 2).join(', ')} +${displayStates.length - 2} more`
    : displayStates.join(', ');
  const categoriesStr = displayCategories.length > 2
    ? `${displayCategories.slice(0, 2).join(', ')} +${displayCategories.length - 2} more`
    : displayCategories.join(', ');
  const sectorsStr = chartSectors.join(', ');

  return `States: ${statesStr} | Categories: ${categoriesStr} | Sectors: ${sectorsStr}`;
};

export const getHousingDataWarning = (
  chartStates: string[],
  chartCategories: string[],
  chartSectors: string[]
): string | null => {
  const hasHousing = chartCategories.includes('Housing');
  const hasCombinedSector = chartSectors.includes('Rural + Urban');
  const hasRuralSector = chartSectors.includes('Rural');
  const hasIndividualStates = chartStates.some(s => s !== 'ALL India');

  if (hasHousing && hasIndividualStates) {
    if (hasCombinedSector && !chartSectors.includes('Urban')) {
      return 'Housing data for individual states is only available for Urban areas. Select "Urban" sector to see the data.';
    }
    if (hasRuralSector && !chartSectors.includes('Urban')) {
      return 'Housing data is not available for Rural areas. Select "Urban" sector to see the data.';
    }
  }
  return null;
};

import { CPIData, ChartDataResult, DateRange, MultiSelectDimension, Selections } from '../types';
import { SECTOR_MAP } from '../constants';
import { monthToNumber, formatDate } from './dateHelpers';
import { getStateDisplayName, getCategoryDisplayName } from './displayHelpers';

export const generateChartData = (
  data: CPIData[],
  selections: Selections,
  dateRange: DateRange
): ChartDataResult => {
  const { states, categories, sectors } = selections;
  const { startMonth, startYear, endMonth, endYear } = dateRange;

  if (data.length === 0 || categories.length === 0 || sectors.length === 0 || states.length === 0) {
    return { chartData: [], hasNoData: true };
  }

  const normalizedStart = startYear && startMonth
    ? `${startYear}-${monthToNumber(startMonth)}`
    : null;
  const normalizedEnd = endYear && endMonth
    ? `${endYear}-${monthToNumber(endMonth)}`
    : null;

  const filteredData = data.filter(row => {
    const dateKey = `${row.Year}-${monthToNumber(row.Month)}`;
    const inDateRange = (!normalizedStart || dateKey >= normalizedStart) &&
                        (!normalizedEnd || dateKey <= normalizedEnd);
    return states.includes(row.State) &&
           categories.includes(row.Description) &&
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

    sectors.forEach(sector => {
      categories.forEach(category => {
        states.forEach(state => {
          if (row.State === state && row.Description === category) {
            const dataColumn = (SECTOR_MAP as Record<string, string>)[sector];
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
    return sectors.some(sector =>
      categories.some(category =>
        states.some(state => {
          const key = `${state}_${sector}_${category}`;
          return entry[key] !== undefined;
        })
      )
    );
  });

  return { chartData: transformed, hasNoData: !hasData };
};

export const generateChartTitle = (
  selections: Selections,
  dimension: MultiSelectDimension,
  dateRange: DateRange
): string => {
  const { states, categories, sectors } = selections;
  const { startMonth, startYear, endMonth, endYear } = dateRange;
  const dateRangeStr = `${startMonth?.slice(0, 3)} ${startYear} - ${endMonth?.slice(0, 3)} ${endYear}`;

  if (dimension === 'states') {
    return `${getCategoryDisplayName(categories[0])} · ${sectors[0]} · ${dateRangeStr}`;
  } else if (dimension === 'categories') {
    return `${getStateDisplayName(states[0])} · ${sectors[0]} · ${dateRangeStr}`;
  } else if (dimension === 'sectors') {
    return `${getStateDisplayName(states[0])} · ${getCategoryDisplayName(categories[0])} · ${dateRangeStr}`;
  } else {
    return `${getStateDisplayName(states[0])} · ${getCategoryDisplayName(categories[0])} · ${sectors[0]} · ${dateRangeStr}`;
  }
};

export const generateChartSubtitle = (selections: Selections): string => {
  const { states, categories, sectors } = selections;
  const displayStates = states.map(getStateDisplayName);
  const displayCategories = categories.map(getCategoryDisplayName);
  const statesStr = displayStates.length > 2
    ? `${displayStates.slice(0, 2).join(', ')} +${displayStates.length - 2} more`
    : displayStates.join(', ');
  const categoriesStr = displayCategories.length > 2
    ? `${displayCategories.slice(0, 2).join(', ')} +${displayCategories.length - 2} more`
    : displayCategories.join(', ');
  const sectorsStr = sectors.join(', ');

  return `States: ${statesStr} | Categories: ${categoriesStr} | Sectors: ${sectorsStr}`;
};

export const getHousingDataWarning = (selections: Selections): string | null => {
  const { states, categories, sectors } = selections;
  const hasHousing = categories.includes('Housing');
  const hasCombinedSector = sectors.includes('Rural + Urban');
  const hasRuralSector = sectors.includes('Rural');
  const hasIndividualStates = states.some(s => s !== 'ALL India');

  if (hasHousing && hasIndividualStates) {
    if (hasCombinedSector && !sectors.includes('Urban')) {
      return 'Housing data for individual states is only available for Urban areas. Select "Urban" sector to see the data.';
    }
    if (hasRuralSector && !sectors.includes('Urban')) {
      return 'Housing data is not available for Rural areas. Select "Urban" sector to see the data.';
    }
  }
  return null;
};

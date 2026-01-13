'use client';

import { useState, useEffect, useRef, useCallback, ReactElement } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Papa from 'papaparse';

interface CPIData {
  Year: string;
  Month: string;
  State: string;
  Group: string;
  SubGroup: string;
  Description: string;
  Rural: string;
  Urban: string;
  Combined: string;
  Status: string;
}

// Chart definition stored in the board
interface ChartDefinition {
  id: string;
  title: string;
  subtitle: string;
  selectedStates: string[];
  selectedCategories: string[];
  selectedSectors: string[];
  startMonth: string;
  startYear: string;
  endMonth: string;
  endYear: string;
  // Which dimension has multi-select enabled for this chart
  multiSelectDimension: 'states' | 'categories' | 'sectors';
}

const SECTOR_COLORS: { [key: string]: string } = {
  'Rural': '#3b82f6',
  'Urban': '#10b981',
  'Rural + Urban': '#f59e0b'
};

// Category colors for consistent coloring across charts
const CATEGORY_COLORS: { [key: string]: string } = {
  'General Index (All Groups)': '#8b5cf6',
  'Food and beverages': '#ec4899',
  'Clothing and footwear': '#14b8a6',
  'Fuel and light': '#f97316',
  'Housing': '#06b6d4',
  'Pan; tobacco; and intoxicants': '#84cc16',
  'Miscellaneous': '#a855f7'
};

// State colors for when states are the multi-select dimension
const STATE_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#84cc16'
];

const SECTOR_MAP: { [key: string]: string } = {
  'Rural': 'Rural',
  'Urban': 'Urban',
  'Rural + Urban': 'Combined'
};

const CATEGORIES = [
  'General Index (All Groups)',
  'Food and beverages',
  'Clothing and footwear',
  'Fuel and light',
  'Housing',
  'Pan; tobacco; and intoxicants',
  'Miscellaneous'
];

const SECTORS = ['Rural', 'Urban', 'Rural + Urban'];

export default function Home() {
  const [cpiData, setData] = useState<CPIData[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);

  // Multi-select states (converted from single select)
  const [selectedStates, setSelectedStates] = useState<string[]>(['ALL India']);
  const [states, setStates] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['General Index (All Groups)']);
  const [selectedSectors, setSelectedSectors] = useState<string[]>(['Rural', 'Urban', 'Rural + Urban']);

  // Track which dimension currently has multi-select enabled
  // Only ONE dimension can have multiple selections at a time
  const [multiSelectDimension, setMultiSelectDimension] = useState<'states' | 'categories' | 'sectors'>('sectors');

  const [, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [availableMonths] = useState<string[]>([
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]);
  const [startMonth, setStartMonth] = useState<string>('');
  const [startYear, setStartYear] = useState<string>('');
  const [endMonth, setEndMonth] = useState<string>('');
  const [endYear, setEndYear] = useState<string>('');
  const [stateSearch, setStateSearch] = useState<string>('');
  const [isStateDropdownOpen, setIsStateDropdownOpen] = useState<boolean>(false);
  const [hasNoData, setHasNoData] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  // Chart Board state
  const [chartBoard, setChartBoard] = useState<ChartDefinition[]>([]);
  const [editingChartId, setEditingChartId] = useState<string | null>(null);

  // Refs
  const stateDropdownRef = useRef<HTMLDivElement>(null);
  const chartPreviewRef = useRef<HTMLDivElement>(null);

  // Handle window resize for responsive chart height
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (stateDropdownRef.current && !stateDropdownRef.current.contains(event.target as Node)) {
        setIsStateDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load chart board from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('cpi-chart-board');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setChartBoard(parsed);
      } catch (e) {
        console.error('Failed to load chart board from localStorage:', e);
      }
    }
  }, []);

  // Save chart board to localStorage whenever it changes
  useEffect(() => {
    if (chartBoard.length > 0) {
      localStorage.setItem('cpi-chart-board', JSON.stringify(chartBoard));
    } else {
      localStorage.removeItem('cpi-chart-board');
    }
  }, [chartBoard]);

  // Fetch and parse CSV
  useEffect(() => {
    fetch('/CPIndex_Jan13-To-Nov25.csv')
      .then(response => response.text())
      .then(csvText => {
        // Skip the first line which contains "(Base 2012=100)"
        const lines = csvText.split('\n');
        const csvWithoutFirstLine = lines.slice(1).join('\n');

        Papa.parse(csvWithoutFirstLine, {
          header: true,
          skipEmptyLines: true,
          complete: (result) => {
            const parsedData = result.data.filter((row: any) =>
              row.Year && row.State && row.Description && !isNaN(parseInt(row.Year))
            ) as CPIData[];
            setData(parsedData);

            // Extract unique states - ALL India first, then alphabetically
            const uniqueStates = Array.from(new Set(
              parsedData.map(row => row.State)
            )).filter(s => s && s !== 'State');

            const sortedStates = uniqueStates.sort((a, b) => {
              if (a === 'ALL India') return -1;
              if (b === 'ALL India') return 1;
              return a.localeCompare(b);
            });
            setStates(sortedStates);

            // Extract unique years
            const uniqueYears = Array.from(new Set(
              parsedData.map(row => row.Year)
            )).filter(y => y && !isNaN(parseInt(y))).sort();
            setAvailableYears(uniqueYears);

            // Set default date range to full range
            if (uniqueYears.length > 0) {
              const firstYear = uniqueYears[0];
              const lastYear = uniqueYears[uniqueYears.length - 1];

              // Find first and last months
              const firstYearData = parsedData.filter(r => r.Year === firstYear);
              const lastYearData = parsedData.filter(r => r.Year === lastYear);

              const monthOrder = ['January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'];

              const firstMonths = firstYearData.map(r => r.Month);
              const lastMonths = lastYearData.map(r => r.Month);

              const firstMonth = monthOrder.find(m => firstMonths.includes(m)) || 'January';
              const lastMonth = [...monthOrder].reverse().find(m => lastMonths.includes(m)) || 'December';

              setStartYear(firstYear);
              setStartMonth(firstMonth);
              setEndYear(lastYear);
              setEndMonth(lastMonth);

              setDateRange({
                start: `${firstYear}-${firstMonth}`,
                end: `${lastYear}-${lastMonth}`
              });
            }
          }
        });
      });
  }, []);

  // Update dateRange when month/year selectors change
  useEffect(() => {
    if (startYear && startMonth && endYear && endMonth) {
      setDateRange({
        start: `${startYear}-${startMonth}`,
        end: `${endYear}-${endMonth}`
      });
    }
  }, [startYear, startMonth, endYear, endMonth]);

  // Helper function to convert month name to number
  const monthToNumber = (monthName: string): string => {
    const months: { [key: string]: string } = {
      'January': '01', 'February': '02', 'March': '03', 'April': '04',
      'May': '05', 'June': '06', 'July': '07', 'August': '08',
      'September': '09', 'October': '10', 'November': '11', 'December': '12'
    };
    return months[monthName] || '01';
  };

  // Helper function to compare dates (year-month combinations)
  const compareDates = (year1: string, month1: string, year2: string, month2: string): number => {
    const date1 = `${year1}-${monthToNumber(month1)}`;
    const date2 = `${year2}-${monthToNumber(month2)}`;
    return date1.localeCompare(date2);
  };

  // Helper function to format date as MM/YY
  const formatDate = (year: string, month: string): string => {
    const monthNum = monthToNumber(month);
    const yearShort = year.slice(-2);
    return `${monthNum}/${yearShort}`;
  };

  // Generate chart data for given configuration
  // This is used both for the live preview and for chart board cards
  const generateChartData = useCallback((
    data: CPIData[],
    chartStates: string[],
    chartCategories: string[],
    chartSectors: string[],
    chartStartMonth: string,
    chartStartYear: string,
    chartEndMonth: string,
    chartEndYear: string
  ) => {
    if (data.length === 0 || chartCategories.length === 0 || chartSectors.length === 0 || chartStates.length === 0) {
      return { chartData: [], hasNoData: true };
    }

    // Convert dateRange to normalized format (YYYY-MM) for comparison
    const normalizedStart = chartStartYear && chartStartMonth
      ? `${chartStartYear}-${monthToNumber(chartStartMonth)}`
      : null;
    const normalizedEnd = chartEndYear && chartEndMonth
      ? `${chartEndYear}-${monthToNumber(chartEndMonth)}`
      : null;

    // Filter data by selected states and categories
    const filteredData = data.filter(row => {
      const dateKey = `${row.Year}-${monthToNumber(row.Month)}`;
      const inDateRange = (!normalizedStart || dateKey >= normalizedStart) &&
                          (!normalizedEnd || dateKey <= normalizedEnd);
      return chartStates.includes(row.State) &&
             chartCategories.includes(row.Description) &&
             inDateRange;
    });

    // Group data by Year-Month
    const transformed = filteredData.reduce((acc: any[], row) => {
      const sortKey = `${row.Year}-${monthToNumber(row.Month)}`;
      const displayDate = formatDate(row.Year, row.Month);

      let dateEntry = acc.find(item => item.sortKey === sortKey);

      if (!dateEntry) {
        dateEntry = { date: displayDate, sortKey };
        acc.push(dateEntry);
      }

      // Add values for each selected sector, category, and state combination
      chartSectors.forEach(sector => {
        chartCategories.forEach(category => {
          chartStates.forEach(state => {
            if (row.State === state && row.Description === category) {
              const dataColumn = SECTOR_MAP[sector];
              const value = row[dataColumn as keyof CPIData];
              if (value && value !== '' && !isNaN(parseFloat(value))) {
                // Key format depends on which dimensions have multiple selections
                const key = `${state}_${sector}_${category}`;
                dateEntry[key] = parseFloat(value);
              }
            }
          });
        });
      });

      return acc;
    }, []);

    // Sort by the sortKey (YYYY-MM format)
    transformed.sort((a, b) => a.sortKey.localeCompare(b.sortKey));

    // Check if we have any actual data points
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
  }, []);

  // Transform data for live preview chart
  useEffect(() => {
    const result = generateChartData(
      cpiData,
      selectedStates,
      selectedCategories,
      selectedSectors,
      startMonth,
      startYear,
      endMonth,
      endYear
    );
    setChartData(result.chartData);
    setHasNoData(result.hasNoData);
  }, [cpiData, selectedStates, selectedCategories, selectedSectors, startMonth, startYear, endMonth, endYear, generateChartData]);

  /**
   * SINGLE MULTI-SELECT DIMENSION RULE ENFORCEMENT
   *
   * Only ONE dimension (States, Categories, or Sectors) can have multiple selections at a time.
   * When a user tries to select multiple items in a dimension:
   * - If that dimension is already the multi-select dimension, allow it
   * - If another dimension currently has multiple selections, prevent it and show helper message
   * - If switching to a new multi-select dimension, restrict others to single selection
   */

  const toggleState = (state: string) => {
    setSelectedStates(prev => {
      const isSelected = prev.includes(state);

      if (isSelected) {
        // Deselecting - always allow, but ensure at least one remains
        const newSelection = prev.filter(s => s !== state);
        return newSelection.length > 0 ? newSelection : prev;
      } else {
        // Selecting a new state
        if (multiSelectDimension === 'states') {
          // States is the multi-select dimension, allow multiple
          return [...prev, state];
        } else if (prev.length === 0) {
          // No states selected, allow first selection
          return [state];
        } else {
          // Another dimension has multi-select, replace current selection
          return [state];
        }
      }
    });
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => {
      const isSelected = prev.includes(category);

      if (isSelected) {
        // Deselecting - always allow, but ensure at least one remains
        const newSelection = prev.filter(c => c !== category);
        return newSelection.length > 0 ? newSelection : prev;
      } else {
        // Selecting a new category
        if (multiSelectDimension === 'categories') {
          // Categories is the multi-select dimension, allow multiple
          return [...prev, category];
        } else if (prev.length === 0) {
          // No categories selected, allow first selection
          return [category];
        } else {
          // Another dimension has multi-select, replace current selection
          return [category];
        }
      }
    });
  };

  const toggleSector = (sector: string) => {
    setSelectedSectors(prev => {
      const isSelected = prev.includes(sector);

      if (isSelected) {
        // Deselecting - always allow, but ensure at least one remains
        const newSelection = prev.filter(s => s !== sector);
        return newSelection.length > 0 ? newSelection : prev;
      } else {
        // Selecting a new sector
        if (multiSelectDimension === 'sectors') {
          // Sectors is the multi-select dimension, allow multiple
          return [...prev, sector];
        } else if (prev.length === 0) {
          // No sectors selected, allow first selection
          return [sector];
        } else {
          // Another dimension has multi-select, replace current selection
          return [sector];
        }
      }
    });
  };

  // Switch the multi-select dimension
  const switchMultiSelectDimension = (dimension: 'states' | 'categories' | 'sectors') => {
    if (dimension === multiSelectDimension) return;

    // When switching dimensions, restrict other dimensions to single selection
    setMultiSelectDimension(dimension);

    if (dimension !== 'states' && selectedStates.length > 1) {
      setSelectedStates([selectedStates[0]]);
    }
    if (dimension !== 'categories' && selectedCategories.length > 1) {
      setSelectedCategories([selectedCategories[0]]);
    }
    if (dimension !== 'sectors' && selectedSectors.length > 1) {
      setSelectedSectors([selectedSectors[0]]);
    }
  };

  // Filter states based on search
  const filteredStates = states.filter(state =>
    state.toLowerCase().includes(stateSearch.toLowerCase())
  );

  // Check if an end month should be disabled (end date < start date)
  const isEndMonthDisabled = (month: string): boolean => {
    if (!startYear || !endYear || !startMonth) return false;
    // Only disable if same year and month would be before start month
    if (endYear === startYear) {
      return compareDates(startYear, startMonth, endYear, month) > 0;
    }
    return false;
  };

  // Check if an end year should be disabled
  const isEndYearDisabled = (year: string): boolean => {
    if (!startYear) return false;
    return year < startYear;
  };

  // When end year changes, validate end month
  useEffect(() => {
    if (endYear && startYear && endMonth && startMonth) {
      if (endYear === startYear && compareDates(startYear, startMonth, endYear, endMonth) > 0) {
        setEndMonth(startMonth);
      }
    }
  }, [endYear, startYear, startMonth, endMonth]);

  // Generate chart title based on selections
  const generateChartTitle = (
    chartStates: string[],
    chartCategories: string[],
    chartSectors: string[],
    dimension: 'states' | 'categories' | 'sectors'
  ): string => {
    if (dimension === 'states') {
      return `CPI – ${chartCategories[0]} – ${chartSectors[0]}`;
    } else if (dimension === 'categories') {
      return `CPI – ${chartStates[0]} – ${chartSectors[0]}`;
    } else {
      return `CPI – ${chartStates[0]} – ${chartCategories[0]}`;
    }
  };

  // Generate chart subtitle
  const generateChartSubtitle = (
    chartStates: string[],
    chartCategories: string[],
    chartSectors: string[]
  ): string => {
    const statesStr = chartStates.length > 2
      ? `${chartStates.slice(0, 2).join(', ')} +${chartStates.length - 2} more`
      : chartStates.join(', ');
    const categoriesStr = chartCategories.length > 2
      ? `${chartCategories.slice(0, 2).join(', ')} +${chartCategories.length - 2} more`
      : chartCategories.join(', ');
    const sectorsStr = chartSectors.join(', ');

    return `States: ${statesStr} | Categories: ${categoriesStr} | Sectors: ${sectorsStr}`;
  };

  // Add chart to board
  const addChartToBoard = () => {
    const newChart: ChartDefinition = {
      id: Date.now().toString(),
      title: generateChartTitle(selectedStates, selectedCategories, selectedSectors, multiSelectDimension),
      subtitle: generateChartSubtitle(selectedStates, selectedCategories, selectedSectors),
      selectedStates: [...selectedStates],
      selectedCategories: [...selectedCategories],
      selectedSectors: [...selectedSectors],
      startMonth,
      startYear,
      endMonth,
      endYear,
      multiSelectDimension
    };

    setChartBoard(prev => [...prev, newChart]);
  };

  // Save changes to edited chart
  const saveChartChanges = () => {
    if (!editingChartId) return;

    setChartBoard(prev => prev.map(chart => {
      if (chart.id === editingChartId) {
        return {
          ...chart,
          title: generateChartTitle(selectedStates, selectedCategories, selectedSectors, multiSelectDimension),
          subtitle: generateChartSubtitle(selectedStates, selectedCategories, selectedSectors),
          selectedStates: [...selectedStates],
          selectedCategories: [...selectedCategories],
          selectedSectors: [...selectedSectors],
          startMonth,
          startYear,
          endMonth,
          endYear,
          multiSelectDimension
        };
      }
      return chart;
    }));

    setEditingChartId(null);
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingChartId(null);
    // Reset to defaults
    setSelectedStates(['ALL India']);
    setSelectedCategories(['General Index (All Groups)']);
    setSelectedSectors(['Rural', 'Urban', 'Rural + Urban']);
    setMultiSelectDimension('sectors');
  };

  // Edit a chart
  const editChart = (chart: ChartDefinition) => {
    setSelectedStates(chart.selectedStates);
    setSelectedCategories(chart.selectedCategories);
    setSelectedSectors(chart.selectedSectors);
    setStartMonth(chart.startMonth);
    setStartYear(chart.startYear);
    setEndMonth(chart.endMonth);
    setEndYear(chart.endYear);
    setMultiSelectDimension(chart.multiSelectDimension);
    setEditingChartId(chart.id);

    // Scroll to the live preview
    setTimeout(() => {
      chartPreviewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  // Duplicate a chart
  const duplicateChart = (chart: ChartDefinition) => {
    const newChart: ChartDefinition = {
      ...chart,
      id: Date.now().toString(),
      title: chart.title + ' (Copy)'
    };
    setChartBoard(prev => [...prev, newChart]);
  };

  // Remove a chart
  const removeChart = (chartId: string) => {
    setChartBoard(prev => prev.filter(c => c.id !== chartId));
    if (editingChartId === chartId) {
      setEditingChartId(null);
    }
  };

  /**
   * CHART SERIES GENERATION
   *
   * For each chart, we generate line series based on the multi-select dimension:
   * - If multiSelectDimension === 'states': one line per state
   * - If multiSelectDimension === 'categories': one line per category
   * - If multiSelectDimension === 'sectors': one line per sector
   *
   * The other two dimensions are fixed (single value each) for that chart.
   */
  const renderChartLines = (
    chartStates: string[],
    chartCategories: string[],
    chartSectors: string[],
    dimension: 'states' | 'categories' | 'sectors'
  ) => {
    const lines: ReactElement[] = [];

    if (dimension === 'states') {
      // One line per state, fixed category and sector
      chartStates.forEach((state, index) => {
        const key = `${state}_${chartSectors[0]}_${chartCategories[0]}`;
        lines.push(
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            name={state}
            stroke={STATE_COLORS[index % STATE_COLORS.length]}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 5, strokeWidth: 0 }}
            connectNulls
          />
        );
      });
    } else if (dimension === 'categories') {
      // One line per category, fixed state and sector
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
    } else {
      // One line per sector, fixed state and category
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
    }

    return lines;
  };

  // Get helper text for dimension restriction
  const getDimensionHelperText = (dimension: 'states' | 'categories' | 'sectors'): string | null => {
    if (multiSelectDimension === dimension) {
      return 'Multi-select enabled';
    }
    const dimensionNames = {
      states: 'State / Region',
      categories: 'Categories',
      sectors: 'Sectors'
    };
    return `Limited to one (${dimensionNames[multiSelectDimension]} has multi-select)`;
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8 text-center md:text-left">
          <h1 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
            Consumer Price Index
          </h1>
          <p className="text-slate-400 text-sm md:text-lg">
            India CPI Data (Base: 2012=100) • Jan 2013 - Nov 2025
          </p>
        </div>

        {/* Chart Builder Panel */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-4 md:p-6 mb-6 md:mb-8 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-2">
            <div>
              <h2 className="text-lg font-semibold text-slate-200">Chart Builder</h2>
              <p className="text-xs text-slate-500 mt-1">
                Select filters to configure your chart. Only one dimension can have multiple selections.
              </p>
            </div>

            {/* Add Chart / Edit Mode Buttons */}
            <div className="flex gap-2">
              {editingChartId ? (
                <>
                  <button
                    onClick={saveChartChanges}
                    className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-medium rounded-lg transition-colors duration-200 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Save Changes
                  </button>
                  <button
                    onClick={cancelEditing}
                    className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white text-sm font-medium rounded-lg transition-colors duration-200"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={addChartToBoard}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors duration-200 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Chart to Board
                </button>
              )}
            </div>
          </div>

          {/* Multi-select Dimension Selector */}
          <div className="mb-4 p-3 bg-slate-700/30 rounded-xl border border-slate-600/30">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Compare by:</span>
              {(['states', 'categories', 'sectors'] as const).map(dim => (
                <button
                  key={dim}
                  onClick={() => switchMultiSelectDimension(dim)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
                    multiSelectDimension === dim
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-600/50 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {dim === 'states' ? 'State / Region' : dim === 'categories' ? 'Categories' : 'Sectors'}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Multiple selection is enabled for <span className="text-blue-400 font-medium">
                {multiSelectDimension === 'states' ? 'State / Region' : multiSelectDimension === 'categories' ? 'Categories' : 'Sectors'}
              </span>. Other dimensions are limited to one selection to keep charts readable.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">

            {/* State Selection - Now supports multi-select */}
            <div className="space-y-2">
              <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 bg-cyan-400 rounded-full"></span>
                State / Region
                {multiSelectDimension === 'states' && (
                  <span className="ml-auto text-[10px] font-medium bg-cyan-600/30 text-cyan-300 px-2 py-0.5 rounded-full">
                    Multi
                  </span>
                )}
              </h2>
              <div className="relative" ref={stateDropdownRef}>
                <button
                  onClick={() => setIsStateDropdownOpen(!isStateDropdownOpen)}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-left text-slate-200 hover:bg-slate-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 flex items-center justify-between"
                >
                  <span className="truncate">
                    {selectedStates.length === 1
                      ? selectedStates[0]
                      : `${selectedStates.length} states selected`}
                  </span>
                  <svg className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${isStateDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isStateDropdownOpen && (
                  <div className="absolute z-[100] w-full mt-2 bg-slate-800 border border-slate-600/50 rounded-xl shadow-2xl overflow-hidden">
                    <div className="p-2 border-b border-slate-700">
                      <input
                        type="text"
                        value={stateSearch}
                        onChange={(e) => setStateSearch(e.target.value)}
                        placeholder="Search states..."
                        className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-sm"
                        autoFocus
                      />
                    </div>
                    <div className="max-h-60 overflow-y-auto scrollbar-thin">
                      {filteredStates.map((state) => {
                        const isSelected = selectedStates.includes(state);

                        return (
                          <button
                            key={state}
                            onClick={() => {
                              if (multiSelectDimension === 'states') {
                                toggleState(state);
                              } else {
                                // Single select mode - replace selection
                                setSelectedStates([state]);
                                setIsStateDropdownOpen(false);
                                setStateSearch('');
                              }
                            }}
                            className={`w-full px-4 py-2.5 text-left text-sm transition-colors duration-150 flex items-center gap-2 ${
                              isSelected
                                ? 'bg-cyan-600/30 text-cyan-300'
                                : 'text-slate-300 hover:bg-slate-700/50'
                            }`}
                          >
                            {multiSelectDimension === 'states' && (
                              <span className={`w-4 h-4 rounded border flex items-center justify-center ${
                                isSelected ? 'bg-cyan-500 border-cyan-500' : 'border-slate-500'
                              }`}>
                                {isSelected && (
                                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </span>
                            )}
                            {state}
                          </button>
                        );
                      })}
                    </div>
                    {multiSelectDimension === 'states' && (
                      <div className="p-2 border-t border-slate-700">
                        <button
                          onClick={() => {
                            setIsStateDropdownOpen(false);
                            setStateSearch('');
                          }}
                          className="w-full px-3 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                          Done
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              {multiSelectDimension !== 'states' && (
                <p className="text-[10px] text-slate-500">
                  {getDimensionHelperText('states')}
                </p>
              )}
            </div>

            {/* Categories Selection */}
            <div className="space-y-2">
              <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                Categories
                {multiSelectDimension === 'categories' && (
                  <span className="ml-auto text-[10px] font-medium bg-blue-600/30 text-blue-300 px-2 py-0.5 rounded-full">
                    Multi
                  </span>
                )}
              </h2>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                {CATEGORIES.map((category) => {
                  const isSelected = selectedCategories.includes(category);

                  return (
                    <label
                      key={category}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all duration-200 ${
                        isSelected
                          ? 'bg-blue-600/20 border border-blue-500/30'
                          : 'bg-slate-700/30 border border-transparent hover:bg-slate-700/50'
                      } ${multiSelectDimension !== 'categories' && !isSelected && selectedCategories.length > 0 ? 'opacity-50' : ''}`}
                    >
                      <input
                        type={multiSelectDimension === 'categories' ? 'checkbox' : 'radio'}
                        name="category"
                        checked={isSelected}
                        onChange={() => toggleCategory(category)}
                        className="w-4 h-4 rounded border-slate-500 text-blue-500 focus:ring-blue-500/50 focus:ring-offset-0 bg-slate-700"
                      />
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: CATEGORY_COLORS[category] }}
                        ></span>
                        <span className="text-sm text-slate-300 leading-tight truncate">{category}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
              {multiSelectDimension !== 'categories' && (
                <p className="text-[10px] text-slate-500">
                  {getDimensionHelperText('categories')}
                </p>
              )}
            </div>

            {/* Sector Selection */}
            <div className="space-y-2">
              <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                Sectors
                {multiSelectDimension === 'sectors' && (
                  <span className="ml-auto text-[10px] font-medium bg-green-600/30 text-green-300 px-2 py-0.5 rounded-full">
                    Multi
                  </span>
                )}
              </h2>
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
                      } ${multiSelectDimension !== 'sectors' && !isSelected && selectedSectors.length > 0 ? 'opacity-50' : ''}`}
                    >
                      <input
                        type={multiSelectDimension === 'sectors' ? 'checkbox' : 'radio'}
                        name="sector"
                        checked={isSelected}
                        onChange={() => toggleSector(sector)}
                        className="w-4 h-4 rounded border-slate-500 text-green-500 focus:ring-green-500/50 focus:ring-offset-0 bg-slate-700"
                      />
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: SECTOR_COLORS[sector] }}
                        ></span>
                        <span className="text-sm font-medium text-slate-300">{sector}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
              {multiSelectDimension !== 'sectors' && (
                <p className="text-[10px] text-slate-500">
                  {getDimensionHelperText('sectors')}
                </p>
              )}
            </div>

            {/* Date Range Selection */}
            <div className="space-y-2">
              <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                Date Range
              </h2>
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
                        onChange={(e) => setStartMonth(e.target.value)}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full"
                      >
                        {availableMonths.map(month => (
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
                        onChange={(e) => setStartYear(e.target.value)}
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
                        onChange={(e) => setEndMonth(e.target.value)}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full"
                      >
                        {availableMonths.map(month => (
                          <option
                            key={month}
                            value={month}
                            disabled={isEndMonthDisabled(month)}
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
                        onChange={(e) => setEndYear(e.target.value)}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full"
                      >
                        {availableYears.map(year => (
                          <option
                            key={year}
                            value={year}
                            disabled={isEndYearDisabled(year)}
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
          </div>
        </div>

        {/* Live Preview Chart */}
        <div ref={chartPreviewRef} className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-4 md:p-6 shadow-xl mb-6 md:mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 md:mb-6 gap-2">
            <div>
              <h2 className="text-lg md:text-xl font-semibold text-slate-200">
                {editingChartId ? 'Editing Chart' : 'Live Preview'}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {generateChartTitle(selectedStates, selectedCategories, selectedSectors, multiSelectDimension)}
              </p>
            </div>
            <div className="text-xs md:text-sm text-slate-500">
              {selectedStates.length === 1 ? selectedStates[0] : `${selectedStates.length} states`} • {startMonth?.slice(0, 3)} {startYear} - {endMonth?.slice(0, 3)} {endYear}
            </div>
          </div>

          {hasNoData ? (
            <div className="flex items-center justify-center h-[400px] md:h-[500px]">
              <div className="text-center px-4">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-700/50 flex items-center justify-center">
                  <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <p className="text-slate-400 text-sm md:text-base">
                  There is no data published for the selected state and category during this time period.
                </p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={isMobile ? 350 : 500}>
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
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '12px',
                    boxShadow: '0 10px 40px -10px rgba(0, 0, 0, 0.5)',
                    padding: '12px'
                  }}
                  labelStyle={{ color: '#e2e8f0', marginBottom: '8px', fontWeight: 600 }}
                  itemStyle={{ color: '#cbd5e1', fontSize: '12px', padding: '2px 0' }}
                />
                <Legend
                  wrapperStyle={{ paddingTop: '20px' }}
                  formatter={(value) => <span className="text-slate-300 text-xs md:text-sm">{value}</span>}
                />
                {renderChartLines(selectedStates, selectedCategories, selectedSectors, multiSelectDimension)}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Chart Board Section */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-4 md:p-6 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 md:mb-6 gap-2">
            <div>
              <h2 className="text-lg md:text-xl font-semibold text-slate-200">Chart Board</h2>
              <p className="text-xs text-slate-500 mt-1">
                {chartBoard.length === 0
                  ? 'Add charts to compare multiple views side by side'
                  : `${chartBoard.length} chart${chartBoard.length !== 1 ? 's' : ''} on board`}
              </p>
            </div>
            {chartBoard.length >= 6 && (
              <p className="text-xs text-amber-400 flex items-center gap-1">
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
                  Build a chart using the filters above and click &apos;Add Chart&apos; to compare multiple views.
                </p>
                <p className="text-slate-500 text-xs">
                  Charts will be saved and persist across page reloads.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              {chartBoard.map(chart => {
                const chartResult = generateChartData(
                  cpiData,
                  chart.selectedStates,
                  chart.selectedCategories,
                  chart.selectedSectors,
                  chart.startMonth,
                  chart.startYear,
                  chart.endMonth,
                  chart.endYear
                );

                return (
                  <div
                    key={chart.id}
                    className={`bg-slate-900/50 rounded-xl border p-4 ${
                      editingChartId === chart.id
                        ? 'border-blue-500/50 ring-2 ring-blue-500/20'
                        : 'border-slate-700/50'
                    }`}
                  >
                    {/* Chart Card Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-slate-200 truncate">{chart.title}</h3>
                        <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">{chart.subtitle}</p>
                        <p className="text-[10px] text-slate-600 mt-1">
                          {chart.startMonth?.slice(0, 3)} {chart.startYear} - {chart.endMonth?.slice(0, 3)} {chart.endYear}
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1 ml-2">
                        <button
                          onClick={() => editChart(chart)}
                          className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-700/50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => duplicateChart(chart)}
                          className="p-1.5 text-slate-400 hover:text-green-400 hover:bg-slate-700/50 rounded-lg transition-colors"
                          title="Duplicate"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => removeChart(chart.id)}
                          className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700/50 rounded-lg transition-colors"
                          title="Remove"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Chart */}
                    {chartResult.hasNoData ? (
                      <div className="flex items-center justify-center h-48 bg-slate-800/30 rounded-lg">
                        <p className="text-slate-500 text-xs">No data available</p>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={chartResult.chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
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
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#1e293b',
                              border: '1px solid #334155',
                              borderRadius: '8px',
                              boxShadow: '0 4px 20px -4px rgba(0, 0, 0, 0.5)',
                              padding: '8px',
                              fontSize: '11px'
                            }}
                            labelStyle={{ color: '#e2e8f0', marginBottom: '4px', fontWeight: 600 }}
                            itemStyle={{ color: '#cbd5e1', fontSize: '10px', padding: '1px 0' }}
                          />
                          <Legend
                            wrapperStyle={{ paddingTop: '10px' }}
                            formatter={(value) => <span className="text-slate-300 text-[10px]">{value}</span>}
                          />
                          {renderChartLines(
                            chart.selectedStates,
                            chart.selectedCategories,
                            chart.selectedSectors,
                            chart.multiSelectDimension
                          )}
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-slate-600">
          Data Source: Ministry of Statistics and Programme Implementation, Government of India
        </div>
      </div>
    </main>
  );
}

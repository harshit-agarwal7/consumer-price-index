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
  multiSelectDimension: 'states' | 'categories' | 'sectors' | null;
}

// Toast notification interface
interface ToastMessage {
  id: string;
  message: string;
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

// State colors for when states are the multi-select dimension - extended unique palette
const STATE_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#84cc16',
  '#a855f7', '#f43f5e', '#22c55e', '#0ea5e9', '#eab308',
  '#d946ef', '#6366f1', '#059669', '#dc2626', '#7c3aed',
  '#16a34a', '#ea580c', '#0891b2', '#c026d3', '#4f46e5',
  '#65a30d', '#db2777', '#0d9488', '#9333ea', '#2563eb',
  '#ca8a04', '#e11d48', '#15803d', '#7c2d12', '#4338ca'
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

// Display names for categories (maps data key to user-friendly display name)
const CATEGORY_DISPLAY_NAMES: { [key: string]: string } = {
  'Pan; tobacco; and intoxicants': 'Pan, tobacco & intoxicants'
};

// Helper to get display name for a category
const getCategoryDisplayName = (category: string): string => {
  return CATEGORY_DISPLAY_NAMES[category] || category;
};

// Custom tooltip component with color indicators and sorted by value
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
    dataKey: string;
  }>;
  label?: string;
  small?: boolean;
}

const CustomTooltip = ({ active, payload, label, small = false }: CustomTooltipProps) => {
  if (!active || !payload || payload.length === 0) return null;

  // Sort payload by value (highest to lowest)
  const sortedPayload = [...payload].sort((a, b) => (b.value || 0) - (a.value || 0));

  return (
    <div
      style={{
        backgroundColor: '#1e293b',
        border: '1px solid #334155',
        borderRadius: small ? '8px' : '12px',
        boxShadow: '0 10px 40px -10px rgba(0, 0, 0, 0.5)',
        padding: small ? '8px' : '12px'
      }}
    >
      <p style={{
        color: '#e2e8f0',
        marginBottom: small ? '4px' : '8px',
        fontWeight: 600,
        fontSize: small ? '11px' : '14px'
      }}>
        {label}
      </p>
      {sortedPayload.map((entry, index) => (
        <div
          key={index}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: small ? '1px 0' : '2px 0'
          }}
        >
          <span
            style={{
              width: small ? '8px' : '10px',
              height: small ? '8px' : '10px',
              borderRadius: '50%',
              backgroundColor: entry.color,
              flexShrink: 0
            }}
          />
          <span style={{
            color: '#cbd5e1',
            fontSize: small ? '10px' : '12px',
            flex: 1
          }}>
            {getCategoryDisplayName(entry.name)}
          </span>
          <span style={{
            color: '#94a3b8',
            fontSize: small ? '10px' : '12px',
            fontWeight: 500
          }}>
            {entry.value?.toFixed(1)}
          </span>
        </div>
      ))}
    </div>
  );
};

const SECTORS = ['Rural', 'Urban', 'Rural + Urban'];

export default function Home() {
  const [cpiData, setData] = useState<CPIData[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);

  // Multi-select states (converted from single select)
  const [selectedStates, setSelectedStates] = useState<string[]>(['ALL India']);
  const [states, setStates] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['General Index (All Groups)']);
  const [selectedSectors, setSelectedSectors] = useState<string[]>(['Rural + Urban']);

  // Track which dimension currently has multi-select enabled (inferred from user actions)
  // Only ONE dimension can have multiple selections at a time
  // null means no dimension is actively comparing (all have single selections)
  const [multiSelectDimension, setMultiSelectDimension] = useState<'states' | 'categories' | 'sectors' | null>(null);

  // Toast notifications for comparison dimension switches
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

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

            // Extract unique states - All India first, then alphabetically
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
   * IMPLICIT COMPARISON DIMENSION INFERENCE
   *
   * The comparison dimension is inferred from user interactions, not explicitly selected.
   * Core rules:
   * 1. Only ONE dimension can have multiple selections at a time
   * 2. The first dimension where user selects a SECOND item becomes the comparison dimension
   * 3. If user selects a second item in a DIFFERENT dimension:
   *    - Switch comparison to that new dimension
   *    - Reduce the previous comparison dimension to single selection (keep first item)
   *    - Show a toast notification explaining the switch
   * 4. If user deselects down to single item in comparison dimension:
   *    - Clear the comparison dimension (set to null)
   *    - All dimensions revert to single-select behavior
   */

  // Helper to show toast notification
  const showToast = (message: string) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message }]);
    // Auto-dismiss after 3 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  // Get dimension display name
  const getDimensionDisplayName = (dim: 'states' | 'categories' | 'sectors' | null): string => {
    if (dim === 'states') return 'State / Region';
    if (dim === 'categories') return 'Categories';
    if (dim === 'sectors') return 'Sectors';
    return '';
  };

  const toggleState = (state: string) => {
    const isSelected = selectedStates.includes(state);

    if (isSelected) {
      // Deselecting
      const newSelection = selectedStates.filter(s => s !== state);
      if (newSelection.length === 0) return; // Prevent empty selection

      setSelectedStates(newSelection);

      // If we're down to one item and states was the comparison dimension, clear it
      if (newSelection.length === 1 && multiSelectDimension === 'states') {
        setMultiSelectDimension(null);
      }
    } else {
      // Selecting a new state
      if (selectedStates.length === 0) {
        // First selection
        setSelectedStates([state]);
      } else if (multiSelectDimension === 'states' || multiSelectDimension === null) {
        // States is or will become the comparison dimension
        if (multiSelectDimension === null) {
          setMultiSelectDimension('states');
        }
        setSelectedStates([...selectedStates, state]);
      } else {
        // Another dimension is comparing - switch to states
        const prevDimension = multiSelectDimension;
        setMultiSelectDimension('states');
        setSelectedStates([...selectedStates, state]);

        // Reduce previous dimension to single selection (keep last selected item)
        if (prevDimension === 'categories' && selectedCategories.length > 1) {
          setSelectedCategories([selectedCategories[selectedCategories.length - 1]]);
        }
        if (prevDimension === 'sectors' && selectedSectors.length > 1) {
          setSelectedSectors([selectedSectors[selectedSectors.length - 1]]);
        }

        showToast(`Switched comparison to State / Region`);
      }
    }
  };

  const toggleCategory = (category: string) => {
    const isSelected = selectedCategories.includes(category);

    if (isSelected) {
      // Deselecting
      const newSelection = selectedCategories.filter(c => c !== category);
      if (newSelection.length === 0) return; // Prevent empty selection

      setSelectedCategories(newSelection);

      // If we're down to one item and categories was the comparison dimension, clear it
      if (newSelection.length === 1 && multiSelectDimension === 'categories') {
        setMultiSelectDimension(null);
      }
    } else {
      // Selecting a new category
      if (selectedCategories.length === 0) {
        // First selection
        setSelectedCategories([category]);
      } else if (multiSelectDimension === 'categories' || multiSelectDimension === null) {
        // Categories is or will become the comparison dimension
        if (multiSelectDimension === null) {
          setMultiSelectDimension('categories');
        }
        setSelectedCategories([...selectedCategories, category]);
      } else {
        // Another dimension is comparing - switch to categories
        const prevDimension = multiSelectDimension;
        setMultiSelectDimension('categories');
        setSelectedCategories([...selectedCategories, category]);

        // Reduce previous dimension to single selection (keep last selected item)
        if (prevDimension === 'states' && selectedStates.length > 1) {
          setSelectedStates([selectedStates[selectedStates.length - 1]]);
        }
        if (prevDimension === 'sectors' && selectedSectors.length > 1) {
          setSelectedSectors([selectedSectors[selectedSectors.length - 1]]);
        }

        showToast(`Switched comparison to Categories`);
      }
    }
  };

  const toggleSector = (sector: string) => {
    const isSelected = selectedSectors.includes(sector);

    if (isSelected) {
      // Deselecting
      const newSelection = selectedSectors.filter(s => s !== sector);
      if (newSelection.length === 0) return; // Prevent empty selection

      setSelectedSectors(newSelection);

      // If we're down to one item and sectors was the comparison dimension, clear it
      if (newSelection.length === 1 && multiSelectDimension === 'sectors') {
        setMultiSelectDimension(null);
      }
    } else {
      // Selecting a new sector
      if (selectedSectors.length === 0) {
        // First selection
        setSelectedSectors([sector]);
      } else if (multiSelectDimension === 'sectors' || multiSelectDimension === null) {
        // Sectors is or will become the comparison dimension
        if (multiSelectDimension === null) {
          setMultiSelectDimension('sectors');
        }
        setSelectedSectors([...selectedSectors, sector]);
      } else {
        // Another dimension is comparing - switch to sectors
        const prevDimension = multiSelectDimension;
        setMultiSelectDimension('sectors');
        setSelectedSectors([...selectedSectors, sector]);

        // Reduce previous dimension to single selection (keep last selected item)
        if (prevDimension === 'states' && selectedStates.length > 1) {
          setSelectedStates([selectedStates[selectedStates.length - 1]]);
        }
        if (prevDimension === 'categories' && selectedCategories.length > 1) {
          setSelectedCategories([selectedCategories[selectedCategories.length - 1]]);
        }

        showToast(`Switched comparison to Sectors`);
      }
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
    dimension: 'states' | 'categories' | 'sectors' | null
  ): string => {
    if (dimension === 'states') {
      return `CPI – ${chartCategories[0]} – ${chartSectors[0]}`;
    } else if (dimension === 'categories') {
      return `CPI – ${chartStates[0]} – ${chartSectors[0]}`;
    } else if (dimension === 'sectors') {
      return `CPI – ${chartStates[0]} – ${chartCategories[0]}`;
    } else {
      // No comparison dimension - show all single selections
      return `CPI – ${chartStates[0]} – ${chartCategories[0]} – ${chartSectors[0]}`;
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
    setSelectedSectors(['Rural + Urban']);
    setMultiSelectDimension(null);
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
   * - If multiSelectDimension === null: single line for the fixed combination
   *
   * The other two dimensions are fixed (single value each) for that chart.
   */
  const renderChartLines = (
    chartStates: string[],
    chartCategories: string[],
    chartSectors: string[],
    dimension: 'states' | 'categories' | 'sectors' | null
  ) => {
    const lines: ReactElement[] = [];

    if (dimension === 'states') {
      // One line per state, fixed category and sector
      // Use stable color based on state's index in the full states array
      chartStates.forEach((state) => {
        const stateIndex = states.indexOf(state);
        const colorIndex = stateIndex >= 0 ? stateIndex : chartStates.indexOf(state);
        const key = `${state}_${chartSectors[0]}_${chartCategories[0]}`;
        lines.push(
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            name={state}
            stroke={STATE_COLORS[colorIndex % STATE_COLORS.length]}
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
    } else if (dimension === 'sectors') {
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
    } else {
      // No comparison dimension - single line
      const key = `${chartStates[0]}_${chartSectors[0]}_${chartCategories[0]}`;
      lines.push(
        <Line
          key={key}
          type="monotone"
          dataKey={key}
          name={`${chartStates[0]} - ${chartCategories[0]} - ${chartSectors[0]}`}
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

  // Get section header text for each dimension
  const getSectionHeader = (dimension: 'states' | 'categories' | 'sectors'): { title: string } => {
    const baseTitles = {
      states: 'State / Region',
      categories: 'Categories',
      sectors: 'Sectors'
    };

    return {
      title: baseTitles[dimension]
    };
  };

  // Reset functions for each dimension
  const resetStates = () => {
    setSelectedStates(['ALL India']);
    if (multiSelectDimension === 'states') {
      setMultiSelectDimension(null);
    }
  };

  const resetCategories = () => {
    setSelectedCategories(['General Index (All Groups)']);
    if (multiSelectDimension === 'categories') {
      setMultiSelectDimension(null);
    }
  };

  const resetSectors = () => {
    setSelectedSectors(['Rural + Urban']);
    if (multiSelectDimension === 'sectors') {
      setMultiSelectDimension(null);
    }
  };

  const resetAllDimensions = () => {
    setSelectedStates(['ALL India']);
    setSelectedCategories(['General Index (All Groups)']);
    setSelectedSectors(['Rural + Urban']);
    setMultiSelectDimension(null);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8 text-center">
          <h1 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Consumer Price Index - India
          </h1>
        </div>

        {/* Toast Notifications */}
        {toasts.length > 0 && (
          <div className="fixed top-4 right-4 z-50 space-y-2">
            {toasts.map(toast => (
              <div
                key={toast.id}
                className="bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 shadow-xl animate-in slide-in-from-right duration-300 flex items-center gap-2"
              >
                <svg className="w-4 h-4 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-slate-200">{toast.message}</span>
              </div>
            ))}
          </div>
        )}

        {/* Chart Builder Panel */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-4 md:p-6 mb-6 md:mb-8 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-2">
            <div>
              <h2 className="text-lg font-semibold text-slate-200">Chart Builder</h2>
              <p className="text-sm text-slate-500 mt-1">
                Select multiple items in any dimension to compare them. Other dimensions will lock to single selection.
              </p>
            </div>

            {/* Add Chart / Edit Mode Buttons */}
            <div className="flex gap-2">
              <button
                onClick={resetAllDimensions}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm font-medium rounded-lg transition-colors duration-200 cursor-pointer"
              >
                Reset All
              </button>
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">

            {/* State / Region Selection - Inline like Categories */}
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
                  {getSectionHeader('states').title}
                </h2>
                {multiSelectDimension === 'states' && (
                  <span className="text-sm font-medium bg-cyan-600/30 text-cyan-300 px-2 py-0.5 rounded-full">
                    Comparing
                  </span>
                )}
                <button
                  onClick={resetStates}
                  className="ml-auto text-sm text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                  title="Reset to default"
                >
                  Reset
                </button>
              </div>

              {/* Search input for states */}
              <div ref={stateDropdownRef}>
                <input
                  type="text"
                  value={stateSearch}
                  onChange={(e) => setStateSearch(e.target.value)}
                  placeholder="Search states..."
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-sm mb-2"
                />
              </div>

              {/* Selected states section */}
              {selectedStates.length > 0 && (
                <div className="mb-3 pb-3 border-b border-slate-600/50">
                  <div className="flex flex-wrap gap-1.5">
                    {selectedStates.map((state) => {
                      const stateIndex = states.indexOf(state);
                      return (
                        <button
                          key={state}
                          onClick={() => toggleState(state)}
                          className="flex items-center gap-1.5 px-2 py-1 bg-cyan-600/20 border border-cyan-500/30 rounded-md text-sm text-cyan-300 hover:bg-cyan-600/30 transition-colors cursor-pointer"
                        >
                          {multiSelectDimension === 'states' && (
                            <span
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ backgroundColor: STATE_COLORS[stateIndex % STATE_COLORS.length] }}
                            ></span>
                          )}
                          <span className="truncate max-w-[120px]">{state}</span>
                          <svg className="w-3 h-3 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* States list - sorted alphabetically with ALL India first */}
              <div className="space-y-1.5 max-h-[200px] overflow-y-auto pr-1 scrollbar-thin">
                {filteredStates
                  .filter(state => !selectedStates.includes(state))
                  .sort((a, b) => {
                    if (a === 'ALL India') return -1;
                    if (b === 'ALL India') return 1;
                    return a.localeCompare(b);
                  })
                  .map((state) => {
                    const stateIndex = states.indexOf(state);

                    return (
                      <label
                        key={state}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all duration-200 bg-slate-700/30 border border-transparent hover:bg-slate-700/50"
                      >
                        <input
                          type="checkbox"
                          checked={false}
                          onChange={() => toggleState(state)}
                          className="w-4 h-4 rounded border-slate-500 text-cyan-500 focus:ring-cyan-500/50 focus:ring-offset-0 bg-slate-700"
                        />
                        <span className="text-sm text-slate-300 leading-tight truncate">{state}</span>
                        {multiSelectDimension === 'states' && (
                          <span
                            className="w-3 h-3 rounded-full flex-shrink-0 ml-auto opacity-30"
                            style={{ backgroundColor: STATE_COLORS[stateIndex % STATE_COLORS.length] }}
                          ></span>
                        )}
                      </label>
                    );
                  })}
              </div>
            </div>

            {/* Categories Selection */}
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
                  {getSectionHeader('categories').title}
                </h2>
                {multiSelectDimension === 'categories' && (
                  <span className="text-sm font-medium bg-blue-600/30 text-blue-300 px-2 py-0.5 rounded-full">
                    Comparing
                  </span>
                )}
                <button
                  onClick={resetCategories}
                  className="ml-auto text-sm text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                  title="Reset to default"
                >
                  Reset
                </button>
              </div>
              <div className="space-y-1.5 flex-1 overflow-y-auto pr-1 scrollbar-thin">
                {CATEGORIES.map((category) => {
                  const isSelected = selectedCategories.includes(category);

                  return (
                    <label
                      key={category}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all duration-200 ${
                        isSelected
                          ? 'bg-blue-600/20 border border-blue-500/30'
                          : 'bg-slate-700/30 border border-transparent hover:bg-slate-700/50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleCategory(category)}
                        className="w-4 h-4 rounded border-slate-500 text-blue-500 focus:ring-blue-500/50 focus:ring-offset-0 bg-slate-700"
                      />
                      <span className="text-sm text-slate-300 leading-tight truncate">{getCategoryDisplayName(category)}</span>
                      {isSelected && multiSelectDimension === 'categories' && (
                        <span
                          className="w-3 h-3 rounded-full flex-shrink-0 ml-auto"
                          style={{ backgroundColor: CATEGORY_COLORS[category] }}
                        ></span>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Sector Selection */}
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
                  {getSectionHeader('sectors').title}
                </h2>
                {multiSelectDimension === 'sectors' && (
                  <span className="text-sm font-medium bg-green-600/30 text-green-300 px-2 py-0.5 rounded-full">
                    Comparing
                  </span>
                )}
                <button
                  onClick={resetSectors}
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
                        onChange={() => toggleSector(sector)}
                        className="w-4 h-4 rounded border-slate-500 text-green-500 focus:ring-green-500/50 focus:ring-offset-0 bg-slate-700"
                      />
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

            {/* Date Range Selection */}
            <div className="space-y-2">
              <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
                Date Range
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1.5 uppercase tracking-wide">
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
                  <label className="block text-sm font-medium text-slate-500 mb-1.5 uppercase tracking-wide">
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
          {/* Comparing Label */}
          {multiSelectDimension && (
            <div className="mb-3 flex items-center gap-2">
              <span className="text-sm font-medium text-blue-400 uppercase tracking-wide flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Comparing {getDimensionDisplayName(multiSelectDimension)}
              </span>
            </div>
          )}

          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 md:mb-6 gap-2">
            <div>
              <h2 className="text-lg md:text-xl font-semibold text-slate-200">
                {editingChartId ? 'Editing Chart' : 'Live Preview'}
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                {generateChartTitle(selectedStates, selectedCategories, selectedSectors, multiSelectDimension)}
              </p>
            </div>
            <div className="text-sm md:text-sm text-slate-500">
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
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ paddingTop: '20px' }}
                  formatter={(value) => <span className="text-slate-300 text-sm md:text-sm">{value}</span>}
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
                  Build a chart using the filters above and click &apos;Add Chart&apos; to compare multiple views.
                </p>
                <p className="text-slate-500 text-sm">
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
                        <p className="text-sm text-slate-500 mt-1 line-clamp-2">{chart.subtitle}</p>
                        <p className="text-sm text-slate-600 mt-1">
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
                        <p className="text-slate-500 text-sm">No data available</p>
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
                          <Tooltip content={<CustomTooltip small />} />
                          <Legend
                            wrapperStyle={{ paddingTop: '10px' }}
                            formatter={(value) => <span className="text-slate-300 text-sm">{value}</span>}
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
        <div className="mt-6 text-center text-sm text-slate-600">
          Data Source: Ministry of Statistics and Programme Implementation, Government of India
        </div>
      </div>
    </main>
  );
}

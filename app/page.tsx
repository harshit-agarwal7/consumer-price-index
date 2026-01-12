'use client';

import { useState, useEffect, useRef } from 'react';
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

const SECTOR_COLORS = {
  'Rural': '#3b82f6',
  'Urban': '#10b981',
  'Rural + Urban': '#f59e0b'
};

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

export default function Home() {
  const [cpiData, setData] = useState<CPIData[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [selectedState, setSelectedState] = useState<string>('ALL India');
  const [states, setStates] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['General Index (All Groups)']);
  const [selectedSectors, setSelectedSectors] = useState<string[]>(['Rural', 'Urban', 'Rural + Urban']);
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });
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
  const stateDropdownRef = useRef<HTMLDivElement>(null);

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

  // Transform data for chart
  useEffect(() => {
    if (cpiData.length === 0 || selectedCategories.length === 0 || selectedSectors.length === 0) {
      setChartData([]);
      setHasNoData(true);
      return;
    }

    // Convert dateRange to normalized format (YYYY-MM) for comparison
    const normalizedStart = dateRange.start ? `${dateRange.start.split('-')[0]}-${monthToNumber(dateRange.start.split('-')[1])}` : null;
    const normalizedEnd = dateRange.end ? `${dateRange.end.split('-')[0]}-${monthToNumber(dateRange.end.split('-')[1])}` : null;

    // Filter data by selected state and categories
    const filteredData = cpiData.filter(row => {
      const dateKey = `${row.Year}-${monthToNumber(row.Month)}`;
      const inDateRange = (!normalizedStart || dateKey >= normalizedStart) &&
                          (!normalizedEnd || dateKey <= normalizedEnd);
      return row.State === selectedState &&
             selectedCategories.includes(row.Description) &&
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

      // Add values for each selected sector and category
      selectedSectors.forEach(sector => {
        const dataColumn = SECTOR_MAP[sector];
        const value = row[dataColumn as keyof CPIData];
        if (value && value !== '' && !isNaN(parseFloat(value))) {
          const key = `${sector}_${row.Description}`;
          dateEntry[key] = parseFloat(value);
        }
      });

      return acc;
    }, []);

    // Sort by the sortKey (YYYY-MM format)
    transformed.sort((a, b) => a.sortKey.localeCompare(b.sortKey));

    // Check if we have any actual data points
    const hasData = transformed.some(entry => {
      return selectedSectors.some(sector =>
        selectedCategories.some(category => {
          const key = `${sector}_${category}`;
          return entry[key] !== undefined;
        })
      );
    });

    setHasNoData(!hasData);
    setChartData(transformed);
  }, [cpiData, selectedState, selectedCategories, selectedSectors, dateRange]);

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const toggleSector = (sector: string) => {
    setSelectedSectors(prev =>
      prev.includes(sector)
        ? prev.filter(s => s !== sector)
        : [...prev, sector]
    );
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

        {/* Controls Panel */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-4 md:p-6 mb-6 md:mb-8 shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">

            {/* State Selection */}
            <div className="space-y-2">
              <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 bg-cyan-400 rounded-full"></span>
                State / Region
              </h2>
              <div className="relative" ref={stateDropdownRef}>
                <button
                  onClick={() => setIsStateDropdownOpen(!isStateDropdownOpen)}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-left text-slate-200 hover:bg-slate-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 flex items-center justify-between"
                >
                  <span className="truncate">{selectedState}</span>
                  <svg className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${isStateDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isStateDropdownOpen && (
                  <div className="absolute z-50 w-full mt-2 bg-slate-800 border border-slate-600/50 rounded-xl shadow-2xl overflow-hidden">
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
                    <div className="max-h-60 overflow-y-auto">
                      {filteredStates.map((state) => (
                        <button
                          key={state}
                          onClick={() => {
                            setSelectedState(state);
                            setIsStateDropdownOpen(false);
                            setStateSearch('');
                          }}
                          className={`w-full px-4 py-2.5 text-left text-sm transition-colors duration-150 ${
                            state === selectedState
                              ? 'bg-cyan-600/30 text-cyan-300'
                              : 'text-slate-300 hover:bg-slate-700/50'
                          }`}
                        >
                          {state}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Categories Selection */}
            <div className="space-y-2">
              <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                Categories
              </h2>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent">
                {CATEGORIES.map((category) => (
                  <label
                    key={category}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all duration-200 ${
                      selectedCategories.includes(category)
                        ? 'bg-blue-600/20 border border-blue-500/30'
                        : 'bg-slate-700/30 border border-transparent hover:bg-slate-700/50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(category)}
                      onChange={() => toggleCategory(category)}
                      className="w-4 h-4 rounded border-slate-500 text-blue-500 focus:ring-blue-500/50 focus:ring-offset-0 bg-slate-700"
                    />
                    <span className="text-sm text-slate-300 leading-tight">{category}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Sector Selection */}
            <div className="space-y-2">
              <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                Sectors
              </h2>
              <div className="space-y-2">
                {['Rural', 'Urban', 'Rural + Urban'].map((sector) => (
                  <label
                    key={sector}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 ${
                      selectedSectors.includes(sector)
                        ? 'bg-green-600/20 border border-green-500/30'
                        : 'bg-slate-700/30 border border-transparent hover:bg-slate-700/50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedSectors.includes(sector)}
                      onChange={() => toggleSector(sector)}
                      className="w-4 h-4 rounded border-slate-500 text-green-500 focus:ring-green-500/50 focus:ring-offset-0 bg-slate-700"
                    />
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: SECTOR_COLORS[sector as keyof typeof SECTOR_COLORS] }}
                      ></span>
                      <span className="text-sm font-medium text-slate-300">{sector}</span>
                    </div>
                  </label>
                ))}
              </div>
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
                      <select
                        value={startMonth}
                        onChange={(e) => setStartMonth(e.target.value)}
                        className="w-full px-3 py-2.5 pr-8 bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 appearance-none cursor-pointer"
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
                      <select
                        value={startYear}
                        onChange={(e) => setStartYear(e.target.value)}
                        className="w-full px-3 py-2.5 pr-8 bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 appearance-none cursor-pointer"
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
                      <select
                        value={endMonth}
                        onChange={(e) => setEndMonth(e.target.value)}
                        className="w-full px-3 py-2.5 pr-8 bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 appearance-none cursor-pointer"
                      >
                        {availableMonths.map(month => (
                          <option
                            key={month}
                            value={month}
                            disabled={isEndMonthDisabled(month)}
                            className={isEndMonthDisabled(month) ? 'text-slate-600' : ''}
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
                      <select
                        value={endYear}
                        onChange={(e) => setEndYear(e.target.value)}
                        className="w-full px-3 py-2.5 pr-8 bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 appearance-none cursor-pointer"
                      >
                        {availableYears.map(year => (
                          <option
                            key={year}
                            value={year}
                            disabled={isEndYearDisabled(year)}
                            className={isEndYearDisabled(year) ? 'text-slate-600' : ''}
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

        {/* Chart */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-4 md:p-6 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 md:mb-6 gap-2">
            <h2 className="text-lg md:text-xl font-semibold text-slate-200">Price Index Trends</h2>
            <div className="text-xs md:text-sm text-slate-500">
              {selectedState} • {startMonth?.slice(0, 3)} {startYear} - {endMonth?.slice(0, 3)} {endYear}
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
                {selectedSectors.map(sector =>
                  selectedCategories.map(category => (
                    <Line
                      key={`${sector}_${category}`}
                      type="monotone"
                      dataKey={`${sector}_${category}`}
                      name={`${sector} - ${category}`}
                      stroke={SECTOR_COLORS[sector as keyof typeof SECTOR_COLORS]}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 5, strokeWidth: 0 }}
                      connectNulls
                    />
                  ))
                )}
              </LineChart>
            </ResponsiveContainer>
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

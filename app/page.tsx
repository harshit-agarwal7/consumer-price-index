'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Papa from 'papaparse';

interface CPIData {
  Sector: string;
  Year: string;
  Month: string;
  [key: string]: string;
}

const SECTOR_COLORS = {
  'Rural': '#3b82f6',
  'Urban': '#10b981',
  'Rural+Urban': '#f59e0b'
};

export default function Home() {
  const [cpiData, setData] = useState<CPIData[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['General index']);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedSectors, setSelectedSectors] = useState<string[]>(['Rural', 'Urban', 'Rural+Urban']);
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

  // Fetch and parse CSV
  useEffect(() => {
    fetch('/All_India_Index_Upto_Feb24.csv')
      .then(response => response.text())
      .then(csvText => {
        Papa.parse(csvText, {
          header: true,
          complete: (result) => {
            const parsedData = result.data.filter((row: any) => row.Year) as CPIData[];
            setData(parsedData);

            // Extract categories from the first row (excluding Sector, Year, Month)
            if (parsedData.length > 0) {
              const excludeKeys = ['Sector', 'Year', 'Month'];
              const availableCategories = Object.keys(parsedData[0]).filter(
                key => !excludeKeys.includes(key) && key !== ''
              );
              setCategories(availableCategories);
            }

            // Extract unique dates and sort them
            const uniqueDates = Array.from(new Set(
              parsedData.map(row => `${row.Year}-${row.Month}`)
            )).sort();

            // Extract unique years
            const uniqueYears = Array.from(new Set(
              parsedData.map(row => row.Year)
            )).sort();
            setAvailableYears(uniqueYears);

            // Set default date range to full range
            if (uniqueDates.length > 0) {
              const firstDate = uniqueDates[0];
              const lastDate = uniqueDates[uniqueDates.length - 1];

              const [firstYear, firstMonth] = firstDate.split('-');
              const [lastYear, lastMonth] = lastDate.split('-');

              setStartYear(firstYear);
              setStartMonth(firstMonth);
              setEndYear(lastYear);
              setEndMonth(lastMonth);

              setDateRange({
                start: firstDate,
                end: lastDate
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

  // Helper function to format date as MM/YY
  const formatDate = (year: string, month: string): string => {
    const monthNum = monthToNumber(month);
    const yearShort = year.slice(-2); // Get last 2 digits of year
    return `${monthNum}/${yearShort}`;
  };

  // Transform data for chart
  useEffect(() => {
    if (cpiData.length === 0 || selectedCategories.length === 0) return;

    // Filter data by selected sectors and date range
    const filteredData = cpiData.filter(row => {
      const dateKey = `${row.Year}-${row.Month}`;
      const inDateRange = (!dateRange.start || dateKey >= dateRange.start) &&
                          (!dateRange.end || dateKey <= dateRange.end);
      return selectedSectors.includes(row.Sector) && inDateRange;
    });

    // Group data by Year-Month with sortable key
    const transformed = filteredData.reduce((acc: any[], row) => {
      const sortKey = `${row.Year}-${monthToNumber(row.Month)}`; // For sorting (YYYY-MM)
      const displayDate = formatDate(row.Year, row.Month); // For display (MM/YY)

      // Find if we already have this date
      let dateEntry = acc.find(item => item.sortKey === sortKey);

      if (!dateEntry) {
        dateEntry = { date: displayDate, sortKey };
        acc.push(dateEntry);
      }

      // Add values for each selected category
      selectedCategories.forEach(category => {
        const key = `${row.Sector}_${category}`;
        dateEntry[key] = parseFloat(row[category]);
      });

      return acc;
    }, []);

    // Sort by the sortKey (YYYY-MM format)
    transformed.sort((a, b) => a.sortKey.localeCompare(b.sortKey));

    setChartData(transformed);
  }, [cpiData, selectedCategories, selectedSectors, dateRange]);

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

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Consumer Price Index
          </h1>
          <p className="text-slate-600 text-lg">India - All India Index (Jan 2013 - Feb 2024)</p>
        </div>

        {/* Controls Panel */}
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Categories Selection */}
            <div>
              <h2 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <span className="w-1 h-6 bg-blue-500 rounded"></span>
                Categories
              </h2>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2 scrollbar-thin">
                {categories.map((category) => (
                  <label
                    key={category}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(category)}
                      onChange={() => toggleCategory(category)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-700">{category}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Sector Selection */}
            <div>
              <h2 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <span className="w-1 h-6 bg-green-500 rounded"></span>
                Sectors
              </h2>
              <div className="space-y-3">
                {['Rural', 'Urban', 'Rural+Urban'].map((sector) => (
                  <label
                    key={sector}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors border border-slate-200"
                  >
                    <input
                      type="checkbox"
                      checked={selectedSectors.includes(sector)}
                      onChange={() => toggleSector(sector)}
                      className="w-4 h-4 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                    />
                    <span className="text-sm font-medium text-slate-700">{sector}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Date Range Selection */}
            <div>
              <h2 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <span className="w-1 h-6 bg-purple-500 rounded"></span>
                Period
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-2">
                    Start Date
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={startMonth}
                      onChange={(e) => setStartMonth(e.target.value)}
                      className="px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white text-sm"
                    >
                      {availableMonths.map(month => (
                        <option key={month} value={month}>{month}</option>
                      ))}
                    </select>
                    <select
                      value={startYear}
                      onChange={(e) => setStartYear(e.target.value)}
                      className="px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white text-sm"
                    >
                      {availableYears.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-2">
                    End Date
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={endMonth}
                      onChange={(e) => setEndMonth(e.target.value)}
                      className="px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white text-sm"
                    >
                      {availableMonths.map(month => (
                        <option key={month} value={month}>{month}</option>
                      ))}
                    </select>
                    <select
                      value={endYear}
                      onChange={(e) => setEndYear(e.target.value)}
                      className="px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white text-sm"
                    >
                      {availableYears.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-6">Price Index Trends</h2>
          <ResponsiveContainer width="100%" height={500}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                stroke="#64748b"
              />
              <YAxis
                tick={{ fontSize: 12 }}
                stroke="#64748b"
                domain={[100, 'dataMax + 10']}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
              />
              <Legend
                wrapperStyle={{ paddingTop: '20px' }}
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
                    activeDot={{ r: 6 }}
                  />
                ))
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </main>
  );
}

'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { ChartDefinition, DateRange } from './types';
import { useCPIData, useChartBoard, useMultiSelect, useAccordion } from './hooks';
import { STATES } from './constants';
import { generateChartData, generateChartTitle, generateChartSubtitle, getHousingDataWarning, compareDates } from './utils';
import {
  ToastContainer,
  CPIEducation,
  StateFilter,
  CategoryFilter,
  SectorFilter,
  DateRangeFilter,
  MobileFilterAccordion,
  LivePreviewChart,
  ChartBoard,
  ConfirmDialog
} from './components';

export default function Home() {
  // Data fetching
  const { cpiData, availableYears, initialDateRange, isLoading } = useCPIData();

  // Chart board management
  const { chartBoard, addChart, updateChart, removeChart, duplicateChart } = useChartBoard();

  // Multi-select filter management
  const {
    selections,
    selectedStates,
    selectedCategories,
    selectedSectors,
    multiSelectDimension,
    toasts,
    toggle,
    reset,
    setSelected,
    setMultiSelectDimension,
  } = useMultiSelect();

  // Date range state
  const [startMonth, setStartMonth] = useState<string>('');
  const [startYear, setStartYear] = useState<string>('');
  const [endMonth, setEndMonth] = useState<string>('');
  const [endYear, setEndYear] = useState<string>('');

  // Derived date range object
  const dateRange = useMemo<DateRange>(() => ({
    startMonth,
    startYear,
    endMonth,
    endYear,
  }), [startMonth, startYear, endMonth, endYear]);

  // UI state
  const [stateSearch, setStateSearch] = useState<string>('');
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [editingChartId, setEditingChartId] = useState<string | null>(null);
  const [chartToDelete, setChartToDelete] = useState<string | null>(null);
  const [duplicateToast, setDuplicateToast] = useState<string | null>(null);

  // Chart data
  const [chartData, setChartData] = useState<any[]>([]);
  const [hasNoData, setHasNoData] = useState<boolean>(false);

  // Refs
  const chartPreviewRef = useRef<HTMLDivElement>(null);

  // Mobile filter accordion state
  const { expandedId, toggle: toggleAccordion } = useAccordion(null);

  // Handle window resize for responsive chart height
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Set initial date range when data loads
  useEffect(() => {
    if (initialDateRange) {
      setStartMonth(initialDateRange.startMonth);
      setStartYear(initialDateRange.startYear);
      setEndMonth(initialDateRange.endMonth);
      setEndYear(initialDateRange.endYear);
    }
  }, [initialDateRange]);

  // Validate end month when end year changes
  useEffect(() => {
    if (endYear && startYear && endMonth && startMonth) {
      if (endYear === startYear && compareDates(startYear, startMonth, endYear, endMonth) > 0) {
        setEndMonth(startMonth);
      }
    }
  }, [endYear, startYear, startMonth, endMonth]);

  // Validate start month when start year changes
  useEffect(() => {
    if (startYear && endYear && startMonth && endMonth) {
      if (startYear === endYear && compareDates(startYear, startMonth, endYear, endMonth) > 0) {
        setStartMonth(endMonth);
      }
    }
  }, [startYear, endYear, startMonth, endMonth]);

  // Transform data for live preview chart
  useEffect(() => {
    const result = generateChartData(cpiData, selections, dateRange);
    setChartData(result.chartData);
    setHasNoData(result.hasNoData);
  }, [cpiData, selections, dateRange]);

  // Housing warning
  const housingWarning = getHousingDataWarning(selections);

  // Add chart to board
  const handleAddChart = () => {
    const newChart: ChartDefinition = {
      id: Date.now().toString(),
      title: generateChartTitle(selections, multiSelectDimension, dateRange),
      subtitle: generateChartSubtitle(selections),
      selections: {
        states: [...selectedStates],
        categories: [...selectedCategories],
        sectors: [...selectedSectors],
      },
      dateRange: { ...dateRange },
      multiSelectDimension
    };
    addChart(newChart);
  };

  // Save changes to edited chart
  const handleSaveChanges = () => {
    if (!editingChartId) return;

    updateChart(editingChartId, {
      title: generateChartTitle(selections, multiSelectDimension, dateRange),
      subtitle: generateChartSubtitle(selections),
      selections: {
        states: [...selectedStates],
        categories: [...selectedCategories],
        sectors: [...selectedSectors],
      },
      dateRange: { ...dateRange },
      multiSelectDimension
    });

    setEditingChartId(null);
  };

  // Cancel editing
  const handleCancelEditing = () => {
    setEditingChartId(null);
    reset();
  };

  // Edit a chart
  const handleEditChart = (chart: ChartDefinition) => {
    setSelected('states', chart.selections.states);
    setSelected('categories', chart.selections.categories);
    setSelected('sectors', chart.selections.sectors);
    setStartMonth(chart.dateRange.startMonth);
    setStartYear(chart.dateRange.startYear);
    setEndMonth(chart.dateRange.endMonth);
    setEndYear(chart.dateRange.endYear);
    setMultiSelectDimension(chart.multiSelectDimension);
    setEditingChartId(chart.id);

    setTimeout(() => {
      chartPreviewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  // Request to remove chart (shows confirmation dialog)
  const handleRequestRemoveChart = (chartId: string) => {
    setChartToDelete(chartId);
  };

  // Confirm remove chart
  const handleConfirmRemoveChart = () => {
    if (chartToDelete) {
      removeChart(chartToDelete);
      if (editingChartId === chartToDelete) {
        setEditingChartId(null);
      }
      setChartToDelete(null);
    }
  };

  // Cancel remove chart
  const handleCancelRemoveChart = () => {
    setChartToDelete(null);
  };

  // Duplicate chart with notification and scroll
  const handleDuplicateChart = (chart: ChartDefinition) => {
    const newChartId = duplicateChart(chart);
    setDuplicateToast('Chart duplicated successfully');

    // Clear toast after 3 seconds
    setTimeout(() => {
      setDuplicateToast(null);
    }, 3000);

    // Scroll to the new chart after a short delay to allow render
    setTimeout(() => {
      const newChartElement = document.querySelector(`[data-chart-id="${newChartId}"]`);
      if (newChartElement) {
        newChartElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  // Reset date range
  const handleResetDateRange = () => {
    if (availableYears.length > 0) {
      setStartYear(availableYears[0]);
      setStartMonth('January');
      setEndYear(availableYears[availableYears.length - 1]);
      setEndMonth('November');
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-slate-400">Loading data...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-3 md:px-6 py-4 md:py-6">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8 text-center">
          <h1 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Consumer Price Index - India
          </h1>
        </div>

        {/* Main Content - Filters and Chart side by side */}
        <div className="flex flex-col lg:flex-row gap-4 md:gap-6 mb-6 md:mb-8">
          {/* Filters Panel - appears second on mobile, first on desktop */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-4 md:p-5 shadow-xl lg:w-[560px] flex-shrink-0 self-center lg:self-auto order-2 lg:order-1">
            {isMobile ? (
              <MobileFilterAccordion
                sections={[
                  {
                    id: 'states',
                    title: 'States',
                    dimension: 'states',
                    content: (
                      <StateFilter
                        states={STATES}
                        selectedStates={selectedStates}
                        multiSelectDimension={multiSelectDimension}
                        stateSearch={stateSearch}
                        onStateSearchChange={setStateSearch}
                        onToggleState={(state) => toggle('states', state)}
                        onReset={() => reset('states')}
                        hideHeader
                      />
                    )
                  },
                  {
                    id: 'categories',
                    title: 'Categories',
                    dimension: 'categories',
                    content: (
                      <CategoryFilter
                        selectedCategories={selectedCategories}
                        multiSelectDimension={multiSelectDimension}
                        onToggleCategory={(category) => toggle('categories', category)}
                        onReset={() => reset('categories')}
                        hideHeader
                      />
                    )
                  },
                  {
                    id: 'sectors',
                    title: 'Sectors',
                    dimension: 'sectors',
                    content: (
                      <SectorFilter
                        selectedSectors={selectedSectors}
                        multiSelectDimension={multiSelectDimension}
                        onToggleSector={(sector) => toggle('sectors', sector)}
                        onReset={() => reset('sectors')}
                        hideHeader
                      />
                    )
                  },
                  {
                    id: 'dateRange',
                    title: 'Date Range',
                    dimension: 'dateRange',
                    content: (
                      <DateRangeFilter
                        startMonth={startMonth}
                        startYear={startYear}
                        endMonth={endMonth}
                        endYear={endYear}
                        availableYears={availableYears}
                        onStartMonthChange={setStartMonth}
                        onStartYearChange={setStartYear}
                        onEndMonthChange={setEndMonth}
                        onEndYearChange={setEndYear}
                        onReset={handleResetDateRange}
                        hideHeader
                      />
                    )
                  },
                ]}
                expandedId={expandedId}
                onToggle={toggleAccordion}
                multiSelectDimension={multiSelectDimension}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                {/* State Filter */}
                <StateFilter
                  states={STATES}
                  selectedStates={selectedStates}
                  multiSelectDimension={multiSelectDimension}
                  stateSearch={stateSearch}
                  onStateSearchChange={setStateSearch}
                  onToggleState={(state) => toggle('states', state)}
                  onReset={() => reset('states')}
                />

                {/* Category Filter */}
                <CategoryFilter
                  selectedCategories={selectedCategories}
                  multiSelectDimension={multiSelectDimension}
                  onToggleCategory={(category) => toggle('categories', category)}
                  onReset={() => reset('categories')}
                />

                {/* Sector Filter */}
                <SectorFilter
                  selectedSectors={selectedSectors}
                  multiSelectDimension={multiSelectDimension}
                  onToggleSector={(sector) => toggle('sectors', sector)}
                  onReset={() => reset('sectors')}
                />

                {/* Date Range Filter */}
                <DateRangeFilter
                  startMonth={startMonth}
                  startYear={startYear}
                  endMonth={endMonth}
                  endYear={endYear}
                  availableYears={availableYears}
                  onStartMonthChange={setStartMonth}
                  onStartYearChange={setStartYear}
                  onEndMonthChange={setEndMonth}
                  onEndYearChange={setEndYear}
                  onReset={handleResetDateRange}
                />
              </div>
            )}

            {/* Reset All Filters Button */}
            <div className="mt-4 pt-4 border-t border-slate-700/50">
              <button
                onClick={() => reset()}
                className="px-4 py-2.5 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 text-sm font-medium rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Reset All Filters
              </button>
            </div>
          </div>

          {/* Live Preview Chart - appears first on mobile, second on desktop */}
          <div className="order-1 lg:order-2 flex-1 min-w-0 flex flex-col">
            <LivePreviewChart
              chartData={chartData}
              hasNoData={hasNoData}
              housingWarning={housingWarning}
              selections={selections}
              multiSelectDimension={multiSelectDimension}
              allStates={STATES}
              dateRange={dateRange}
              editingChartId={editingChartId}
              chartPreviewRef={chartPreviewRef}
              isMobile={isMobile}
              onAddChart={handleAddChart}
              onSaveChanges={handleSaveChanges}
              onCancelEditing={handleCancelEditing}
            />
          </div>
        </div>

        {/* Chart Board */}
        <ChartBoard
          chartBoard={chartBoard}
          cpiData={cpiData}
          allStates={STATES}
          editingChartId={editingChartId}
          isMobile={isMobile}
          onEditChart={handleEditChart}
          onDuplicateChart={handleDuplicateChart}
          onRemoveChart={handleRequestRemoveChart}
        />

        {/* CPI Educational Information Section */}
        <CPIEducation />

        {/* Footer */}
        <footer className="mt-8 md:mt-12">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6 md:p-8 shadow-xl">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Story Section - Left */}
              <div className="lg:w-[58%]">
                <h3 className="text-lg font-semibold text-slate-200 mb-4">Why I Built This</h3>
                <div className="space-y-4 text-sm text-slate-400 leading-relaxed">
                  <p>
                    This website started out of a simple frustration. I couldn&apos;t find a single place where I could easily see how consumer prices have changed over time — whether across different years, across states, or across categories and sectors. The information existed, but it felt scattered, hard to explore, and not very intuitive.
                  </p>
                  <p>
                    Along the way, I also realized that my own understanding of the Consumer Price Index (CPI) was pretty surface-level. So the project became a way for me to learn as well — to break down what CPI actually means, why it&apos;s tracked, and why it matters in everyday life.
                  </p>
                  <p>
                    What began as a small personal project slowly grew into an attempt to make price data easier to explore, easier to understand, and a little less intimidating for anyone who&apos;s curious about inflation and cost-of-living trends.
                  </p>
                </div>
              </div>

              {/* Divider */}
              <div className="hidden lg:block w-px bg-gradient-to-b from-transparent via-slate-600 to-transparent"></div>

              {/* Links Section - Right */}
              <div className="flex flex-col gap-4 lg:flex-1">
                <h3 className="text-lg font-semibold text-slate-200 mb-2">Quick Links</h3>
                {/* Data Source */}
                <a
                  href="https://cpi.mospi.gov.in/TimeSeries_2012.aspx"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 px-4 py-3 bg-slate-700/50 hover:bg-slate-700 rounded-xl border border-slate-600/50 hover:border-slate-500 transition-all duration-200"
                >
                  <div className="p-2 bg-slate-600/50 group-hover:bg-slate-600 rounded-lg transition-colors">
                    <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-slate-500 font-medium">Data Source</p>
                    <p className="text-slate-300 group-hover:text-white font-medium transition-colors">Ministry of Statistics and Programme Implementation</p>
                  </div>
                  <svg className="w-4 h-4 text-slate-500 group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>

                {/* GitHub and LinkedIn Row */}
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* GitHub Link */}
                  <a
                    href="https://github.com/harshit-agarwal7/consumer-price-index"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-3 px-4 py-3 bg-slate-700/50 hover:bg-slate-700 rounded-xl border border-slate-600/50 hover:border-slate-500 transition-all duration-200 flex-1"
                  >
                    <div className="p-2 bg-slate-600/50 group-hover:bg-slate-600 rounded-lg transition-colors">
                      <svg className="w-5 h-5 text-slate-300" fill="currentColor" viewBox="0 0 24 24">
                        <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-medium">Github</p>
                      <p className="text-slate-300 group-hover:text-white font-medium transition-colors">View Repo</p>
                    </div>
                    <svg className="w-4 h-4 text-slate-500 group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </a>

                  {/* Author Link */}
                  <a
                    href="https://www.linkedin.com/in/harshit-agarwal77/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-3 px-4 py-3 bg-slate-700/50 hover:bg-slate-700 rounded-xl border border-slate-600/50 hover:border-slate-500 transition-all duration-200 flex-1"
                  >
                    <div className="p-2 bg-slate-600/50 group-hover:bg-slate-600 rounded-lg transition-colors">
                      <svg className="w-5 h-5 text-slate-300" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-medium">Created by</p>
                      <p className="text-slate-300 group-hover:text-white font-medium transition-colors">Harshit Agarwal</p>
                    </div>
                    <svg className="w-4 h-4 text-slate-500 group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} />

      {/* Duplicate Toast */}
      {duplicateToast && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg shadow-lg flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {duplicateToast}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={chartToDelete !== null}
        title="Delete Chart"
        message="Are you sure you want to delete this chart? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleConfirmRemoveChart}
        onCancel={handleCancelRemoveChart}
        variant="danger"
      />
    </main>
  );
}

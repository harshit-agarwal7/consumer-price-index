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
        <div className="mt-6 text-center text-sm text-slate-600">
          Data Source: Ministry of Statistics and Programme Implementation, Government of India
        </div>
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

'use client';

import { useState, useEffect } from 'react';
import { ChartDefinition } from '../types';

interface UseChartBoardReturn {
  chartBoard: ChartDefinition[];
  addChart: (chart: ChartDefinition) => void;
  updateChart: (chartId: string, updates: Partial<ChartDefinition>) => void;
  removeChart: (chartId: string) => void;
  duplicateChart: (chart: ChartDefinition) => string;
}

export const useChartBoard = (): UseChartBoardReturn => {
  const [chartBoard, setChartBoard] = useState<ChartDefinition[]>([]);

  // Load from localStorage on mount
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

  // Save to localStorage whenever chartBoard changes
  useEffect(() => {
    if (chartBoard.length > 0) {
      localStorage.setItem('cpi-chart-board', JSON.stringify(chartBoard));
    } else {
      localStorage.removeItem('cpi-chart-board');
    }
  }, [chartBoard]);

  const addChart = (chart: ChartDefinition) => {
    setChartBoard(prev => [...prev, chart]);
  };

  const updateChart = (chartId: string, updates: Partial<ChartDefinition>) => {
    setChartBoard(prev => prev.map(chart => {
      if (chart.id === chartId) {
        return { ...chart, ...updates };
      }
      return chart;
    }));
  };

  const removeChart = (chartId: string) => {
    setChartBoard(prev => prev.filter(c => c.id !== chartId));
  };

  const duplicateChart = (chart: ChartDefinition): string => {
    const newId = Date.now().toString();
    const newChart: ChartDefinition = {
      ...chart,
      id: newId,
      title: chart.title + ' (Copy)'
    };
    setChartBoard(prev => [...prev, newChart]);
    return newId;
  };

  return { chartBoard, addChart, updateChart, removeChart, duplicateChart };
};

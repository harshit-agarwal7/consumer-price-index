'use client';

import { useState, useCallback, useMemo } from 'react';
import { MultiSelectDimension, Selections, ToastMessage } from '../types';

export type DimensionKey = 'states' | 'categories' | 'sectors';

// Default values for each dimension
const DIMENSION_DEFAULTS: Record<DimensionKey, string> = {
  states: 'ALL India',
  categories: 'General Index (All Groups)',
  sectors: 'Rural + Urban',
};

// Toast messages for dimension switching
const DIMENSION_TOAST_MESSAGES: Record<DimensionKey, string> = {
  states: 'Switched comparison to State / Region',
  categories: 'Switched comparison to Categories',
  sectors: 'Switched comparison to Sectors',
};

interface UseMultiSelectReturn {
  selections: Selections;
  selectedStates: string[];
  selectedCategories: string[];
  selectedSectors: string[];
  multiSelectDimension: MultiSelectDimension;
  toasts: ToastMessage[];
  toggle: (dimension: DimensionKey, item: string) => void;
  reset: (dimension?: DimensionKey) => void;
  setSelected: (dimension: DimensionKey, items: string[]) => void;
  setMultiSelectDimension: (dimension: MultiSelectDimension) => void;
}

export const useMultiSelect = (): UseMultiSelectReturn => {
  const [selectedStates, setSelectedStates] = useState<string[]>([DIMENSION_DEFAULTS.states]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([DIMENSION_DEFAULTS.categories]);
  const [selectedSectors, setSelectedSectors] = useState<string[]>([DIMENSION_DEFAULTS.sectors]);
  const [multiSelectDimension, setMultiSelectDimension] = useState<MultiSelectDimension>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  // Get the current selection and setter for a given dimension
  const getDimensionState = useCallback((dimension: DimensionKey) => {
    const dimensionMap = {
      states: { selected: selectedStates, setSelected: setSelectedStates },
      categories: { selected: selectedCategories, setSelected: setSelectedCategories },
      sectors: { selected: selectedSectors, setSelected: setSelectedSectors },
    };
    return dimensionMap[dimension];
  }, [selectedStates, selectedCategories, selectedSectors]);

  // Get other dimensions (excluding the current one)
  const getOtherDimensions = useCallback((currentDimension: DimensionKey): DimensionKey[] => {
    const allDimensions: DimensionKey[] = ['states', 'categories', 'sectors'];
    return allDimensions.filter(d => d !== currentDimension);
  }, []);

  // Generic toggle function for any dimension
  const toggle = useCallback((dimension: DimensionKey, item: string) => {
    const { selected, setSelected } = getDimensionState(dimension);
    const isSelected = selected.includes(item);

    if (isSelected) {
      // Deselecting an item
      const newSelection = selected.filter(s => s !== item);

      // States dimension: reset to default if empty
      if (dimension === 'states' && newSelection.length === 0) {
        setSelected([DIMENSION_DEFAULTS.states]);
        if (multiSelectDimension === dimension) {
          setMultiSelectDimension(null);
        }
        return;
      }

      // Other dimensions: prevent empty selection
      if (newSelection.length === 0) return;

      setSelected(newSelection);

      // Reset multi-select dimension if only one item remains
      if (newSelection.length === 1 && multiSelectDimension === dimension) {
        setMultiSelectDimension(null);
      }
    } else {
      // Selecting a new item
      if (selected.length === 0) {
        setSelected([item]);
      } else if (multiSelectDimension === dimension || multiSelectDimension === null) {
        // Same dimension or no active comparison - add to selection
        if (multiSelectDimension === null) {
          setMultiSelectDimension(dimension);
        }
        setSelected(prev => [...prev, item]);
      } else {
        // Switching comparison dimension
        const prevDimension = multiSelectDimension;
        setMultiSelectDimension(dimension);
        setSelected(prev => [...prev, item]);

        // Collapse other dimensions to their last selected item
        getOtherDimensions(dimension).forEach(otherDimension => {
          if (otherDimension === prevDimension) {
            const { selected: otherSelected, setSelected: setOtherSelected } = getDimensionState(otherDimension);
            if (otherSelected.length > 1) {
              setOtherSelected([otherSelected[otherSelected.length - 1]]);
            }
          }
        });

        showToast(DIMENSION_TOAST_MESSAGES[dimension]);
      }
    }
  }, [getDimensionState, getOtherDimensions, multiSelectDimension, showToast]);

  // Generic reset function - resets one dimension or all if no argument
  const reset = useCallback((dimension?: DimensionKey) => {
    if (dimension) {
      const { setSelected } = getDimensionState(dimension);
      setSelected([DIMENSION_DEFAULTS[dimension]]);
      if (multiSelectDimension === dimension) {
        setMultiSelectDimension(null);
      }
    } else {
      // Reset all dimensions
      setSelectedStates([DIMENSION_DEFAULTS.states]);
      setSelectedCategories([DIMENSION_DEFAULTS.categories]);
      setSelectedSectors([DIMENSION_DEFAULTS.sectors]);
      setMultiSelectDimension(null);
    }
  }, [getDimensionState, multiSelectDimension]);

  // Generic setter for any dimension
  const setSelected = useCallback((dimension: DimensionKey, items: string[]) => {
    const { setSelected: setter } = getDimensionState(dimension);
    setter(items);
  }, [getDimensionState]);

  // Derived selections object for convenience
  const selections = useMemo<Selections>(() => ({
    states: selectedStates,
    categories: selectedCategories,
    sectors: selectedSectors,
  }), [selectedStates, selectedCategories, selectedSectors]);

  return {
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
  };
};

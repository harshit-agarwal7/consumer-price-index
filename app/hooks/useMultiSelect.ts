'use client';

import { useState, useCallback } from 'react';
import { MultiSelectDimension, ToastMessage } from '../types';

type DimensionKey = 'states' | 'categories' | 'sectors';

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
  selectedStates: string[];
  selectedCategories: string[];
  selectedSectors: string[];
  multiSelectDimension: MultiSelectDimension;
  toasts: ToastMessage[];
  toggleState: (state: string) => void;
  toggleCategory: (category: string) => void;
  toggleSector: (sector: string) => void;
  resetStates: () => void;
  resetCategories: () => void;
  resetSectors: () => void;
  resetAllDimensions: () => void;
  setSelectedStates: (states: string[]) => void;
  setSelectedCategories: (categories: string[]) => void;
  setSelectedSectors: (sectors: string[]) => void;
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
  const toggleDimension = useCallback((dimension: DimensionKey, item: string) => {
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

  // Generic reset function for any dimension
  const resetDimension = useCallback((dimension: DimensionKey) => {
    const { setSelected } = getDimensionState(dimension);
    setSelected([DIMENSION_DEFAULTS[dimension]]);
    if (multiSelectDimension === dimension) {
      setMultiSelectDimension(null);
    }
  }, [getDimensionState, multiSelectDimension]);

  // Specific toggle handlers (for backwards compatibility)
  const toggleState = useCallback((state: string) => toggleDimension('states', state), [toggleDimension]);
  const toggleCategory = useCallback((category: string) => toggleDimension('categories', category), [toggleDimension]);
  const toggleSector = useCallback((sector: string) => toggleDimension('sectors', sector), [toggleDimension]);

  // Specific reset handlers (for backwards compatibility)
  const resetStates = useCallback(() => resetDimension('states'), [resetDimension]);
  const resetCategories = useCallback(() => resetDimension('categories'), [resetDimension]);
  const resetSectors = useCallback(() => resetDimension('sectors'), [resetDimension]);

  const resetAllDimensions = useCallback(() => {
    setSelectedStates([DIMENSION_DEFAULTS.states]);
    setSelectedCategories([DIMENSION_DEFAULTS.categories]);
    setSelectedSectors([DIMENSION_DEFAULTS.sectors]);
    setMultiSelectDimension(null);
  }, []);

  return {
    selectedStates,
    selectedCategories,
    selectedSectors,
    multiSelectDimension,
    toasts,
    toggleState,
    toggleCategory,
    toggleSector,
    resetStates,
    resetCategories,
    resetSectors,
    resetAllDimensions,
    setSelectedStates,
    setSelectedCategories,
    setSelectedSectors,
    setMultiSelectDimension
  };
};

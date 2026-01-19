'use client';

import { useState, useCallback } from 'react';
import { MultiSelectDimension, ToastMessage } from '../types';

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
  const [selectedStates, setSelectedStates] = useState<string[]>(['ALL India']);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['General Index (All Groups)']);
  const [selectedSectors, setSelectedSectors] = useState<string[]>(['Rural + Urban']);
  const [multiSelectDimension, setMultiSelectDimension] = useState<MultiSelectDimension>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  const toggleState = useCallback((state: string) => {
    const isSelected = selectedStates.includes(state);

    if (isSelected) {
      const newSelection = selectedStates.filter(s => s !== state);

      if (newSelection.length === 0) {
        setSelectedStates(['ALL India']);
        if (multiSelectDimension === 'states') {
          setMultiSelectDimension(null);
        }
        return;
      }

      setSelectedStates(newSelection);

      if (newSelection.length === 1 && multiSelectDimension === 'states') {
        setMultiSelectDimension(null);
      }
    } else {
      if (selectedStates.length === 0) {
        setSelectedStates([state]);
      } else if (multiSelectDimension === 'states' || multiSelectDimension === null) {
        if (multiSelectDimension === null) {
          setMultiSelectDimension('states');
        }
        setSelectedStates(prev => [...prev, state]);
      } else {
        const prevDimension = multiSelectDimension;
        setMultiSelectDimension('states');
        setSelectedStates(prev => [...prev, state]);

        if (prevDimension === 'categories' && selectedCategories.length > 1) {
          setSelectedCategories([selectedCategories[selectedCategories.length - 1]]);
        }
        if (prevDimension === 'sectors' && selectedSectors.length > 1) {
          setSelectedSectors([selectedSectors[selectedSectors.length - 1]]);
        }

        showToast('Switched comparison to State / Region');
      }
    }
  }, [selectedStates, selectedCategories, selectedSectors, multiSelectDimension, showToast]);

  const toggleCategory = useCallback((category: string) => {
    const isSelected = selectedCategories.includes(category);

    if (isSelected) {
      const newSelection = selectedCategories.filter(c => c !== category);
      if (newSelection.length === 0) return;

      setSelectedCategories(newSelection);

      if (newSelection.length === 1 && multiSelectDimension === 'categories') {
        setMultiSelectDimension(null);
      }
    } else {
      if (selectedCategories.length === 0) {
        setSelectedCategories([category]);
      } else if (multiSelectDimension === 'categories' || multiSelectDimension === null) {
        if (multiSelectDimension === null) {
          setMultiSelectDimension('categories');
        }
        setSelectedCategories(prev => [...prev, category]);
      } else {
        const prevDimension = multiSelectDimension;
        setMultiSelectDimension('categories');
        setSelectedCategories(prev => [...prev, category]);

        if (prevDimension === 'states' && selectedStates.length > 1) {
          setSelectedStates([selectedStates[selectedStates.length - 1]]);
        }
        if (prevDimension === 'sectors' && selectedSectors.length > 1) {
          setSelectedSectors([selectedSectors[selectedSectors.length - 1]]);
        }

        showToast('Switched comparison to Categories');
      }
    }
  }, [selectedCategories, selectedStates, selectedSectors, multiSelectDimension, showToast]);

  const toggleSector = useCallback((sector: string) => {
    const isSelected = selectedSectors.includes(sector);

    if (isSelected) {
      const newSelection = selectedSectors.filter(s => s !== sector);
      if (newSelection.length === 0) return;

      setSelectedSectors(newSelection);

      if (newSelection.length === 1 && multiSelectDimension === 'sectors') {
        setMultiSelectDimension(null);
      }
    } else {
      if (selectedSectors.length === 0) {
        setSelectedSectors([sector]);
      } else if (multiSelectDimension === 'sectors' || multiSelectDimension === null) {
        if (multiSelectDimension === null) {
          setMultiSelectDimension('sectors');
        }
        setSelectedSectors(prev => [...prev, sector]);
      } else {
        const prevDimension = multiSelectDimension;
        setMultiSelectDimension('sectors');
        setSelectedSectors(prev => [...prev, sector]);

        if (prevDimension === 'states' && selectedStates.length > 1) {
          setSelectedStates([selectedStates[selectedStates.length - 1]]);
        }
        if (prevDimension === 'categories' && selectedCategories.length > 1) {
          setSelectedCategories([selectedCategories[selectedCategories.length - 1]]);
        }

        showToast('Switched comparison to Sectors');
      }
    }
  }, [selectedSectors, selectedStates, selectedCategories, multiSelectDimension, showToast]);

  const resetStates = useCallback(() => {
    setSelectedStates(['ALL India']);
    if (multiSelectDimension === 'states') {
      setMultiSelectDimension(null);
    }
  }, [multiSelectDimension]);

  const resetCategories = useCallback(() => {
    setSelectedCategories(['General Index (All Groups)']);
    if (multiSelectDimension === 'categories') {
      setMultiSelectDimension(null);
    }
  }, [multiSelectDimension]);

  const resetSectors = useCallback(() => {
    setSelectedSectors(['Rural + Urban']);
    if (multiSelectDimension === 'sectors') {
      setMultiSelectDimension(null);
    }
  }, [multiSelectDimension]);

  const resetAllDimensions = useCallback(() => {
    setSelectedStates(['ALL India']);
    setSelectedCategories(['General Index (All Groups)']);
    setSelectedSectors(['Rural + Urban']);
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

import { renderHook, act } from '@testing-library/react';
import { useMultiSelect } from './useMultiSelect';

describe('useMultiSelect', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('initial state', () => {
    it('should have default values for all dimensions', () => {
      const { result } = renderHook(() => useMultiSelect());

      expect(result.current.selectedStates).toEqual(['ALL India']);
      expect(result.current.selectedCategories).toEqual(['General Index (All Groups)']);
      expect(result.current.selectedSectors).toEqual(['Rural + Urban']);
      expect(result.current.multiSelectDimension).toBeNull();
      expect(result.current.toasts).toEqual([]);
    });
  });

  describe('toggle states', () => {
    it('should add a new state to selection', () => {
      const { result } = renderHook(() => useMultiSelect());

      act(() => {
        result.current.toggle('states', 'Delhi');
      });

      expect(result.current.selectedStates).toEqual(['ALL India', 'Delhi']);
      expect(result.current.multiSelectDimension).toBe('states');
    });

    it('should remove a state from selection', () => {
      const { result } = renderHook(() => useMultiSelect());

      act(() => {
        result.current.toggle('states', 'Delhi');
      });

      act(() => {
        result.current.toggle('states', 'Delhi');
      });

      expect(result.current.selectedStates).toEqual(['ALL India']);
      expect(result.current.multiSelectDimension).toBeNull();
    });

    it('should reset to default when all states are deselected', () => {
      const { result } = renderHook(() => useMultiSelect());

      act(() => {
        result.current.toggle('states', 'ALL India');
      });

      expect(result.current.selectedStates).toEqual(['ALL India']);
    });
  });

  describe('toggle categories', () => {
    it('should add a new category to selection', () => {
      const { result } = renderHook(() => useMultiSelect());

      act(() => {
        result.current.toggle('categories', 'Food and beverages');
      });

      expect(result.current.selectedCategories).toEqual(['General Index (All Groups)', 'Food and beverages']);
      expect(result.current.multiSelectDimension).toBe('categories');
    });

    it('should remove a category from selection', () => {
      const { result } = renderHook(() => useMultiSelect());

      act(() => {
        result.current.toggle('categories', 'Food and beverages');
      });

      act(() => {
        result.current.toggle('categories', 'Food and beverages');
      });

      expect(result.current.selectedCategories).toEqual(['General Index (All Groups)']);
      expect(result.current.multiSelectDimension).toBeNull();
    });

    it('should not allow empty selection for categories', () => {
      const { result } = renderHook(() => useMultiSelect());

      act(() => {
        result.current.toggle('categories', 'General Index (All Groups)');
      });

      expect(result.current.selectedCategories).toEqual(['General Index (All Groups)']);
    });
  });

  describe('toggle sectors', () => {
    it('should add a new sector to selection', () => {
      const { result } = renderHook(() => useMultiSelect());

      act(() => {
        result.current.toggle('sectors', 'Rural');
      });

      expect(result.current.selectedSectors).toEqual(['Rural + Urban', 'Rural']);
      expect(result.current.multiSelectDimension).toBe('sectors');
    });

    it('should remove a sector from selection', () => {
      const { result } = renderHook(() => useMultiSelect());

      act(() => {
        result.current.toggle('sectors', 'Rural');
      });

      act(() => {
        result.current.toggle('sectors', 'Rural');
      });

      expect(result.current.selectedSectors).toEqual(['Rural + Urban']);
      expect(result.current.multiSelectDimension).toBeNull();
    });

    it('should not allow empty selection for sectors', () => {
      const { result } = renderHook(() => useMultiSelect());

      act(() => {
        result.current.toggle('sectors', 'Rural + Urban');
      });

      expect(result.current.selectedSectors).toEqual(['Rural + Urban']);
    });
  });

  describe('dimension switching', () => {
    it('should switch from states to categories comparison', () => {
      const { result } = renderHook(() => useMultiSelect());

      // First select multiple states
      act(() => {
        result.current.toggle('states', 'Delhi');
      });
      act(() => {
        result.current.toggle('states', 'Maharashtra');
      });

      expect(result.current.selectedStates).toEqual(['ALL India', 'Delhi', 'Maharashtra']);
      expect(result.current.multiSelectDimension).toBe('states');

      // Now select a second category
      act(() => {
        result.current.toggle('categories', 'Food and beverages');
      });

      expect(result.current.multiSelectDimension).toBe('categories');
      // States should be collapsed to last selected
      expect(result.current.selectedStates).toEqual(['Maharashtra']);
      expect(result.current.selectedCategories).toEqual(['General Index (All Groups)', 'Food and beverages']);
    });

    it('should switch from categories to sectors comparison', () => {
      const { result } = renderHook(() => useMultiSelect());

      // First select multiple categories
      act(() => {
        result.current.toggle('categories', 'Food and beverages');
      });

      expect(result.current.multiSelectDimension).toBe('categories');

      // Now select a second sector
      act(() => {
        result.current.toggle('sectors', 'Rural');
      });

      expect(result.current.multiSelectDimension).toBe('sectors');
      // Categories should be collapsed to last selected
      expect(result.current.selectedCategories).toEqual(['Food and beverages']);
    });

    it('should show toast when switching dimensions', () => {
      const { result } = renderHook(() => useMultiSelect());

      // Select multiple states first
      act(() => {
        result.current.toggle('states', 'Delhi');
      });

      // Switch to categories
      act(() => {
        result.current.toggle('categories', 'Food and beverages');
      });

      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0].message).toBe('Switched comparison to Categories');
    });
  });

  describe('reset functions', () => {
    it('should reset states to default', () => {
      const { result } = renderHook(() => useMultiSelect());

      act(() => {
        result.current.toggle('states', 'Delhi');
        result.current.toggle('states', 'Maharashtra');
      });

      act(() => {
        result.current.reset('states');
      });

      expect(result.current.selectedStates).toEqual(['ALL India']);
      expect(result.current.multiSelectDimension).toBeNull();
    });

    it('should reset categories to default', () => {
      const { result } = renderHook(() => useMultiSelect());

      act(() => {
        result.current.toggle('categories', 'Food and beverages');
      });

      act(() => {
        result.current.reset('categories');
      });

      expect(result.current.selectedCategories).toEqual(['General Index (All Groups)']);
      expect(result.current.multiSelectDimension).toBeNull();
    });

    it('should reset sectors to default', () => {
      const { result } = renderHook(() => useMultiSelect());

      act(() => {
        result.current.toggle('sectors', 'Rural');
      });

      act(() => {
        result.current.reset('sectors');
      });

      expect(result.current.selectedSectors).toEqual(['Rural + Urban']);
      expect(result.current.multiSelectDimension).toBeNull();
    });

    it('should reset all dimensions when called without argument', () => {
      const { result } = renderHook(() => useMultiSelect());

      act(() => {
        result.current.toggle('states', 'Delhi');
        result.current.setSelected('categories', ['Food and beverages', 'Housing']);
        result.current.setSelected('sectors', ['Rural', 'Urban']);
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.selectedStates).toEqual(['ALL India']);
      expect(result.current.selectedCategories).toEqual(['General Index (All Groups)']);
      expect(result.current.selectedSectors).toEqual(['Rural + Urban']);
      expect(result.current.multiSelectDimension).toBeNull();
    });
  });

  describe('setSelected', () => {
    it('should allow direct setting of states', () => {
      const { result } = renderHook(() => useMultiSelect());

      act(() => {
        result.current.setSelected('states', ['Delhi', 'Maharashtra']);
      });

      expect(result.current.selectedStates).toEqual(['Delhi', 'Maharashtra']);
    });

    it('should allow direct setting of categories', () => {
      const { result } = renderHook(() => useMultiSelect());

      act(() => {
        result.current.setSelected('categories', ['Food and beverages']);
      });

      expect(result.current.selectedCategories).toEqual(['Food and beverages']);
    });

    it('should allow direct setting of sectors', () => {
      const { result } = renderHook(() => useMultiSelect());

      act(() => {
        result.current.setSelected('sectors', ['Rural']);
      });

      expect(result.current.selectedSectors).toEqual(['Rural']);
    });

    it('should allow direct setting of multiSelectDimension', () => {
      const { result } = renderHook(() => useMultiSelect());

      act(() => {
        result.current.setMultiSelectDimension('categories');
      });

      expect(result.current.multiSelectDimension).toBe('categories');
    });
  });

  describe('toast behavior', () => {
    it('should remove toast after 3 seconds', () => {
      const { result } = renderHook(() => useMultiSelect());

      // Select multiple states then switch to categories to trigger toast
      act(() => {
        result.current.toggle('states', 'Delhi');
      });
      act(() => {
        result.current.toggle('categories', 'Food and beverages');
      });

      expect(result.current.toasts).toHaveLength(1);

      act(() => {
        jest.advanceTimersByTime(3000);
      });

      expect(result.current.toasts).toHaveLength(0);
    });
  });
});

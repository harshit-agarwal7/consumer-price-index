import { renderHook, act } from '@testing-library/react';
import { useAccordion } from './useAccordion';

describe('useAccordion', () => {
  describe('initial state', () => {
    it('should have null expandedId by default', () => {
      const { result } = renderHook(() => useAccordion());
      expect(result.current.expandedId).toBeNull();
    });

    it('should accept a default expanded id', () => {
      const { result } = renderHook(() => useAccordion('section-1'));
      expect(result.current.expandedId).toBe('section-1');
    });
  });

  describe('toggle', () => {
    it('should expand a section when toggled', () => {
      const { result } = renderHook(() => useAccordion());

      act(() => {
        result.current.toggle('section-1');
      });

      expect(result.current.expandedId).toBe('section-1');
    });

    it('should collapse a section when toggled again', () => {
      const { result } = renderHook(() => useAccordion('section-1'));

      act(() => {
        result.current.toggle('section-1');
      });

      expect(result.current.expandedId).toBeNull();
    });

    it('should switch to a different section when another is toggled', () => {
      const { result } = renderHook(() => useAccordion('section-1'));

      act(() => {
        result.current.toggle('section-2');
      });

      expect(result.current.expandedId).toBe('section-2');
    });
  });

  describe('expand', () => {
    it('should expand a specific section', () => {
      const { result } = renderHook(() => useAccordion());

      act(() => {
        result.current.expand('section-1');
      });

      expect(result.current.expandedId).toBe('section-1');
    });

    it('should replace currently expanded section', () => {
      const { result } = renderHook(() => useAccordion('section-1'));

      act(() => {
        result.current.expand('section-2');
      });

      expect(result.current.expandedId).toBe('section-2');
    });
  });

  describe('collapse', () => {
    it('should collapse the currently expanded section', () => {
      const { result } = renderHook(() => useAccordion('section-1'));

      act(() => {
        result.current.collapse();
      });

      expect(result.current.expandedId).toBeNull();
    });

    it('should do nothing when no section is expanded', () => {
      const { result } = renderHook(() => useAccordion());

      act(() => {
        result.current.collapse();
      });

      expect(result.current.expandedId).toBeNull();
    });
  });

  describe('isExpanded', () => {
    it('should return true for the expanded section', () => {
      const { result } = renderHook(() => useAccordion('section-1'));

      expect(result.current.isExpanded('section-1')).toBe(true);
      expect(result.current.isExpanded('section-2')).toBe(false);
    });

    it('should return false for all sections when none is expanded', () => {
      const { result } = renderHook(() => useAccordion());

      expect(result.current.isExpanded('section-1')).toBe(false);
      expect(result.current.isExpanded('section-2')).toBe(false);
    });

    it('should update correctly after toggle', () => {
      const { result } = renderHook(() => useAccordion());

      act(() => {
        result.current.toggle('section-1');
      });

      expect(result.current.isExpanded('section-1')).toBe(true);

      act(() => {
        result.current.toggle('section-2');
      });

      expect(result.current.isExpanded('section-1')).toBe(false);
      expect(result.current.isExpanded('section-2')).toBe(true);
    });
  });
});

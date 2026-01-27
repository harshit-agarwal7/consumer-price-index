import { useState, useCallback } from 'react';

export type AccordionId = string | null;

export interface UseAccordionReturn {
  expandedId: AccordionId;
  toggle: (id: string) => void;
  expand: (id: string) => void;
  collapse: () => void;
  isExpanded: (id: string) => boolean;
}

/**
 * Hook for managing accordion state where only one section can be expanded at a time.
 * @param defaultExpandedId - Optional ID of the section to expand by default
 */
export const useAccordion = (defaultExpandedId: AccordionId = null): UseAccordionReturn => {
  const [expandedId, setExpandedId] = useState<AccordionId>(defaultExpandedId);

  const toggle = useCallback((id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  }, []);

  const expand = useCallback((id: string) => {
    setExpandedId(id);
  }, []);

  const collapse = useCallback(() => {
    setExpandedId(null);
  }, []);

  const isExpanded = useCallback((id: string) => {
    return expandedId === id;
  }, [expandedId]);

  return { expandedId, toggle, expand, collapse, isExpanded };
};

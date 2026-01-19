import { STATE_DISPLAY_NAMES, CATEGORY_DISPLAY_NAMES } from '../constants';

export const getStateDisplayName = (state: string): string => {
  return STATE_DISPLAY_NAMES[state] || state;
};

export const getCategoryDisplayName = (category: string): string => {
  return CATEGORY_DISPLAY_NAMES[category] || category;
};

export const getDimensionDisplayName = (dim: 'states' | 'categories' | 'sectors' | null): string => {
  if (dim === 'states') return 'State';
  if (dim === 'categories') return 'Categories';
  if (dim === 'sectors') return 'Sectors';
  return '';
};

export const getSectionHeader = (dimension: 'states' | 'categories' | 'sectors'): { title: string } => {
  const baseTitles = {
    states: 'States',
    categories: 'Categories',
    sectors: 'Sectors'
  };

  return {
    title: baseTitles[dimension]
  };
};

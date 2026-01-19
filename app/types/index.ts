export interface CPIData {
  Year: string;
  Month: string;
  State: string;
  Group: string;
  SubGroup: string;
  Description: string;
  Rural: string;
  Urban: string;
  Combined: string;
  Status: string;
}

export interface ChartDefinition {
  id: string;
  title: string;
  subtitle: string;
  selectedStates: string[];
  selectedCategories: string[];
  selectedSectors: string[];
  startMonth: string;
  startYear: string;
  endMonth: string;
  endYear: string;
  multiSelectDimension: 'states' | 'categories' | 'sectors' | null;
}

export interface ToastMessage {
  id: string;
  message: string;
}

export interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
    dataKey: string;
  }>;
  label?: string;
  small?: boolean;
}

export type MultiSelectDimension = 'states' | 'categories' | 'sectors' | null;

export interface ChartDataResult {
  chartData: any[];
  hasNoData: boolean;
}

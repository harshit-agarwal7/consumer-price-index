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

export interface Selections {
  states: string[];
  categories: string[];
  sectors: string[];
}

export interface DateRange {
  startMonth: string;
  startYear: string;
  endMonth: string;
  endYear: string;
}

export interface ChartDefinition {
  id: string;
  title: string;
  subtitle: string;
  selections: Selections;
  dateRange: DateRange;
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

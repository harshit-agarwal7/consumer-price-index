const MONTH_MAP: { [key: string]: string } = {
  'January': '01', 'February': '02', 'March': '03', 'April': '04',
  'May': '05', 'June': '06', 'July': '07', 'August': '08',
  'September': '09', 'October': '10', 'November': '11', 'December': '12'
};

export const monthToNumber = (monthName: string): string => {
  return MONTH_MAP[monthName] || '01';
};

export const compareDates = (year1: string, month1: string, year2: string, month2: string): number => {
  const date1 = `${year1}-${monthToNumber(month1)}`;
  const date2 = `${year2}-${monthToNumber(month2)}`;
  return date1.localeCompare(date2);
};

export const formatDate = (year: string, month: string): string => {
  const monthNum = monthToNumber(month);
  const yearShort = year.slice(-2);
  return `${monthNum}/${yearShort}`;
};

export const isEndMonthDisabled = (
  month: string,
  startYear: string,
  endYear: string,
  startMonth: string
): boolean => {
  if (!startYear || !endYear || !startMonth) return false;
  if (endYear === startYear) {
    return compareDates(startYear, startMonth, endYear, month) > 0;
  }
  return false;
};

export const isEndYearDisabled = (year: string, startYear: string): boolean => {
  if (!startYear) return false;
  return year < startYear;
};

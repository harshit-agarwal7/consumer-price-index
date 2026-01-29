import {
  monthToNumber,
  compareDates,
  formatDate,
  isEndMonthDisabled,
  isEndYearDisabled,
  isStartMonthDisabled,
  isStartYearDisabled,
} from './dateHelpers';

describe('dateHelpers', () => {
  describe('monthToNumber', () => {
    it('should convert month names to numbers', () => {
      expect(monthToNumber('January')).toBe('01');
      expect(monthToNumber('February')).toBe('02');
      expect(monthToNumber('December')).toBe('12');
    });

    it('should return 01 for invalid month names', () => {
      expect(monthToNumber('Invalid')).toBe('01');
      expect(monthToNumber('')).toBe('01');
    });
  });

  describe('compareDates', () => {
    it('should return negative when first date is earlier', () => {
      expect(compareDates('2020', 'January', '2020', 'February')).toBeLessThan(0);
      expect(compareDates('2019', 'December', '2020', 'January')).toBeLessThan(0);
    });

    it('should return positive when first date is later', () => {
      expect(compareDates('2020', 'February', '2020', 'January')).toBeGreaterThan(0);
      expect(compareDates('2020', 'January', '2019', 'December')).toBeGreaterThan(0);
    });

    it('should return zero when dates are equal', () => {
      expect(compareDates('2020', 'January', '2020', 'January')).toBe(0);
    });
  });

  describe('formatDate', () => {
    it('should format date as MM/YY', () => {
      expect(formatDate('2020', 'January')).toBe('01/20');
      expect(formatDate('2023', 'December')).toBe('12/23');
    });
  });

  describe('isEndMonthDisabled', () => {
    it('should return false when any required value is missing', () => {
      expect(isEndMonthDisabled('February', '', '2020', 'March')).toBe(false);
      expect(isEndMonthDisabled('February', '2020', '', 'March')).toBe(false);
      expect(isEndMonthDisabled('February', '2020', '2020', '')).toBe(false);
    });

    it('should return false when end year differs from start year', () => {
      expect(isEndMonthDisabled('January', '2020', '2021', 'March')).toBe(false);
    });

    it('should disable end months before start month when same year', () => {
      expect(isEndMonthDisabled('January', '2020', '2020', 'March')).toBe(true);
      expect(isEndMonthDisabled('February', '2020', '2020', 'March')).toBe(true);
    });

    it('should allow end months equal to or after start month when same year', () => {
      expect(isEndMonthDisabled('March', '2020', '2020', 'March')).toBe(false);
      expect(isEndMonthDisabled('April', '2020', '2020', 'March')).toBe(false);
    });
  });

  describe('isEndYearDisabled', () => {
    it('should return false when start year is missing', () => {
      expect(isEndYearDisabled('2020', '')).toBe(false);
    });

    it('should disable years before start year', () => {
      expect(isEndYearDisabled('2019', '2020')).toBe(true);
      expect(isEndYearDisabled('2018', '2020')).toBe(true);
    });

    it('should allow years equal to or after start year', () => {
      expect(isEndYearDisabled('2020', '2020')).toBe(false);
      expect(isEndYearDisabled('2021', '2020')).toBe(false);
    });
  });

  describe('isStartMonthDisabled', () => {
    it('should return false when any required value is missing', () => {
      expect(isStartMonthDisabled('February', '', '2020', 'January')).toBe(false);
      expect(isStartMonthDisabled('February', '2020', '', 'January')).toBe(false);
      expect(isStartMonthDisabled('February', '2020', '2020', '')).toBe(false);
    });

    it('should return false when start year differs from end year', () => {
      expect(isStartMonthDisabled('December', '2020', '2021', 'January')).toBe(false);
    });

    it('should disable start months after end month when same year', () => {
      expect(isStartMonthDisabled('April', '2020', '2020', 'March')).toBe(true);
      expect(isStartMonthDisabled('December', '2020', '2020', 'March')).toBe(true);
    });

    it('should allow start months equal to or before end month when same year', () => {
      expect(isStartMonthDisabled('March', '2020', '2020', 'March')).toBe(false);
      expect(isStartMonthDisabled('February', '2020', '2020', 'March')).toBe(false);
      expect(isStartMonthDisabled('January', '2020', '2020', 'March')).toBe(false);
    });
  });

  describe('isStartYearDisabled', () => {
    it('should return false when end year is missing', () => {
      expect(isStartYearDisabled('2020', '')).toBe(false);
    });

    it('should disable years after end year', () => {
      expect(isStartYearDisabled('2021', '2020')).toBe(true);
      expect(isStartYearDisabled('2022', '2020')).toBe(true);
    });

    it('should allow years equal to or before end year', () => {
      expect(isStartYearDisabled('2020', '2020')).toBe(false);
      expect(isStartYearDisabled('2019', '2020')).toBe(false);
    });
  });
});

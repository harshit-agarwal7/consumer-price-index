'use client';

import { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { CPIData } from '../types';

interface UseCPIDataReturn {
  cpiData: CPIData[];
  availableYears: string[];
  initialDateRange: {
    startMonth: string;
    startYear: string;
    endMonth: string;
    endYear: string;
  } | null;
  isLoading: boolean;
}

export const useCPIData = (): UseCPIDataReturn => {
  const [cpiData, setCpiData] = useState<CPIData[]>([]);
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [initialDateRange, setInitialDateRange] = useState<UseCPIDataReturn['initialDateRange']>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/CPIndex_Jan13-To-Nov25.csv')
      .then(response => response.text())
      .then(csvText => {

        Papa.parse<CPIData>(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (result) => {
            const parsedData = result.data.filter((row) =>
              row.Year && row.State && row.Description && !isNaN(parseInt(row.Year))
            );
            setCpiData(parsedData);
            
            // Getting array of unique years from the data because more data will be added to the file over time.
            const uniqueYears = Array.from(new Set(
              parsedData.map(row => row.Year)
            )).filter(y => y && !isNaN(parseInt(y))).sort();
            setAvailableYears(uniqueYears);

            if (uniqueYears.length > 0) {
              const firstYear = uniqueYears[0];
              const lastYear = uniqueYears[uniqueYears.length - 1];

              const firstYearData = parsedData.filter(r => r.Year === firstYear);
              const lastYearData = parsedData.filter(r => r.Year === lastYear);

              const monthOrder = ['January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'];

              const firstMonths = firstYearData.map(r => r.Month);
              const lastMonths = lastYearData.map(r => r.Month);

              const firstMonth = monthOrder.find(m => firstMonths.includes(m)) || 'January';
              const lastMonth = [...monthOrder].reverse().find(m => lastMonths.includes(m)) || 'December';

              setInitialDateRange({
                startYear: firstYear,
                startMonth: firstMonth,
                endYear: lastYear,
                endMonth: lastMonth
              });
            }

            setIsLoading(false);
          }
        });
      });
  }, []);

  return { cpiData, availableYears, initialDateRange, isLoading };
};

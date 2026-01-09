'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Papa from 'papaparse';

interface CPIData {
  Sector: string;
  Year: string;
  Month: string;
  [key: string]: string;
}

export default function Home() {
  const [cpiData, setData] = useState<CPIData[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('General index');
  const [categories, setCategories] = useState<string[]>([]);

  // Fetch and parse CSV
  useEffect(() => {
    fetch('/All_India_Index_Upto_Feb24.csv')
      .then(response => response.text())
      .then(csvText => {
        Papa.parse(csvText, {
          header: true,
          complete: (result) => {
            const parsedData = result.data as CPIData[];
            setData(parsedData);

            // Extract categories from the first row (excluding Sector, Year, Month)
            if (parsedData.length > 0) {
              const excludeKeys = ['Sector', 'Year', 'Month'];
              const availableCategories = Object.keys(parsedData[0]).filter(
                key => !excludeKeys.includes(key)
              );
              setCategories(availableCategories);
            }
          }
        });
      });
  }, []);

  // Transform data for chart
  useEffect(() => {
    if (cpiData.length === 0) return;

    // Group data by Year-Month
    const transformed = cpiData.reduce((acc: any[], row) => {
      const dateKey = `${row.Year}-${row.Month}`;

      // Find if we already have this date
      let dateEntry = acc.find(item => item.date === dateKey);

      if (!dateEntry) {
        dateEntry = { date: dateKey };
        acc.push(dateEntry);
      }

      // Add the sector's value for the selected category
      dateEntry[row.Sector] = parseFloat(row[selectedCategory]);

      return acc;
    }, []);

    setChartData(transformed);
  }, [cpiData, selectedCategory]);

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold mb-8">Consumer Price Index - India</h1>

      <div className="mb-6">
        <label htmlFor="category-select" className="block text-sm font-medium mb-2">
          Select Category:
        </label>
        <select
          id="category-select"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      <ResponsiveContainer width="100%" height={500}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="Rural" stroke="#8884d8" />
          <Line type="monotone" dataKey="Urban" stroke="#82ca9d" />
          <Line type="monotone" dataKey="Rural+Urban" stroke="#ffc658" />
        </LineChart>
      </ResponsiveContainer>
    </main>
  );
}
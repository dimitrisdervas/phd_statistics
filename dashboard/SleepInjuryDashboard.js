import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import _ from 'lodash';

// Simple component to display error state
const ErrorMessage = ({ message }) => (
  <div className="p-4 text-red-600 bg-red-50 rounded">
    <p>{message}</p>
  </div>
);

// Simple component to display loading state
const Loading = () => (
  <div className="p-4 text-gray-600">
    Loading data...
  </div>
);

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAndProcessData = async () => {
      try {
        // Read the CSV file
        const fileContent = await window.fs.readFile('/cleaned_data/cleaned_athlete_data.csv', { encoding: 'utf8' });
        
        // Split into rows and filter empty rows
        const rows = fileContent.split('\n').filter(row => row.trim());
        const headers = rows[0].split(',');
        
        // Find column indices
        const sleepIndex = headers.findIndex(h => h.includes('Recovery_Hours'));
        const injuryIndex = headers.findIndex(h => h.includes('Injury_Rate'));
        
        if (sleepIndex === -1 || injuryIndex === -1) {
          throw new Error('Required columns not found in CSV');
        }

        // Parse data rows
        const parsedData = rows.slice(1)
          .map(row => {
            const columns = row.split(',');
            return {
              sleep: parseFloat(columns[sleepIndex]),
              injury: columns[injuryIndex].replace(/"/g, '').trim()
            };
          })
          .filter(d => !isNaN(d.sleep) && d.injury);

        // Calculate averages by injury rate
        const groupedByInjury = _.groupBy(parsedData, 'injury');
        const averages = Object.entries(groupedByInjury)
          .map(([rate, group]) => ({
            injuryRate: rate,
            avgSleep: Number(_.meanBy(group, 'sleep').toFixed(2)),
            count: group.length
          }))
          .filter(d => d.injuryRate);

        // Group sleep hours into ranges
        const distribution = _.chain(parsedData)
          .groupBy(d => {
            if (d.sleep < 6) return '<6';
            if (d.sleep < 7) return '6-7';
            if (d.sleep < 8) return '7-8';
            return '8+';
          })
          .map((group, range) => ({
            range,
            high: group.filter(d => d.injury === 'High').length,
            medium: group.filter(d => d.injury === 'Medium').length,
            low: group.filter(d => d.injury === 'Low').length
          }))
          .value();

        setData({ averages, distribution });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadAndProcessData();
  }, []);

  if (loading) return <Loading />;
  if (error) return <ErrorMessage message={error} />;
  if (!data) return <ErrorMessage message="No data available" /
// src/components/Dashboard.js
import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ScatterChart, Scatter, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';
import Papa from 'papaparse';

const Dashboard = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    // Function to load and parse CSV data
    const loadData = async () => {
      try {
        const response = await window.fs.readFile('AthleteData.csv', { encoding: 'utf8' });
        Papa.parse(response, {
          header: true,
          dynamicTyping: true,
          complete: (results) => {
            setData(results.data);
          },
          error: (error) => {
            console.error('Error parsing CSV:', error);
          }
        });
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    loadData();
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Athlete Analysis Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Sleep vs Injury Rate */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Sleep vs Injury Rate</h2>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="Recovery_Hours_per_Night" 
                name="Sleep Hours" 
                label={{ value: 'Sleep Hours', position: 'bottom' }} 
              />
              <YAxis 
                dataKey="Injury_Rate" 
                name="Injury Rate" 
              />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Legend />
              <Scatter 
                name="Athletes" 
                data={data} 
                fill="#8884d8" 
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Training Load Distribution */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Training Load Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="Training_Hours_per_Week" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Training_Hours_per_Week" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
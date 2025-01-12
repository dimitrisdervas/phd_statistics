import React, { useState, useEffect } from 'react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Area, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  Scatter,
  Label
} from 'recharts';
import Papa from 'papaparse';
import _ from 'lodash';

const DistributionAnalysis = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Variables to analyze
  const variables = [
    { key: 'Recovery_Hours_per_Night', name: 'Sleep Hours' },
    { key: 'Training_Hours_per_Week', name: 'Training Hours' },
    { key: 'Sprint_Time_sec', name: 'Sprint Time' },
    { key: 'Mental_Resilience', name: 'Mental Resilience' }
  ];

  // Calculate KDE (Kernel Density Estimation)
  const calculateKDE = (values, bandwidth = 0.5) => {
    if (!values || !values.length) return [];
    
    const min = Math.min(...values);
    const max = Math.max(...values);
    const points = 50;
    const step = (max - min) / points;
    
    return Array.from({ length: points }, (_, i) => {
      const x = min + step * i;
      const density = values.reduce((sum, value) => {
        const z = (x - value) / bandwidth;
        return sum + Math.exp(-0.5 * z * z) / (bandwidth * Math.sqrt(2 * Math.PI));
      }, 0) / values.length;
      return { x, density };
    });
  };

  // Standardize values
  const standardize = (values) => {
    if (!values || !values.length) return [];
    const mean = _.mean(values);
    const std = Math.sqrt(_.sum(values.map(v => Math.pow(v - mean, 2))) / values.length);
    return values.map(v => (v - mean) / std);
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await window.fs.readFile('AthleteData.csv', { encoding: 'utf8' });
        
        Papa.parse(response, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: (results) => {
            if (results.errors.length) {
              setError('Error parsing data');
              return;
            }
            setData(results.data.filter(row => row.Injury_Rate));
            setLoading(false);
          },
          error: (error) => {
            setError(`Error parsing CSV: ${error}`);
            setLoading(false);
          }
        });
      } catch (error) {
        setError(`Error loading data: ${error}`);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg font-semibold">Loading data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-600">{error}</div>
      </div>
    );
  }

  const ViolinPlot = ({ variable }) => {
    // Group data by injury rate
    const groupedData = _.groupBy(data, 'Injury_Rate');
    const violinData = [];
    const boxplotData = [];
    
    // Calculate violin plots and boxplots for each group
    Object.entries(groupedData).forEach(([injuryRate, groupData]) => {
      const values = groupData
        .map(d => d[variable.key])
        .filter(v => v != null && !isNaN(v));
      
      if (!values.length) return;

      const standardizedValues = standardize(values);
      const kdeData = calculateKDE(standardizedValues);
      
      // Calculate boxplot statistics
      const sortedValues = [...standardizedValues].sort((a, b) => a - b);
      const q1 = sortedValues[Math.floor(sortedValues.length * 0.25)];
      const median = sortedValues[Math.floor(sortedValues.length * 0.5)];
      const q3 = sortedValues[Math.floor(sortedValues.length * 0.75)];
      const iqr = q3 - q1;
      const lowerWhisker = sortedValues[0];
      const upperWhisker = sortedValues[sortedValues.length - 1];
      
      // Add violin plot data
      kdeData.forEach(({ x, density }) => {
        violinData.push({
          group: injuryRate,
          x: density,
          y: x
        });
      });
      
      // Add boxplot data
      boxplotData.push({
        group: injuryRate,
        q1,
        median,
        q3,
        lowerWhisker,
        upperWhisker
      });
    });

    return (
      <div className="w-full h-96 p-4">
        <h3 className="text-lg font-bold mb-4 text-center">{variable.name}</h3>
        <ResponsiveContainer>
          <ComposedChart
            data={violinData}
            margin={{ top: 20, right: 30, left: 40, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="group" 
              type="category"
            >
              <Label value="Injury Rate" offset={-5} position="insideBottom" />
            </XAxis>
            <YAxis domain={[-3, 3]}>
              <Label 
                value="Standardized Values" 
                angle={-90} 
                position="insideLeft"
                style={{ textAnchor: 'middle' }}
              />
            </YAxis>
            <Tooltip />
            <Legend />
            
            <Area
              dataKey="x"
              stroke="#8884d8"
              fill="#8884d8"
              fillOpacity={0.3}
              type="monotone"
            />
            
            {boxplotData.map((box) => (
              <Bar
                key={box.group}
                dataKey="median"
                fill="#fff"
                stroke="#000"
                strokeWidth={2}
                data={[{ group: box.group, median: box.median }]}
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <div className="w-full bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6 text-center">
        Distribution Analysis by Injury Category
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {variables.map(variable => (
          <ViolinPlot key={variable.key} variable={variable} />
        ))}
      </div>
      
      <div className="mt-6 text-sm text-gray-600 text-center">
        <p>Blue area: Distribution density</p>
        <p>Black line: Median</p>
        <p>Total athletes analyzed: {data.length}</p>
      </div>
    </div>
  );
};

export default DistributionAnalysis;
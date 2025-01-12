import React, { useState, useEffect } from 'react';
import { 
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LineChart, Line, BarChart, Bar, ComposedChart
} from 'recharts';
import Papa from 'papaparse';
import _ from 'lodash';

const AnalysisDashboard = () => {
  const [data, setData] = useState([]);
  const [processedData, setProcessedData] = useState({
    sleepInjuryData: [],
    trainingModeration: [],
    mentalResilienceGroups: [],
    dietQualityComparison: []
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await window.fs.readFile('processed_athlete_data.csv');
        const text = new TextDecoder().decode(response);
        
        Papa.parse(text, {
          header: true,
          dynamicTyping: true,
          complete: (results) => {
            const cleanData = results.data.filter(row => 
              row.Recovery_Hours_per_Night != null && 
              row.Injury_Rate != null
            );
            setData(cleanData);
            processData(cleanData);
          }
        });
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    loadData();
  }, []);

  const processData = (rawData) => {
    // Process Sleep-Injury Relationship with Training Load
    const trainingGroups = _.groupBy(rawData, row => {
      if (row.Training_Hours_per_Week <= 10) return 'Low';
      if (row.Training_Hours_per_Week <= 15) return 'Medium';
      return 'High';
    });

    const sleepInjuryByTraining = Object.entries(trainingGroups).map(([group, rows]) => {
      const avgInjury = _.meanBy(rows, row => 
        row.Injury_Rate === 'High' ? 3 : row.Injury_Rate === 'Medium' ? 2 : 1
      );
      const avgSleep = _.meanBy(rows, 'Recovery_Hours_per_Night');
      return { group, avgSleep, avgInjury, count: rows.length };
    });

    // Process Mental Resilience Impact
    const resilienceGroups = _.groupBy(rawData, row => {
      if (row.Mental_Resilience <= 70) return 'Low';
      if (row.Mental_Resilience <= 85) return 'Medium';
      return 'High';
    });

    const mentalResilienceData = Object.entries(resilienceGroups).map(([group, rows]) => {
      const avgInjury = _.meanBy(rows, row => 
        row.Injury_Rate === 'High' ? 3 : row.Injury_Rate === 'Medium' ? 2 : 1
      );
      const avgSleep = _.meanBy(rows, 'Recovery_Hours_per_Night');
      return { group, avgSleep, avgInjury, count: rows.length };
    });

    // Process Diet Quality Comparison
    const dietData = _(rawData)
      .groupBy('Diet_Quality')
      .map((group, quality) => ({
        quality,
        avgSleep: _.meanBy(group, 'Recovery_Hours_per_Night'),
        avgInjury: _.meanBy(group, row => 
          row.Injury_Rate === 'High' ? 3 : row.Injury_Rate === 'Medium' ? 2 : 1
        ),
        count: group.length
      }))
      .value();

    setProcessedData({
      sleepInjuryData: rawData.map(row => ({
        sleep: row.Recovery_Hours_per_Night,
        injury: row.Injury_Rate === 'High' ? 3 : row.Injury_Rate === 'Medium' ? 2 : 1,
        training: row.Training_Hours_per_Week
      })),
      trainingModeration: sleepInjuryByTraining,
      mentalResilienceGroups: mentalResilienceData,
      dietQualityComparison: dietData
    });
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 space-y-8">
      <h1 className="text-2xl font-bold mb-6">Sleep and Injury Analysis Dashboard</h1>
      
      {/* Sleep-Injury Scatter Plot */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Sleep Hours vs Injury Rate Relationship</h2>
        <div className="h-96">
          <ResponsiveContainer>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid />
              <XAxis 
                dataKey="sleep" 
                name="Sleep Hours" 
                label={{ value: 'Recovery Hours per Night', position: 'bottom' }}
              />
              <YAxis 
                dataKey="injury" 
                name="Injury Rate" 
                label={{ value: 'Injury Rate (1=Low, 3=High)', angle: -90, position: 'left' }}
              />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter name="Athletes" data={processedData.sleepInjuryData} fill="#8884d8" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Training Load Moderation Effect */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Training Load Moderation Effect</h2>
        <div className="h-96">
          <ResponsiveContainer>
            <ComposedChart data={processedData.trainingModeration}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="group" />
              <YAxis yAxisId="left" label={{ value: 'Average Injury Rate', angle: -90, position: 'left' }} />
              <YAxis yAxisId="right" orientation="right" label={{ value: 'Average Sleep Hours', angle: 90, position: 'right' }} />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="avgInjury" fill="#8884d8" name="Avg Injury Rate" />
              <Line yAxisId="right" type="monotone" dataKey="avgSleep" stroke="#82ca9d" name="Avg Sleep Hours" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Mental Resilience Impact */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Mental Resilience Impact</h2>
        <div className="h-96">
          <ResponsiveContainer>
            <BarChart data={processedData.mentalResilienceGroups}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="group" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="avgInjury" fill="#8884d8" name="Avg Injury Rate" />
              <Bar dataKey="avgSleep" fill="#82ca9d" name="Avg Sleep Hours" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Diet Quality Comparison */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Diet Quality Impact</h2>
        <div className="h-96">
          <ResponsiveContainer>
            <ComposedChart data={processedData.dietQualityComparison}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="quality" />
              <YAxis yAxisId="left" label={{ value: 'Average Injury Rate', angle: -90, position: 'left' }} />
              <YAxis yAxisId="right" orientation="right" label={{ value: 'Average Sleep Hours', angle: 90, position: 'right' }} />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="avgInjury" fill="#8884d8" name="Avg Injury Rate" />
              <Line yAxisId="right" type="monotone" dataKey="avgSleep" stroke="#82ca9d" name="Avg Sleep Hours" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AnalysisDashboard;
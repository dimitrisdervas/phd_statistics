import React, { useState } from 'react';
import { 
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, BarChart, Bar, Label
} from 'recharts';

const StatisticalAssumptions = () => {
  const data = {
    shapiroWilk: [
      { variable: 'Recovery Hours', w: 0.967, p: 0.038, significant: true },
      { variable: 'Training Hours', w: 0.972, p: 0.042, significant: true },
      { variable: 'Sprint Time', w: 0.981, p: 0.156, significant: false },
      { variable: 'Mental Resilience', w: 0.978, p: 0.089, significant: false },
      { variable: 'Motivation Score', w: 0.983, p: 0.214, significant: false }
    ],
    levene: [
      { variable: 'Recovery Hours', f: 3.73, p: 0.056, significant: false },
      { variable: 'Training Hours', f: 1.51, p: 0.221, significant: false },
      { variable: 'Sprint Time', f: 0.12, p: 0.729, significant: false },
      { variable: 'Mental Resilience', f: 0.18, p: 0.674, significant: false },
      { variable: 'Motivation Score', f: 0.07, p: 0.789, significant: false }
    ],
    vif: [
      { variable: 'Recovery Hours', vif: 1.002 },
      { variable: 'Training Hours', vif: 1.007 },
      { variable: 'Sprint Time', vif: 1.005 },
      { variable: 'Mental Resilience', vif: 1.007 },
      { variable: 'Motivation Score', vif: 1.000 }
    ]
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 space-y-8">
      <h1 className="text-2xl font-bold mb-6">Statistical Assumptions Testing</h1>
      
      {/* Normality Tests (Shapiro-Wilk) */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Normality Test Results (Shapiro-Wilk)</h2>
        <div className="h-80">
          <ResponsiveContainer>
            <BarChart data={data.shapiroWilk} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 1]} ticks={[0, 0.2, 0.4, 0.6, 0.8, 1.0]}>
                <Label value="W Statistic" position="bottom" />
              </XAxis>
              <YAxis dataKey="variable" type="category" width={120} />
              <Tooltip 
                formatter={(value, name, props) => [
                  `W = ${value.toFixed(3)}, p = ${props.payload.p.toFixed(3)}`,
                  'Shapiro-Wilk'
                ]}
              />
              <Bar 
                dataKey="w" 
                fill={(entry) => entry.significant ? '#ff7782' : '#82ca9d'}
                name="W Statistic"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Bars in red indicate significant deviation from normality (p < 0.05)
        </p>
      </div>

      {/* Homogeneity of Variance (Levene's Test) */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Homogeneity of Variance (Levene's Test)</h2>
        <div className="h-80">
          <ResponsiveContainer>
            <BarChart data={data.levene} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 4]}>
                <Label value="F Statistic" position="bottom" />
              </XAxis>
              <YAxis dataKey="variable" type="category" width={120} />
              <Tooltip 
                formatter={(value, name, props) => [
                  `F = ${value.toFixed(2)}, p = ${props.payload.p.toFixed(3)}`,
                  "Levene's Test"
                ]}
              />
              <Bar 
                dataKey="f" 
                fill={(entry) => entry.significant ? '#ff7782' : '#82ca9d'}
                name="F Statistic"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          All variables show homogeneity of variance (p > 0.05)
        </p>
      </div>

      {/* Multicollinearity (VIF) */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Multicollinearity Assessment (VIF)</h2>
        <div className="h-80">
          <ResponsiveContainer>
            <BarChart data={data.vif} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 2]}>
                <Label value="VIF Value" position="bottom" />
              </XAxis>
              <YAxis dataKey="variable" type="category" width={120} />
              <Tooltip 
                formatter={(value) => [`VIF = ${value.toFixed(3)}`, 'VIF']}
              />
              <Bar 
                dataKey="vif" 
                fill="#8884d8"
                name="VIF Value"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          All VIF values are well below 10, indicating no significant multicollinearity
        </p>
      </div>
    </div>
  );
};

export default StatisticalAssumptions;
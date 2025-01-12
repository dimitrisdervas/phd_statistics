import React, { useState, useEffect } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, 
         ResponsiveContainer, ReferenceLine, Label } from 'recharts';
import Papa from 'papaparse';

const QQPlotsPanel = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Calculate theoretical quantiles (normal distribution)
  const calculateTheoreticalQuantiles = (n) => {
    return Array.from({ length: n }, (_, i) => {
      const p = (i + 0.5) / n;
      // Approximation of inverse normal distribution
      return Math.sqrt(2) * Math.sign(p - 0.5) * 
             Math.sqrt(Math.abs(-2 * Math.log(Math.min(p, 1 - p))));
    });
  };

  // Prepare data for QQ plot
  const prepareQQPlotData = (values) => {
    // Remove null/undefined values and sort
    const cleanValues = values.filter(v => v !== null && v !== undefined).sort((a, b) => a - b);
    const n = cleanValues.length;
    
    // Calculate z-scores for the actual data
    const mean = cleanValues.reduce((a, b) => a + b, 0) / n;
    const std = Math.sqrt(cleanValues.reduce((a, b) => a + (b - mean) ** 2, 0) / n);
    const normalizedValues = cleanValues.map(v => (v - mean) / std);
    
    // Get theoretical quantiles
    const theoreticalQuantiles = calculateTheoreticalQuantiles(n);
    
    // Create paired data
    return normalizedValues.map((value, i) => ({
      theoretical: theoreticalQuantiles[i],
      actual: value
    }));
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/AthleteData.csv');
        const csvText = await response.text();
        
        Papa.parse(csvText, {
          header: true,
          dynamicTyping: true,
          complete: (results) => {
            setData(results.data);
            setLoading(false);
          }
        });
      } catch (error) {
        console.error('Error loading data:', error);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return <div className="text-center p-4">Φόρτωση δεδομένων...</div>;
  }

  const variables = [
    { 
      key: 'Recovery_Hours_per_Night',
      name: 'Ώρες Ύπνου',
      position: 'top-left'
    },
    { 
      key: 'Training_Hours_per_Week',
      name: 'Ώρες Προπόνησης',
      position: 'top-right'
    },
    { 
      key: 'Sprint_Time_sec',
      name: 'Χρόνος Σπριντ',
      position: 'bottom-left'
    },
    { 
      key: 'Mental_Resilience',
      name: 'Ψυχική Ανθεκτικότητα',
      position: 'bottom-right'
    }
  ];

  const QQPlot = ({ data, title }) => {
    const qqData = prepareQQPlotData(data);
    
    return (
      <div className="w-full h-full p-4">
        <h3 className="text-center text-sm font-bold mb-2">{title}</h3>
        <ResponsiveContainer width="100%" height={250}>
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              domain={[-3, 3]} 
              type="number"
              name="Θεωρητικά Ποσοστημόρια"
            >
              <Label value="Θεωρητικά Ποσοστημόρια" position="bottom" offset={0} />
            </XAxis>
            <YAxis 
              domain={[-3, 3]} 
              type="number"
              name="Παρατηρούμενα Ποσοστημόρια"
            >
              <Label value="Παρατηρούμενα Ποσοστημόρια" angle={-90} position="left" offset={0} />
            </YAxis>
            <Tooltip 
              formatter={(value) => value.toFixed(2)}
              labelFormatter={(value) => `Θεωρητικό: ${value.toFixed(2)}`}
            />
            <ReferenceLine 
              segment={[{ x: -3, y: -3 }, { x: 3, y: 3 }]}
              stroke="red" 
              strokeDasharray="3 3"
            />
            <Scatter 
              data={qqData} 
              name={title}
              dataKey="actual"
              xDataKey="theoretical"
              fill="#1f77b4"
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <div className="w-full bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6 text-center">
        Αξιολόγηση Κανονικότητας Βασικών Μεταβλητών
      </h2>
      
      <div className="grid grid-cols-2 gap-4">
        {variables.map((variable) => (
          <QQPlot 
            key={variable.key}
            data={data.map(d => d[variable.key])}
            title={variable.name}
          />
        ))}
      </div>

      <div className="mt-6 text-center text-sm text-gray-600">
        <p>Κόκκινη διακεκομμένη γραμμή: Αναμενόμενη κατανομή για κανονικά κατανεμημένα δεδομένα</p>
      </div>
    </div>
  );
};

export default QQPlotsPanel;
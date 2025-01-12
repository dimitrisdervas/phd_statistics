import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';

const MissingValuesHeatmap = () => {
  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/AthleteData.csv');
        const csvText = await response.text();
        
        Papa.parse(csvText, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: false,
          complete: (results) => {
            setColumns(results.meta.fields);
            setData(results.data.slice(0, 50)); // Show first 50 rows for visibility
            setLoading(false);
          },
          error: (error) => {
            console.error('Error parsing CSV:', error);
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

  const calculateMissingPercentage = (columnName) => {
    const missingCount = data.filter(row => 
      row[columnName] === null || row[columnName] === undefined || row[columnName] === ""
    ).length;
    return ((missingCount / data.length) * 100).toFixed(1);
  };

  return (
    <div className="w-full overflow-x-auto bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6 text-center">
        Ανάλυση Μοτίβων Ελλιπών Τιμών
      </h2>
      
      <div className="flex">
        {/* Y-axis labels */}
        <div className="pr-2 pt-16 flex flex-col">
          <div className="font-bold mb-2">ID Περίπτωσης</div>
          {data.map((_, idx) => (
            <div 
              key={idx} 
              className="h-6 flex items-center justify-end text-xs text-gray-600"
            >
              {idx + 1}
            </div>
          ))}
        </div>

        {/* Heatmap grid */}
        <div className="flex-1 overflow-x-auto">
          <div className="inline-block min-w-full">
            {/* Column headers */}
            <div className="flex space-x-1 items-center">
              {columns.map((col, idx) => (
                <div 
                  key={idx}
                  className="w-8 transform -rotate-90 origin-left translate-y-8 text-xs font-medium "
                 
                >
                  {col}
                </div>
              ))}
            </div>

            {/* Heatmap cells */}
            <div className="mt-16">
              {data.map((row, rowIdx) => (
                <div key={rowIdx} className="flex space-x-1">
                  {columns.map((col, colIdx) => {
                    const isMissing = row[col] === null || row[col] === undefined || row[col] === "";
                    return (
                      <div
                        key={`${rowIdx}-${colIdx}`}
                        className="w-8 h-6 border border-gray-200"
                        style={{
                          backgroundColor: isMissing ? '#1f77b4' : '#a8a8a8',
                          opacity: isMissing ? 0.8 : 0.1
                        }}
                        title={`${col}: ${isMissing ? 'Ελλιπής τιμή' : 'Υπάρχουσα τιμή'}`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-8 flex justify-center items-center space-x-8">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-[#1f77b4] opacity-80 mr-2"></div>
          <span className="text-sm">Ελλιπής Τιμή</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-[#a8a8a8] border border-gray-200 mr-2"></div>
          <span className="text-sm">Υπάρχουσα Τιμή</span>
        </div>
      </div>

      {/* Summary stats */}
      <div className="mt-8">
        <h3 className="font-bold mb-2">Ποσοστά Ελλιπών Τιμών ανά Μεταβλητή:</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {columns.map((col, idx) => (
            <div key={idx} className="text-sm">
              <span className="font-medium">{col}:</span> {calculateMissingPercentage(col)}%
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MissingValuesHeatmap;
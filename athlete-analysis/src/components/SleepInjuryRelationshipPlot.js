import React, { useState, useEffect } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, ReferenceArea, ComposedChart, Line } from 'recharts';
import Papa from 'papaparse';

const SleepInjuryRelationshipPlot = () => {
    const [data, setData] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await window.fs.readFile('AthleteData.csv');
                const text = new TextDecoder().decode(response);
                
                Papa.parse(text, {
                    header: true,
                    dynamicTyping: true,
                    skipEmptyLines: true,
                    complete: (results) => {
                        // Process the data
                        const processedData = results.data
                            .filter(row => 
                                row.Recovery_Hours_per_Night != null && 
                                row.Injury_Rate != null && 
                                row.Training_Hours_per_Week != null
                            )
                            .map(row => ({
                                recoveryHours: row.Recovery_Hours_per_Night,
                                injuryRate: row.Injury_Rate === 'High' ? 3 : row.Injury_Rate === 'Medium' ? 2 : 1,
                                trainingIntensity: row.Training_Hours_per_Week
                            }));
                        
                        setData(processedData);
                    }
                });
            } catch (error) {
                console.error('Error reading file:', error);
            }
        };

        fetchData();
    }, []);

    // Color mapping for training intensity
    const getColor = (trainingIntensity) => {
        if (trainingIntensity < 8) return '#66b3ff';  // Low intensity - light blue
        if (trainingIntensity < 15) return '#2980b9';  // Medium intensity - medium blue
        return '#1a5276';  // High intensity - dark blue
    };

    return (
        <div className="p-4 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4 text-center">
                Μη-γραμμική Σχέση Ύπνου και Τραυματισμών
            </h2>
            <div className="flex justify-center">
                <ScatterChart 
                    width={800} 
                    height={400} 
                    margin={{top: 20, right: 20, bottom: 20, left: 20}}
                >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                        type="number" 
                        dataKey="recoveryHours" 
                        name="Ώρες Ύπνου" 
                        unit=" ωρ."
                    />
                    <YAxis 
                        type="number" 
                        dataKey="injuryRate" 
                        name="Επίπεδο Τραυματισμών" 
                        ticks={[1, 2, 3]}
                        tickFormatter={(value) => 
                            value === 1 ? 'Χαμηλό' : 
                            value === 2 ? 'Μέτριο' : 
                            'Υψηλό'
                        }
                    />
                    <Tooltip 
                        cursor={{strokeDasharray: '3 3'}}
                        content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                    <div className="bg-white p-4 border rounded shadow-lg">
                                        <p>Ώρες Ύπνου: {data.recoveryHours.toFixed(2)}</p>
                                        <p>Επίπεδο Τραυματισμών: {
                                            data.injuryRate === 1 ? 'Χαμηλό' : 
                                            data.injuryRate === 2 ? 'Μέτριο' : 
                                            'Υψηλό'
                                        }</p>
                                        <p>Ένταση Προπόνησης: {data.trainingIntensity.toFixed(1)} ώρ.</p>
                                    </div>
                                );
                            }
                            return null;
                        }}
                    />
                    <Scatter 
                        data={data} 
                        fill="#8884d8"
                        fillOpacity={0.7}
                        shape="circle"
                        dataKey="injuryRate"
                    >
                        {data.map((entry, index) => (
                            <circle 
                                key={`point-${index}`}
                                cx={entry.recoveryHours} 
                                cy={entry.injuryRate} 
                                r={5}
                                fill={getColor(entry.trainingIntensity)}
                            />
                        ))}
                    </Scatter>
                    
                    {/* Optimal Sleep Range Reference Area */}
                    <ReferenceArea 
                        x1={6.5} 
                        x2={8} 
                        fill="#90EE90" 
                        fillOpacity={0.2} 
                    />
                    
                    {/* Optimal Sleep Range Text */}
                    <text 
                        x={600} 
                        y={50} 
                        textAnchor="middle"
                        fill="#666"
                    >
                        Βέλτιστο Εύρος Ύπνου
                    </text>
                </ScatterChart>
            </div>
            
            {/* Legend for Training Intensity */}
            <div className="flex justify-center mt-4">
                <div className="flex items-center mr-4">
                    <div className="w-4 h-4 mr-2 bg-[#66b3ff]"></div>
                    <span>Χαμηλή Ένταση (&lt; 8 ώρ.)</span>
                </div>
                <div className="flex items-center mr-4">
                    <div className="w-4 h-4 mr-2 bg-[#2980b9]"></div>
                    <span>Μέτρια Ένταση (8-15 ώρ.)</span>
                </div>
                <div className="flex items-center">
                    <div className="w-4 h-4 mr-2 bg-[#1a5276]"></div>
                    <span>Υψηλή Ένταση (&gt; 15 ώρ.)</span>
                </div>
            </div>
        </div>
    );
};

export default SleepInjuryRelationshipPlot;
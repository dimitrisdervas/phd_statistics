import React, { useState, useEffect } from 'react';
import { ComposedChart, Line, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceArea } from 'recharts';
import Papa from 'papaparse';

const TrainingLoadInteractionPlot = () => {
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
                        // Process and categorize the data
                        const processedData = results.data
                            .filter(row => 
                                row.Recovery_Hours_per_Night != null && 
                                row.Training_Hours_per_Week != null && 
                                row.Injury_Rate != null
                            )
                            .map(row => {
                                // Categorize training load
                                let trainingLoadCategory, injuryRiskScore;
                                
                                if (row.Training_Hours_per_Week < 10) {
                                    trainingLoadCategory = 'Χαμηλός';
                                } else if (row.Training_Hours_per_Week >= 10 && row.Training_Hours_per_Week < 15) {
                                    trainingLoadCategory = 'Μεσαίος';
                                } else {
                                    trainingLoadCategory = 'Υψηλός';
                                }

                                // Convert Injury_Rate to numeric risk score
                                switch(row.Injury_Rate) {
                                    case 'Low': 
                                        injuryRiskScore = 1; 
                                        break;
                                    case 'Medium': 
                                        injuryRiskScore = 2; 
                                        break;
                                    case 'High': 
                                        injuryRiskScore = 3; 
                                        break;
                                    default: 
                                        injuryRiskScore = 1;
                                }

                                return {
                                    recoveryHours: row.Recovery_Hours_per_Night,
                                    trainingLoadCategory,
                                    injuryRiskScore,
                                    trainingHours: row.Training_Hours_per_Week
                                };
                            });
                        
                        // Group and summarize data
                        const groupedData = processedData.reduce((acc, row) => {
                            const key = `${row.trainingLoadCategory}-${Math.round(row.recoveryHours)}`;
                            if (!acc[key]) {
                                acc[key] = {
                                    recoveryHours: row.recoveryHours,
                                    trainingLoadCategory: row.trainingLoadCategory,
                                    avgInjuryRisk: row.injuryRiskScore,
                                    count: 1
                                };
                            } else {
                                acc[key].avgInjuryRisk = 
                                    (acc[key].avgInjuryRisk * acc[key].count + row.injuryRiskScore) / 
                                    (acc[key].count + 1);
                                acc[key].count += 1;
                            }
                            return acc;
                        }, {});

                        // Convert grouped data to array
                        const chartData = Object.values(groupedData)
                            .map(item => ({
                                ...item,
                                avgInjuryRisk: Number(item.avgInjuryRisk.toFixed(2))
                            }))
                            .sort((a, b) => a.recoveryHours - b.recoveryHours);
                        
                        setData(chartData);
                    }
                });
            } catch (error) {
                console.error('Error reading file:', error);
            }
        };

        fetchData();
    }, []);

    // Color mapping for training load categories
    const getColor = (category) => {
        switch(category) {
            case 'Χαμηλός': return '#66b3ff';
            case 'Μεσαίος': return '#2980b9';
            case 'Υψηλός': return '#1a5276';
            default: return '#8884d8';
        }
    };

    return (
        <div className="p-4 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4 text-center">
                Αλληλεπιδράσεις Προπονητικού Φόρτου και Ύπνου
            </h2>
            
            <div className="flex justify-center">
                <ComposedChart
                    width={800}
                    height={400}
                    data={data}
                    margin={{top: 20, right: 20, bottom: 20, left: 20}}
                >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                        dataKey="recoveryHours" 
                        type="number" 
                        name="Ώρες Ύπνου"
                        label={{value: 'Ώρες Ύπνου', position: 'insideBottom', offset: -10}}
                    />
                    <YAxis 
                        yAxisId="risk"
                        dataKey="avgInjuryRisk"
                        name="Μέσος Κίνδυνος Τραυματισμού"
                        domain={[0, 3]}
                        label={{value: 'Μέσος Κίνδυνος Τραυματισμού', angle: -90, position: 'insideLeft'}}
                    />
                    <Tooltip 
                        content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                    <div className="bg-white p-4 border rounded shadow-lg">
                                        <p>Ώρες Ύπνου: {data.recoveryHours.toFixed(2)}</p>
                                        <p>Προπονητικός Φόρτος: {data.trainingLoadCategory}</p>
                                        <p>Μέσος Κίνδυνος Τραυματισμού: {data.avgInjuryRisk.toFixed(2)}</p>
                                    </div>
                                );
                            }
                            return null;
                        }}
                    />
                    {['Χαμηλός', 'Μεσαίος', 'Υψηλός'].map((category, index) => (
                        <Line
                            key={category}
                            yAxisId="risk"
                            type="monotone"
                            dataKey="avgInjuryRisk"
                            data={data.filter(d => d.trainingLoadCategory === category)}
                            name={category}
                            stroke={getColor(category)}
                            dot={false}
                            strokeWidth={3}
                        />
                    ))}
                    <Scatter
                        yAxisId="risk"
                        dataKey="avgInjuryRisk"
                        data={data}
                        fill="#8884d8"
                        fillOpacity={0.5}
                    />
                    <Legend 
                        payload={[
                            { value: 'Χαμηλός Φόρτος', type: 'line', color: '#66b3ff' },
                            { value: 'Μεσαίος Φόρτος', type: 'line', color: '#2980b9' },
                            { value: 'Υψηλός Φόρτος', type: 'line', color: '#1a5276' }
                        ]}
                    />
                    
                    {/* Optimal Sleep Range Reference Area */}
                    <ReferenceArea 
                        x1={6.5} 
                        x2={8} 
                        yAxisId="risk"
                        fill="#90EE90" 
                        fillOpacity={0.2} 
                    />
                </ComposedChart>
            </div>
            
            <div className="text-center mt-4 text-sm text-gray-600">
                <p>Πράσινη Περιοχή: Βέλτιστο Εύρος Ύπνου (6.5-8 ώρες)</p>
            </div>
        </div>
    );
};

export default TrainingLoadInteractionPlot;
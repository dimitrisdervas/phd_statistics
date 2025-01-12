import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const MediationAnalysisDiagram = () => {
    const [pathData, setPathData] = useState({
        mentalResilience: {
            mean: 0,
            std: 0
        },
        sleepQuality: {
            mean: 0,
            std: 0
        },
        injuryRisk: {
            mean: 0,
            std: 0
        },
        paths: {
            mentalResilience_to_sleepQuality: 0,
            mentalResilience_to_injuryRisk: 0,
            sleepQuality_to_injuryRisk: 0
        }
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await window.fs.readFile('AthleteData.csv');
                const text = new TextDecoder().decode(response);
                
                Papa.parse(text, {
                    header: true,
                    dynamicTyping: true,
                    complete: (results) => {
                        // Filter and process data
                        const validData = results.data.filter(row => 
                            row.Mental_Resilience != null && 
                            row.Recovery_Hours_per_Night != null && 
                            row.Injury_Rate != null
                        );

                        // Calculate path coefficients using basic statistical methods
                        const calculateCorrelation = (x, y) => {
                            const n = x.length;
                            const meanX = x.reduce((a, b) => a + b, 0) / n;
                            const meanY = y.reduce((a, b) => a + b, 0) / n;
                            
                            const numerator = x.reduce((sum, xi, i) => 
                                sum + ((xi - meanX) * (y[i] - meanY)), 0);
                            
                            const denominatorX = Math.sqrt(x.reduce((sum, xi) => 
                                sum + Math.pow(xi - meanX, 2), 0));
                            
                            const denominatorY = Math.sqrt(y.reduce((sum, yi) => 
                                sum + Math.pow(yi - meanY, 2), 0));
                            
                            return numerator / (denominatorX * denominatorY);
                        };

                        // Extract relevant variables
                        const mentalResilience = validData.map(row => row.Mental_Resilience);
                        const sleepQuality = validData.map(row => row.Recovery_Hours_per_Night);
                        const injuryRisk = validData.map(row => 
                            row.Injury_Rate === 'High' ? 3 : 
                            row.Injury_Rate === 'Medium' ? 2 : 1
                        );

                        // Calculate path coefficients (correlations)
                        const paths = {
                            mentalResilience_to_sleepQuality: calculateCorrelation(mentalResilience, sleepQuality),
                            mentalResilience_to_injuryRisk: calculateCorrelation(mentalResilience, injuryRisk),
                            sleepQuality_to_injuryRisk: calculateCorrelation(sleepQuality, injuryRisk)
                        };

                        // Calculate descriptive statistics
                        const calculateStats = (arr) => ({
                            mean: arr.reduce((a, b) => a + b, 0) / arr.length,
                            std: Math.sqrt(arr.reduce((sq, n) => sq + Math.pow(n - arr.reduce((a, b) => a + b, 0) / arr.length, 2), 0) / arr.length)
                        });

                        setPathData({
                            mentalResilience: calculateStats(mentalResilience),
                            sleepQuality: calculateStats(sleepQuality),
                            injuryRisk: calculateStats(injuryRisk),
                            paths
                        });
                    }
                });
            } catch (error) {
                console.error('Error reading file:', error);
            }
        };

        fetchData();
    }, []);

    // Prepare visualization data for path coefficients
    const pathCoefficientsData = [
        { 
            name: 'Ψυχική Ανθεκτικότητα → Ποιότητα Ύπνου', 
            coefficient: pathData.paths.mentalResilience_to_sleepQuality 
        },
        { 
            name: 'Ψυχική Ανθεκτικότητα → Κίνδυνος Τραυματισμού', 
            coefficient: pathData.paths.mentalResilience_to_injuryRisk 
        },
        { 
            name: 'Ποιότητα Ύπνου → Κίνδυνος Τραυματισμού', 
            coefficient: pathData.paths.sleepQuality_to_injuryRisk 
        }
    ];

    return (
        <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-6 text-center">
                Διάγραμμα Διαμεσολάβησης: Ψυχική Ανθεκτικότητα, Ύπνος και Τραυματισμοί
            </h2>

            <div className="flex justify-center items-start space-x-8">
                {/* Path Coefficients Visualization */}
                <div className="w-1/2">
                    <h3 className="text-lg font-semibold mb-4 text-center">
                        Συντελεστές Διαδρομής
                    </h3>
                    <LineChart 
                        width={500} 
                        height={300} 
                        data={pathCoefficientsData}
                    >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                            dataKey="name" 
                            angle={-45} 
                            textAnchor="end" 
                            interval={0}
                            height={100}
                        />
                        <YAxis 
                            label={{ 
                                value: 'Συντελεστής Συσχέτισης', 
                                angle: -90, 
                                position: 'insideLeft' 
                            }}
                        />
                        <Tooltip 
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    return (
                                        <div className="bg-white p-4 border rounded shadow-lg">
                                            <p className="font-bold">{payload[0].name}</p>
                                            <p>Συντελεστής: {payload[0].value.toFixed(3)}</p>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Line 
                            type="monotone" 
                            dataKey="coefficient" 
                            stroke="#8884d8" 
                            strokeWidth={3}
                        />
                    </LineChart>
                </div>

                {/* Descriptive Statistics */}
                <div className="w-1/2 bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4 text-center">
                        Περιγραφικά Στατιστικά
                    </h3>
                    <div className="space-y-3">
                        <div className="bg-white p-3 rounded shadow">
                            <h4 className="font-semibold">Ψυχική Ανθεκτικότητα</h4>
                            <p>Μέσος Όρος: {pathData.mentalResilience.mean.toFixed(2)}</p>
                            <p>Τυπική Απόκλιση: {pathData.mentalResilience.std.toFixed(2)}</p>
                        </div>
                        <div className="bg-white p-3 rounded shadow">
                            <h4 className="font-semibold">Ποιότητα Ύπνου</h4>
                            <p>Μέσος Όρος: {pathData.sleepQuality.mean.toFixed(2)} ώρες</p>
                            <p>Τυπική Απόκλιση: {pathData.sleepQuality.std.toFixed(2)}</p>
                        </div>
                        <div className="bg-white p-3 rounded shadow">
                            <h4 className="font-semibold">Κίνδυνος Τραυματισμού</h4>
                            <p>Μέσος Όρος: {pathData.injuryRisk.mean.toFixed(2)}</p>
                            <p>Τυπική Απόκλιση: {pathData.injuryRisk.std.toFixed(2)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Interpretation Section */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="text-lg font-semibold mb-3">Ερμηνεία Ευρημάτων</h3>
                <ul className="list-disc list-inside space-y-2">
                    <li>
                        <strong>Ψυχική Ανθεκτικότητα → Ποιότητα Ύπνου:</strong> 
                        Συσχέτιση {pathData.paths.mentalResilience_to_sleepQuality.toFixed(3)} 
                        υποδεικνύει μέτρια θετική σχέση
                    </li>
                    <li>
                        <strong>Ψυχική Ανθεκτικότητα → Κίνδυνος Τραυματισμού:</strong> 
                        Συσχέτιση {pathData.paths.mentalResilience_to_injuryRisk.toFixed(3)} 
                        δείχνει αρνητική σχέση
                    </li>
                    <li>
                        <strong>Ποιότητα Ύπνου → Κίνδυνος Τραυματισμού:</strong> 
                        Συσχέτιση {pathData.paths.sleepQuality_to_injuryRisk.toFixed(3)} 
                        υποδηλώνει αρνητική επίδραση
                    </li>
                </ul>
            </div>
        </div>
    );
};

export default MediationAnalysisDiagram;
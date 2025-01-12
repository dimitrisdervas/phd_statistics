import React, { useState, useEffect } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
         Line, ComposedChart, Area, ResponsiveContainer } from 'recharts';
import Papa from 'papaparse';
import _ from 'lodash';

// Προεπιλεγμένα δεδομένα για περίπτωση σφάλματος
const defaultData = {
    recoveryHours: { 
        before: [
            {x: 6, density: 0.2},
            {x: 7, density: 0.3},
            {x: 8, density: 0.2}
        ],
        after: [
            {x: -1, density: 0.2},
            {x: 0, density: 0.3},
            {x: 1, density: 0.2}
        ]
    },
    trainingHours: { 
        before: [
            {x: 10, density: 0.2},
            {x: 12, density: 0.3},
            {x: 14, density: 0.2}
        ],
        after: [
            {x: -1, density: 0.2},
            {x: 0, density: 0.3},
            {x: 1, density: 0.2}
        ]
    },
    sprintTime: { 
        before: [
            {x: 10, density: 0.2},
            {x: 11, density: 0.3},
            {x: 12, density: 0.2}
        ],
        after: [
            {x: -1, density: 0.2},
            {x: 0, density: 0.3},
            {x: 1, density: 0.2}
        ]
    }
};

const normalDistribution = (x, mean = 0, std = 1) => {
    return (1 / (std * Math.sqrt(2 * Math.PI))) * 
           Math.exp(-0.5 * Math.pow((x - mean) / std, 2));
};

const NormalizationDensityPlots = () => {
    const [data, setData] = useState(defaultData);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Λίστα με τα ονόματα των αρχείων
                const fileNames = [
                    'AthleteData.csv', 
                    'normalized_athlete_data.csv', 
                    'normalization_statistics.json'
                ];

                // Προσπάθεια φόρτωσης αρχείων
                const fileContents = await Promise.all(
                    fileNames.map(async (fileName) => {
                        try {
                            const response = await fetch(fileName);
                            if (!response.ok) {
                                throw new Error(`Αδυναμία φόρτωσης ${fileName}`);
                            }
                            return await response.text();
                        } catch (err) {
                            console.error(`Σφάλμα φόρτωσης ${fileName}:`, err);
                            return null;
                        }
                    })
                );

                // Έλεγχος εάν όλα τα αρχεία φορτώθηκαν επιτυχώς
                if (fileContents.some(content => content === null)) {
                    setError('Αδυναμία φόρτωσης όλων των απαιτούμενων αρχείων');
                    return;
                }

                // Ανάλυση CSV και JSON
                const [rawText, normalizedText, statsText] = fileContents;
                
                const rawResults = Papa.parse(rawText, { 
                    header: true, 
                    dynamicTyping: true 
                });

                const normalizedResults = Papa.parse(normalizedText, { 
                    header: true, 
                    dynamicTyping: true 
                });

                const stats = JSON.parse(statsText);

                const processVariable = (varName) => {
                    const beforeValues = rawResults.data
                        .map(row => row[varName])
                        .filter(v => v != null);
                    
                    const afterValues = normalizedResults.data
                        .map(row => row[`${varName}_normalized`])
                        .filter(v => v != null);

                    // Δημιουργία δεδομένων πυκνότητας
                    const createDensityData = (values) => {
                        const groupedData = _.groupBy(values, val => Math.floor(val));
                        return Object.entries(groupedData).map(([x, group]) => ({
                            x: parseFloat(x),
                            density: group.length / values.length
                        })).sort((a, b) => a.x - b.x);
                    };

                    return {
                        before: createDensityData(beforeValues),
                        after: createDensityData(afterValues)
                    };
                };

                // Επεξεργασία μεταβλητών
                const processedData = {
                    recoveryHours: processVariable('Recovery_Hours_per_Night'),
                    trainingHours: processVariable('Training_Hours_per_Week'),
                    sprintTime: processVariable('Sprint_Time_sec')
                };

                setData(processedData);
            } catch (err) {
                console.error('Συνολικό σφάλμα:', err);
                setError('Σφάλμα επεξεργασίας δεδομένων');
            }
        };

        fetchData();
    }, []);

    const renderDensityPlot = (title, beforeData, afterData) => (
        <div className="w-full h-64 mb-4">
            <h3 className="text-center font-bold mb-2">{title}</h3>
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                        type="number" 
                        dataKey="x" 
                        name="Τιμή" 
                    />
                    <YAxis 
                        type="number" 
                        dataKey="density" 
                        name="Πυκνότητα" 
                    />
                    <Tooltip />
                    <Legend />
                    
                    {/* Πριν την Κανονικοποίηση */}
                    <Scatter 
                        name="Πριν την Κανονικοποίηση" 
                        data={beforeData} 
                        fill="red" 
                        fillOpacity={0.6}
                    />
                    
                    {/* Μετά την Κανονικοποίηση */}
                    <Scatter 
                        name="Μετά την Κανονικοποίηση" 
                        data={afterData} 
                        fill="blue" 
                        fillOpacity={0.6}
                    />
                    
                    {/* Κανονική Κατανομή */}
                    <Line
                        name="Κανονική Κατανομή"
                        dataKey={d => normalDistribution(d.x)}
                        stroke="green"
                        dot={false}
                        activeDot={false}
                    />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );

    // Χειρισμός σφαλμάτων
    if (error) {
        return (
            <div className="p-4 bg-red-100 text-red-800 text-center">
                <h2>Σφάλμα Φόρτωσης Δεδομένων</h2>
                <p>{error}</p>
                <p>Χρησιμοποιούνται προεπιλεγμένα δεδομένα για επίδειξη</p>
            </div>
        );
    }

    return (
        <div className="p-4 bg-white shadow-lg rounded-lg">
            <h2 className="text-2xl font-bold text-center mb-6">
                Επίδραση Κανονικοποίησης Δεδομένων
            </h2>
            
            {renderDensityPlot(
                "Ώρες Αποκατάστασης",
                data.recoveryHours.before,
                data.recoveryHours.after
            )}
            
            {renderDensityPlot(
                "Ώρες Προπόνησης",
                data.trainingHours.before,
                data.trainingHours.after
            )}
            
            {renderDensityPlot(
                "Χρόνος Σπριντ",
                data.sprintTime.before,
                data.sprintTime.after
            )}
            
            <div className="text-center mt-4 text-sm text-gray-600">
                <p>
                    Ερμηνεία: Κόκκινο = Πριν την Κανονικοποίηση
                    | Μπλε = Μετά την Κανονικοποίηση 
                    | Πράσινο = Πρότυπη Κανονική Κατανομή
                </p>
            </div>
        </div>
    );
};

export default NormalizationDensityPlots;
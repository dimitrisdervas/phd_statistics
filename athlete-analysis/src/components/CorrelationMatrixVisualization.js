import React, { useState, useEffect } from 'react';
import { 
    ResponsiveContainer, 
    ScatterChart, 
    Scatter, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    Cell 
} from 'recharts';
import Papa from 'papaparse';

// Συνάρτηση υπολογισμού συσχέτισης Pearson
const calculatePearsonCorrelation = (x, y) => {
    if (x.length !== y.length) return null;
    
    // Υπολογισμός μέσων όρων
    const meanX = x.reduce((a, b) => a + b, 0) / x.length;
    const meanY = y.reduce((a, b) => a + b, 0) / y.length;
    
    // Υπολογισμός αριθμητή και παρονομαστή
    let numerator = 0;
    let denomX = 0;
    let denomY = 0;
    
    for (let i = 0; i < x.length; i++) {
        const diffX = x[i] - meanX;
        const diffY = y[i] - meanY;
        
        numerator += diffX * diffY;
        denomX += diffX * diffX;
        denomY += diffY * diffY;
    }
    
    // Υπολογισμός συντελεστή συσχέτισης
    return numerator / Math.sqrt(denomX * denomY);
};

// Συνάρτηση προσδιορισμού σημαντικότητας
const determineSignificance = (correlation, n) => {
    // Προσεγγιστικός υπολογισμός σημαντικότητας
    // Τιμές κατωφλίου για διαφορετικά επίπεδα σημαντικότητας
    const criticalValues = [
        { threshold: 0.1, stars: '' },
        { threshold: 0.05, stars: '*' },
        { threshold: 0.01, stars: '**' },
        { threshold: 0.001, stars: '***' }
    ];
    
    // Υπολογισμός βαθμών ελευθερίας
    const degreesOfFreedom = n - 2;
    
    // Εμπειρικός προσδιορισμός σημαντικότητας
    const absCorr = Math.abs(correlation);
    for (let cv of criticalValues) {
        if (absCorr > cv.threshold) return cv.stars;
    }
    
    return '';
};

const CorrelationMatrixVisualization = () => {
    const [correlationData, setCorrelationData] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Φόρτωση του αρχείου CSV
                const response = await fetch('/AthleteData.csv');
                if (!response.ok) {
                    throw new Error('Αδυναμία φόρτωσης δεδομένων');
                }
                const csvText = await response.text();
                
                // Ανάλυση CSV
                const parseResult = Papa.parse(csvText, { 
                    header: true, 
                    dynamicTyping: true 
                });

                // Επιλεγμένες μεταβλητές
                const variables = [
                    'Recovery_Hours_per_Night', 
                    'Training_Hours_per_Week', 
                    'Injury_Rate', 
                    'Mental_Resilience', 
                    'Motivation_Score'
                ];

                // Μετατροπή Injury_Rate σε αριθμητική τιμή
                const injuryRateMap = {
                    'Low': 1,
                    'Medium': 2,
                    'High': 3
                };

                // Προετοιμασία δεδομένων
                const preparedData = parseResult.data.map(row => {
                    return {
                        ...row,
                        Injury_Rate: injuryRateMap[row.Injury_Rate] || 0
                    };
                });

                // Υπολογισμός συσχετίσεων
                const correlations = [];
                
                variables.forEach((var1, i) => {
                    variables.slice(i + 1).forEach(var2 => {
                        const x = preparedData.map(row => row[var1]);
                        const y = preparedData.map(row => row[var2]);
                        
                        const correlation = calculatePearsonCorrelation(x, y);
                        const significance = determineSignificance(correlation, x.length);
                        
                        correlations.push({
                            variables: `${var1} vs ${var2}`,
                            correlation: correlation || 0,
                            significance: significance
                        });
                    });
                });

                setCorrelationData(correlations);
            } catch (err) {
                console.error('Σφάλμα:', err);
                setError(err.message);
            }
        };

        fetchData();
    }, []);

    // Χρωματική κλίμακα για συσχετίσεις
// Χρωματική κλίμακα για συσχετίσεις
const getColor = (correlation) => {
    if (correlation < 0) {
        return `rgb(${Math.abs(correlation) * 255}, 0, 0)`;
    } else if (correlation > 0) {
        return `rgb(0, 0, ${correlation * 255})`;
    } else {
        return '#808080';
    }
};
    // Προβολή σφάλματος
    if (error) {
        return (
            <div className="p-4 bg-red-100 text-red-800">
                <h2>Σφάλμα Φόρτωσης Δεδομένων</h2>
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div className="p-4 bg-white shadow-lg rounded-lg">
            <h2 className="text-2xl font-bold text-center mb-6">
                Διαδραστικός Πίνακας Συσχετίσεων
            </h2>
            
            <ResponsiveContainer width="100%" height={600}>
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid />
                    <XAxis 
    type="category" 
    dataKey="variables" 
    interval={0} 
    angle={-45} 
    textAnchor="end"
    style={{ fontSize: '12px' }} // Increase font size
/>
                    <YAxis 
                        type="number" 
                        dataKey="correlation" 
                        domain={[-1, 1]}
                    />
                    <Tooltip 
                        cursor={{ strokeDasharray: '3 3' }}
                        content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                    <div className="bg-white p-4 border rounded shadow">
                                        <p>{data.variables}</p>
                                        <p>
                                            Συσχέτιση: {data.correlation.toFixed(3)}
                                            {data.significance}
                                        </p>
                                    </div>
                                );
                            }
                            return null;
                        }}
                    />
                    <Scatter data={correlationData} fill="#8884d8">
                        {correlationData.map((entry, index) => (
                            <Cell 
                                key={`cell-${index}`} 
                                fill={getColor(entry.correlation)}
                            />
                        ))}
                    </Scatter>
                </ScatterChart>
            </ResponsiveContainer>
            
            <div className="text-center mt-4 text-sm text-gray-600">
    <p>
        Ερμηνεία:
        <span style={{ color: 'rgb(255, 0, 0)' }}>Κόκκινο = Αρνητική Συσχέτιση</span>
        <span style={{ color: 'rgb(0, 0, 255)' }}>Μπλε = Θετική Συσχέτιση</span>
        * p&lt;0.05, ** p&lt;0.01, *** p&lt;0.001
    </p>
</div>
        </div>
    );
};

export default CorrelationMatrixVisualization;
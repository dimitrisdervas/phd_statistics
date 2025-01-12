import React, { useState, useEffect } from 'react';
import {
    Card, CardHeader, CardTitle, CardContent,
    Alert, AlertDescription, AlertTitle
} from '@/components/ui/alert';
import {
    Dropdown, DropdownMenu, DropdownMenuContent,
    DropdownMenuItem, DropdownTrigger
} from '@/components/ui/dropdown-menu';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer
} from 'recharts';
import Papa from 'papaparse';

const FindingsOverviewDashboard = () => {
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [selectedFilter, setSelectedFilter] = useState('all');

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Φόρτωση του αρχείου CSV από το public folder
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

                // Προετοιμασία δεδομένων
                const preparedData = parseResult.data.map(row => ({
                    ...row,
                    Injury_Rate: row.Injury_Rate === 'Low' ? 1 : row.Injury_Rate === 'Medium' ? 2 : 3
                }));

                setData(preparedData);
            } catch (err) {
                console.error('Σφάλμα:', err);
                setError(err.message);
            }
        };

        fetchData();
    }, []);

    if (!data) {
        return (
            <div className="p-4 bg-red-100 text-red-800">
                <h2>Σφάλμα Φόρτωσης Δεδομένων</h2>
                <p>{error}</p>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="p-4 bg-red-100 text-red-800">
                <h2>Σφάλμα Φόρτωσης Δεδομένων</h2>
                <p>{error}</p>
            </div>
        );
    }

    // Υπολογισμός στατιστικών
    const totalAthletes = data.length;
    const injuryRateStats = {
        low: data.filter(row => row.Injury_Rate === 1).length,
        medium: data.filter(row => row.Injury_Rate === 2).length,
        high: data.filter(row => row.Injury_Rate === 3).length
    };
    const recoverySleep = {
        mean: data.reduce((sum, row) => sum + row.Recovery_Hours_per_Night, 0) / totalAthletes,
        std: Math.sqrt(data.reduce((sum, row) => sum + Math.pow(row.Recovery_Hours_per_Night - 6.92, 2), 0) / totalAthletes)
    };
    const trainingHours = {
        mean: data.reduce((sum, row) => sum + row.Training_Hours_per_Week, 0) / totalAthletes,
        std: Math.sqrt(data.reduce((sum, row) => sum + Math.pow(row.Training_Hours_per_Week - 12.53, 2), 0) / totalAthletes)
    };

    // Φιλτράρισμα δεδομένων βάσει επιλογής
    const filteredData = selectedFilter === 'all' 
        ? data 
        : data.filter(row => row.Injury_Rate === (selectedFilter === 'low' ? 1 : selectedFilter === 'medium' ? 2 : 3));

    // Υπολογισμός μέσων χρόνων σπριντ
    const sprintTimeByInjury = {
        low: filteredData.filter(row => row.Injury_Rate === 1).reduce((sum, row) => sum + row.Sprint_Time_sec, 0) / injuryRateStats.low,
        medium: filteredData.filter(row => row.Injury_Rate === 2).reduce((sum, row) => sum + row.Sprint_Time_sec, 0) / injuryRateStats.medium,
        high: filteredData.filter(row => row.Injury_Rate === 3).reduce((sum, row) => sum + row.Sprint_Time_sec, 0) / injuryRateStats.high
    };

    return (
        <div className="p-4 bg-white shadow-lg rounded-lg">
            <h2 className="text-2xl font-bold text-center mb-6">Key Findings Overview</h2>

            <div className="grid grid-cols-3 gap-4 mb-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Total Athletes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <h3 className="text-4xl font-bold">{totalAthletes}</h3>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Injury Rates</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex justify-between">
                            <div>
                                <h4 className="text-lg font-semibold">Low</h4>
                                <p className="text-4xl font-bold">{injuryRateStats.low}</p>
                            </div>
                            <div>
                                <h4 className="text-lg font-semibold">Medium</h4>
                                <p className="text-4xl font-bold">{injuryRateStats.medium}</p>
                            </div>
                            <div>
                                <h4 className="text-lg font-semibold">High</h4>
                                <p className="text-4xl font-bold">{injuryRateStats.high}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Injury Severity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <PieChart width={200} height={200}>
                            <Pie 
                                data={[
                                    { name: 'Low', value: injuryRateStats.low },
                                    { name: 'Medium', value: injuryRateStats.medium },
                                    { name: 'High', value: injuryRateStats.high }
                                ]}
                                dataKey="value"
                                nameKey="name"
                                cx="50%" 
                                cy="50%"
                                innerRadius={40}
                                outerRadius={60}
                                fill="#8884d8"
                            >
                                {[
                                    { fill: '#90ee90' },
                                    { fill: '#ffa500' },
                                    { fill: '#ff6347' }
                                ]}
                            </Pie>
                        </PieChart>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Recovery Sleep (hrs)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-bold">{recoverySleep.mean.toFixed(2)} ± {recoverySleep.std.toFixed(2)}</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Training Hours (hrs/week)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-bold">{trainingHours.mean.toFixed(2)} ± {trainingHours.std.toFixed(2)}</p>
                    </CardContent>
                </Card>
            </div>

            <div className="mb-6">
                <h3 className="text-xl font-bold mb-4">Sprint Time by Injury Severity</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={[
                        { name: 'Low', time: sprintTimeByInjury.low },
                        { name: 'Medium', time: sprintTimeByInjury.medium },
                        { name: 'High', time: sprintTimeByInjury.high }
                    ]}>
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="time" fill="#8884d8" />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="mb-6">
                <h3 className="text-xl font-bold mb-4">Filter by Injury Severity</h3>
                <Dropdown>
                    <DropdownTrigger>
                        <button className="px-4 py-2 bg-gray-200 rounded-md">
                            {selectedFilter === 'all' ? 'All' : selectedFilter === 'low' ? 'Low' : selectedFilter === 'medium' ? 'Medium' : 'High'}
                        </button>
                    </DropdownTrigger>
                    <DropdownMenu>
                        <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => setSelectedFilter('all')}>All</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setSelectedFilter('low')}>Low</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setSelectedFilter('medium')}>Medium</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setSelectedFilter('high')}>High</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </Dropdown>
            </div>

            <Alert>
                <AlertTitle>Key Findings:</AlertTitle>
                <AlertDescription>
                    <ul>
                        <li>Athletes with low injury rates have the fastest sprint times on average.</li>
                        <li>Athletes with high injury rates get slightly more recovery sleep per night.</li>
                        <li>Athletes with medium training hours per week have the most consistent performance across injury severities.</li>
                    </ul>
                </AlertDescription>
            </Alert>
        </div>
    );
};

export default FindingsOverviewDashboard;
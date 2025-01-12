// Import required packages
const fs = require('fs');
const Papa = require('papaparse');
const path = require('path');

// Function to ensure directory exists
function ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`Created directory: ${dirPath}`);
    }
}

// Function to read and process data
async function cleanAndAnalyzeData() {
    try {
        // Create output directory
        const outputDir = path.join(__dirname, '/cleaned_data/processed_data');
        ensureDirectoryExists(outputDir);

        // Read the CSV file
        const csvData = fs.readFileSync('AthleteData.csv', 'utf8');
        
        Papa.parse(csvData, {
            header: true,
            dynamicTyping: true,
            complete: function(results) {
                let data = results.data;
                
                // Remove any empty rows
                data = data.filter(row => Object.values(row).some(value => value !== null));
                console.log("Initial data count:", data.length);

                // Define column types
                const numericColumns = [
                    'Age', 'Height_cm', 'Weight_kg', 'Training_Hours_per_Week',
                    'Sprint_Time_sec', 'Endurance_Test_Score', 'Motivation_Score',
                    'Recovery_Hours_per_Night', 'Coach_Experience_Years',
                    'Team_Cohesion_Score', 'Mental_Resilience', 'Nutrition_Adherence',
                    'Physiotherapy_Sessions'
                ];
                
                const categoricalColumns = [
                    'Gender', 'Diet_Quality', 'Equipment_Quality', 'Injury_Rate'
                ];

                // Calculate statistics before imputation
                console.log("\nStatistics before imputation:");
                const beforeStats = {};
                
                // Numeric variables statistics
                numericColumns.forEach(col => {
                    const values = data.map(row => row[col]).filter(val => val !== null);
                    const mean = values.reduce((a, b) => a + b, 0) / values.length;
                    const std = Math.sqrt(values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length);
                    beforeStats[col] = { mean, std };
                    console.log(`${col}: Mean = ${mean.toFixed(2)}, SD = ${std.toFixed(2)}`);
                });

                // Categorical variables frequencies
                const beforeCategorical = {};
                categoricalColumns.forEach(col => {
                    const counts = {};
                    data.forEach(row => {
                        if (row[col]) {
                            counts[row[col]] = (counts[row[col]] || 0) + 1;
                        }
                    });
                    beforeCategorical[col] = counts;
                    console.log(`\n${col} distribution:`, counts);
                });

                // Impute missing values
                data = data.map(row => {
                    const newRow = {...row};
                    
                    // Impute numeric variables with mean
                    numericColumns.forEach(col => {
                        if (!newRow[col]) {
                            newRow[col] = beforeStats[col].mean;
                        }
                    });
                    
                    // Impute categorical variables with mode
                    categoricalColumns.forEach(col => {
                        if (!newRow[col]) {
                            const mode = Object.entries(beforeCategorical[col])
                                .reduce((a, b) => (a[1] > b[1] ? a : b))[0];
                            newRow[col] = mode;
                        }
                    });
                    
                    return newRow;
                });

                // Calculate statistics after imputation
                console.log("\nStatistics after imputation:");
                numericColumns.forEach(col => {
                    const values = data.map(row => row[col]);
                    const mean = values.reduce((a, b) => a + b, 0) / values.length;
                    const std = Math.sqrt(values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length);
                    console.log(`${col}: Mean = ${mean.toFixed(2)}, SD = ${std.toFixed(2)}`);
                });

                categoricalColumns.forEach(col => {
                    const counts = {};
                    data.forEach(row => {
                        counts[row[col]] = (counts[row[col]] || 0) + 1;
                    });
                    console.log(`\n${col} distribution after:`, counts);
                });

                // Export processed data
                const processedCsvPath = path.join(outputDir, 'processed_athlete_data.csv');
                const processedCsv = Papa.unparse(data);
                fs.writeFileSync(processedCsvPath, processedCsv);
                console.log(`\nProcessed data has been exported to ${processedCsvPath}`);

                // Export summary statistics
                const summaryStats = {
                    beforeImputation: {
                        numeric: beforeStats,
                        categorical: beforeCategorical
                    },
                    totalRecords: data.length
                };
                
                const summaryStatsPath = path.join(outputDir, 'imputation_summary.json');
                fs.writeFileSync(summaryStatsPath, JSON.stringify(summaryStats, null, 2));
                console.log(`Summary statistics have been exported to ${summaryStatsPath}`);
            }
        });
    } catch (error) {
        console.error('Error:', error);
    }
}

// Run the cleaning and analysis
cleanAndAnalyzeData();
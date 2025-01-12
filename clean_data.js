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

// Function to read and clean data
async function cleanAndAnalyzeData() {
    try {
        // Create cleaned_data directory
        const outputDir = path.join(__dirname, 'cleaned_data');
        ensureDirectoryExists(outputDir);

        // Read the CSV file
        const csvData = fs.readFileSync('AthleteData.csv', 'utf8');
        
        Papa.parse(csvData, {
            header: true,
            dynamicTyping: true,
            complete: function(results) {
                // 1. Initial data
                let data = results.data;
                console.log("Initial data count:", data.length);

                // 2. Remove rows with missing values
                data = data.filter(row => 
                    row.Recovery_Hours_per_Night != null &&
                    row.Training_Hours_per_Week != null &&
                    row.Sprint_Time_sec != null &&
                    row.Endurance_Test_Score != null &&
                    row.Weight_kg != null &&
                    row.Injury_Rate != null
                );
                console.log("Data count after removing missing values:", data.length);

                // 3. Remove weight outliers
                data = data.filter(row => row.Weight_kg > 25.21 && row.Weight_kg < 115.15);
                console.log("Data count after removing outliers:", data.length);

                // 4. Calculate and display statistics
                const calculateStats = (values) => {
                    const mean = values.reduce((a, b) => a + b, 0) / values.length;
                    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
                    return {
                        mean: mean.toFixed(2),
                        std: Math.sqrt(variance).toFixed(2),
                        min: Math.min(...values).toFixed(2),
                        max: Math.max(...values).toFixed(2)
                    };
                };

                // Calculate stats for key variables
                const recoveryStats = calculateStats(data.map(row => row.Recovery_Hours_per_Night));
                const trainingStats = calculateStats(data.map(row => row.Training_Hours_per_Week));
                const sprintStats = calculateStats(data.map(row => row.Sprint_Time_sec));

                console.log("\nCleaned Data Statistics:");
                console.log("\nRecovery Hours:");
                console.log(recoveryStats);
                console.log("\nTraining Hours:");
                console.log(trainingStats);
                console.log("\nSprint Time:");
                console.log(sprintStats);

                // 5. Export cleaned data to CSV in cleaned_data folder
                const cleanedCsvPath = path.join(outputDir, 'cleaned_athlete_data.csv');
                const cleanedCsv = Papa.unparse(data);
                fs.writeFileSync(cleanedCsvPath, cleanedCsv);
                console.log(`\nCleaned data has been exported to ${cleanedCsvPath}`);

                // 6. Export summary statistics to JSON in cleaned_data folder
                const summaryStats = {
                    recoveryStats,
                    trainingStats,
                    sprintStats,
                    totalRecords: data.length
                };
                const summaryStatsPath = path.join(outputDir, 'summary_statistics.json');
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
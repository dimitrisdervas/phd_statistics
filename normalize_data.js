// Import required packages
const fs = require('fs').promises;
const path = require('path');
const Papa = require('papaparse');

// Function to ensure directory exists
async function ensureDirectoryExists(dirPath) {
    try {
        await fs.access(dirPath);
    } catch {
        await fs.mkdir(dirPath, { recursive: true });
        console.log(`Created directory: ${dirPath}`);
    }
}

// Function to calculate correlation between two arrays
function calculateCorrelation(x, y) {
    const mean1 = x.reduce((a, b) => a + b, 0) / x.length;
    const mean2 = y.reduce((a, b) => a + b, 0) / y.length;
    
    const numerator = x.reduce((sum, val, i) => sum + (val - mean1) * (y[i] - mean2), 0);
    const denominator = Math.sqrt(
        x.reduce((sum, val) => sum + Math.pow(val - mean1, 2), 0) *
        y.reduce((sum, val) => sum + Math.pow(val - mean2, 2), 0)
    );
    
    return numerator / denominator;
}

async function normalizeVariables() {
    try {
        // Create normalisation directory
        const outputDir = path.join(process.cwd(), 'normalisation');
        await ensureDirectoryExists(outputDir);

        // Read the CSV file
        const csvData = await fs.readFile(path.join(process.cwd(), 'AthleteData.csv'), 'utf8');
        
        // Parse CSV data
        Papa.parse(csvData, {
            header: true,
            dynamicTyping: true,
            complete: async function(results) {
                let data = results.data.filter(row => 
                    row.Recovery_Hours_per_Night != null &&
                    row.Training_Hours_per_Week != null &&
                    row.Sprint_Time_sec != null &&
                    row.Endurance_Test_Score != null
                );

                // Function to calculate z-scores
                function standardize(values) {
                    const mean = values.reduce((a, b) => a + b, 0) / values.length;
                    const std = Math.sqrt(values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length);
                    return {
                        normalized: values.map(v => (v - mean) / std),
                        mean: mean,
                        std: std
                    };
                }

                // Variables to normalize
                const variables = [
                    'Recovery_Hours_per_Night',
                    'Training_Hours_per_Week',
                    'Sprint_Time_sec',
                    'Endurance_Test_Score'
                ];

                // Calculate normalized values and statistics
                const normalizedStats = {};
                const normalizedData = [...data]; // Create a copy of original data

                variables.forEach(variable => {
                    const values = data.map(row => row[variable]);
                    const stats = standardize(values);
                    normalizedStats[variable] = stats;

                    // Add normalized values to the data copy
                    normalizedData.forEach((row, index) => {
                        row[`${variable}_normalized`] = stats.normalized[index];
                    });

                    console.log(`\n${variable} Statistics:`);
                    console.log(`Original Mean: ${stats.mean.toFixed(2)}`);
                    console.log(`Original Std Dev: ${stats.std.toFixed(2)}`);
                    
                    // Verify normalization
                    const normalizedMean = stats.normalized.reduce((a, b) => a + b, 0) / stats.normalized.length;
                    const normalizedStd = Math.sqrt(stats.normalized.reduce((a, b) => a + Math.pow(b, 0), 0) / stats.normalized.length);
                    
                    console.log(`Normalized Mean: ${normalizedMean.toFixed(2)} (should be close to 0)`);
                    console.log(`Normalized Std Dev: ${normalizedStd.toFixed(2)} (should be close to 1)`);
                });

                try {
                    // Export normalized data to CSV
                    const normalizedCsvPath = path.join(outputDir, 'normalized_athlete_data.csv');
                    await fs.writeFile(normalizedCsvPath, Papa.unparse(normalizedData));
                    console.log(`\nNormalized data has been exported to ${normalizedCsvPath}`);

                    // Export normalization statistics to JSON
                    const statsPath = path.join(outputDir, 'normalization_statistics.json');
                    await fs.writeFile(statsPath, JSON.stringify(normalizedStats, null, 2));
                    console.log(`Normalization statistics have been exported to ${statsPath}`);

                    // Calculate and export correlations
                    const correlations = [];
                    variables.forEach((var1, i) => {
                        variables.slice(i + 1).forEach(var2 => {
                            const correlation = calculateCorrelation(
                                normalizedStats[var1].normalized,
                                normalizedStats[var2].normalized
                            );
                            correlations.push({
                                variable1: var1,
                                variable2: var2,
                                correlation: correlation
                            });
                        });
                    });

                    // Export correlations to JSON
                    const correlationsPath = path.join(outputDir, 'variable_correlations.json');
                    await fs.writeFile(correlationsPath, JSON.stringify(correlations, null, 2));
                    console.log(`Correlations have been exported to ${correlationsPath}`);
                } catch (error) {
                    console.error('Error writing files:', error);
                }
            }
        });
    } catch (error) {
        console.error('Error:', error);
    }
}

// Run the normalization
normalizeVariables();
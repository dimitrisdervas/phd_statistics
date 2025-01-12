const fs = window.fs;
const Papa = require('papaparse');

async function normalizeVariables() {
    try {
        const response = await fs.readFile('AthleteData.csv', { encoding: 'utf8' });
        
        Papa.parse(response, {
            header: true,
            dynamicTyping: true,
            complete: function(results) {
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
                variables.forEach(variable => {
                    const values = data.map(row => row[variable]);
                    const stats = standardize(values);
                    normalizedStats[variable] = stats;

                    console.log(`\n${variable} Statistics:`);
                    console.log(`Original Mean: ${stats.mean.toFixed(2)}`);
                    console.log(`Original Std Dev: ${stats.std.toFixed(2)}`);
                    
                    // Verify normalization
                    const normalizedMean = stats.normalized.reduce((a, b) => a + b, 0) / stats.normalized.length;
                    const normalizedStd = Math.sqrt(stats.normalized.reduce((a, b) => a + Math.pow(b, 0), 0) / stats.normalized.length);
                    
                    console.log(`Normalized Mean: ${normalizedMean.toFixed(2)} (should be close to 0)`);
                    console.log(`Normalized Std Dev: ${normalizedStd.toFixed(2)} (should be close to 1)`);
                    
                    // Show range of normalized values
                    console.log(`Normalized Range: ${Math.min(...stats.normalized).toFixed(2)} to ${Math.max(...stats.normalized).toFixed(2)}`);
                });

                // Show correlations between normalized variables
                console.log("\nCorrelations between normalized variables:");
                variables.forEach((var1, i) => {
                    variables.slice(i + 1).forEach(var2 => {
                        const correlation = calculateCorrelation(
                            normalizedStats[var1].normalized,
                            normalizedStats[var2].normalized
                        );
                        console.log(`${var1} vs ${var2}: ${correlation.toFixed(3)}`);
                    });
                });
            }
        });
    } catch (error) {
        console.error('Error:', error);
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

normalizeVariables();



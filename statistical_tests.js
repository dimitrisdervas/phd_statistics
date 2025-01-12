const fs = window.fs;
const Papa = require('papaparse');

async function performStatisticalTests() {
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
                    row.Injury_Rate != null
                );

                // 1. Correlation Analysis
                console.log("\nCORRELATION ANALYSIS:");
                
                function calculateCorrelation(x, y) {
                    const n = x.length;
                    const sum1 = x.reduce((a, b) => a + b, 0);
                    const sum2 = y.reduce((a, b) => a + b, 0);
                    const sum1Sq = x.reduce((a, b) => a + b * b, 0);
                    const sum2Sq = y.reduce((a, b) => a + b * b, 0);
                    const pSum = x.map((x, i) => x * y[i]).reduce((a, b) => a + b, 0);
                    const num = pSum - (sum1 * sum2 / n);
                    const den = Math.sqrt((sum1Sq - sum1 * sum1 / n) * (sum2Sq - sum2 * sum2 / n));
                    return num / den;
                }

                // Convert Injury_Rate to numeric
                const injuryMap = { 'Low': 0, 'Medium': 1, 'High': 2 };
                const injuryNumeric = data.map(row => injuryMap[row.Injury_Rate]);

                const variables = [
                    'Recovery_Hours_per_Night',
                    'Training_Hours_per_Week',
                    'Sprint_Time_sec'
                ];

                variables.forEach(var1 => {
                    const values1 = data.map(row => row[var1]);
                    console.log(`\nCorrelations with ${var1}:`);
                    
                    // Correlation with Injury Rate
                    console.log(`Injury Rate: ${calculateCorrelation(values1, injuryNumeric).toFixed(3)}`);
                    
                    // Correlations with other variables
                    variables.forEach(var2 => {
                        if (var1 !== var2) {
                            const values2 = data.map(row => row[var2]);
                            console.log(`${var2}: ${calculateCorrelation(values1, values2).toFixed(3)}`);
                        }
                    });
                });

                // 2. Simple Linear Regression for Recovery Hours vs Injury Rate
                const x = data.map(row => row.Recovery_Hours_per_Night);
                const y = injuryNumeric;
                const n = x.length;
                
                const xMean = x.reduce((a, b) => a + b, 0) / n;
                const yMean = y.reduce((a, b) => a + b, 0) / n;
                
                const ssxx = x.reduce((a, b) => a + Math.pow(b - xMean, 2), 0);
                const ssyy = y.reduce((a, b) => a + Math.pow(b - yMean, 2), 0);
                const ssxy = x.map((x, i) => (x - xMean) * (y[i] - yMean)).reduce((a, b) => a + b, 0);
                
                const slope = ssxy / ssxx;
                const intercept = yMean - slope * xMean;
                const r2 = Math.pow(ssxy, 2) / (ssxx * ssyy);

                console.log("\nLINEAR REGRESSION RESULTS:");
                console.log(`Slope: ${slope.toFixed(3)}`);
                console.log(`Intercept: ${intercept.toFixed(3)}`);
                console.log(`R-squared: ${r2.toFixed(3)}`);

                // 3. One-way ANOVA-like analysis
                const groups = {};
                data.forEach(row => {
                    if (!groups[row.Injury_Rate]) {
                        groups[row.Injury_Rate] = [];
                    }
                    groups[row.Injury_Rate].push(row.Recovery_Hours_per_Night);
                });

                // Calculate group means and overall mean
                const groupStats = {};
                Object.entries(groups).forEach(([group, values]) => {
                    groupStats[group] = {
                        mean: values.reduce((a, b) => a + b, 0) / values.length,
                        n: values.length,
                        values: values
                    };
                });

                const overallMean = x.reduce((a, b) => a + b, 0) / n;

                // Calculate SS_between and SS_within
                const ssBetween = Object.values(groupStats).reduce((acc, group) => 
                    acc + group.n * Math.pow(group.mean - overallMean, 2), 0);

                const ssWithin = Object.values(groupStats).reduce((acc, group) => 
                    acc + group.values.reduce((sum, val) => 
                        sum + Math.pow(val - group.mean, 2), 0), 0);

                const dfBetween = Object.keys(groups).length - 1;
                const dfWithin = n - Object.keys(groups).length;

                const msBetween = ssBetween / dfBetween;
                const msWithin = ssWithin / dfWithin;
                const fStat = msBetween / msWithin;

                console.log("\nONE-WAY ANOVA-LIKE RESULTS:");
                console.log(`F-statistic: ${fStat.toFixed(3)}`);
                console.log(`MS_between: ${msBetween.toFixed(3)}`);
                console.log(`MS_within: ${msWithin.toFixed(3)}`);
            }
        });
    } catch (error) {
        console.error('Error:', error);
    }
}

performStatisticalTests();


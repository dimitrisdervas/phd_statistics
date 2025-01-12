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

// Function to calculate correlation
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

async function performStatisticalTests() {
    try {
        // Create statistical_tests directory
        const outputDir = path.join(process.cwd(), 'statistical_tests');
        await ensureDirectoryExists(outputDir);

        // Read the CSV file
        const csvData = await fs.readFile(path.join(process.cwd(), 'AthleteData.csv'), 'utf8');
        
        Papa.parse(csvData, {
            header: true,
            dynamicTyping: true,
            complete: async function(results) {
                let data = results.data.filter(row => 
                    row.Recovery_Hours_per_Night != null &&
                    row.Training_Hours_per_Week != null &&
                    row.Sprint_Time_sec != null &&
                    row.Injury_Rate != null
                );

                // Convert Injury_Rate to numeric
                const injuryMap = { 'Low': 0, 'Medium': 1, 'High': 2 };
                const injuryNumeric = data.map(row => injuryMap[row.Injury_Rate]);

                // 1. Correlation Analysis
                const variables = [
                    'Recovery_Hours_per_Night',
                    'Training_Hours_per_Week',
                    'Sprint_Time_sec'
                ];

                const correlationResults = {};
                variables.forEach(var1 => {
                    const values1 = data.map(row => row[var1]);
                    correlationResults[var1] = {
                        'Injury_Rate': calculateCorrelation(values1, injuryNumeric)
                    };
                    
                    variables.forEach(var2 => {
                        if (var1 !== var2) {
                            const values2 = data.map(row => row[var2]);
                            correlationResults[var1][var2] = calculateCorrelation(values1, values2);
                        }
                    });
                });

                // 2. Linear Regression Analysis
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

                const regressionResults = {
                    slope,
                    intercept,
                    r2,
                    predictedValues: x.map(x => slope * x + intercept)
                };

                // 3. ANOVA Analysis
                const groups = {};
                data.forEach(row => {
                    if (!groups[row.Injury_Rate]) {
                        groups[row.Injury_Rate] = [];
                    }
                    groups[row.Injury_Rate].push(row.Recovery_Hours_per_Night);
                });

                const groupStats = {};
                Object.entries(groups).forEach(([group, values]) => {
                    groupStats[group] = {
                        mean: values.reduce((a, b) => a + b, 0) / values.length,
                        n: values.length,
                        values: values
                    };
                });

                const overallMean = x.reduce((a, b) => a + b, 0) / n;
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

                const anovaResults = {
                    groupStats,
                    overallMean,
                    ssBetween,
                    ssWithin,
                    dfBetween,
                    dfWithin,
                    msBetween,
                    msWithin,
                    fStat
                };

                // Export results
                try {
                    // Export correlation results
                    const correlationPath = path.join(outputDir, 'correlation_analysis.json');
                    await fs.writeFile(correlationPath, JSON.stringify(correlationResults, null, 2));
                    console.log(`Correlation analysis results exported to ${correlationPath}`);

                    // Export regression results
                    const regressionPath = path.join(outputDir, 'regression_analysis.json');
                    await fs.writeFile(regressionPath, JSON.stringify(regressionResults, null, 2));
                    console.log(`Regression analysis results exported to ${regressionPath}`);

                    // Export ANOVA results
                    const anovaPath = path.join(outputDir, 'anova_analysis.json');
                    await fs.writeFile(anovaPath, JSON.stringify(anovaResults, null, 2));
                    console.log(`ANOVA analysis results exported to ${anovaPath}`);

                    // Create a summary report in markdown format
                    const summaryReport = `# Statistical Analysis Summary

## Correlation Analysis
${Object.entries(correlationResults).map(([var1, correlations]) => `
### Correlations with ${var1}
${Object.entries(correlations).map(([var2, corr]) => `- ${var2}: ${corr.toFixed(3)}`).join('\n')}`).join('\n')}

## Linear Regression Analysis
- Slope: ${slope.toFixed(3)}
- Intercept: ${intercept.toFixed(3)}
- R-squared: ${r2.toFixed(3)}

## ANOVA Results
- F-statistic: ${fStat.toFixed(3)}
- MS between: ${msBetween.toFixed(3)}
- MS within: ${msWithin.toFixed(3)}

### Group Statistics
${Object.entries(groupStats).map(([group, stats]) => `
#### ${group}
- Mean: ${stats.mean.toFixed(3)}
- N: ${stats.n}`).join('\n')}`;

                    const reportPath = path.join(outputDir, 'statistical_analysis_summary.md');
                    await fs.writeFile(reportPath, summaryReport);
                    console.log(`Summary report exported to ${reportPath}`);

                } catch (error) {
                    console.error('Error writing files:', error);
                }
            }
        });
    } catch (error) {
        console.error('Error:', error);
    }
}

// Run the analysis
performStatisticalTests();
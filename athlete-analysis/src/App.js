import React from 'react';
import DataFlowPage from './components/DataFlowPage';
import MissingValuesHeatmap from './components/MissingValuesHeatmap';
import QQPlotsPanel from './components/QQPlotsPanel';
import DistributionAnalysis from './components/DistributionAnalysis';
import NormalizationDensityPlots from './components/NormalizationDensityPlots';
import CorrelationMatrixVisualization from './components/CorrelationMatrixVisualization';
import SleepInjuryRelationshipPlot from './components/SleepInjuryRelationshipPlot';
import TrainingLoadInteractionPlot from './components/TrainingLoadInteractionPlot';
import MediationAnalysisDiagram from './components/MediationAnalysisDiagram'; 


function App() {
  return (
    <div className="App">
      <DataFlowPage />
      <MissingValuesHeatmap />
      <QQPlotsPanel />
      <DistributionAnalysis />
      <NormalizationDensityPlots />
      <CorrelationMatrixVisualization />
<SleepInjuryRelationshipPlot />
<TrainingLoadInteractionPlot />
<MediationAnalysisDiagram />
    </div>
  );
}

export default App;
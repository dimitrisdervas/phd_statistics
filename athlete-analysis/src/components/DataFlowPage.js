import React from 'react';
import DataCleaningFlow from './DataCleaningFlow';

const DataFlowPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-center mb-4">
            Διαδικασία Καθαρισμού Δεδομένων Αθλητών
          </h1>
          <p className="text-gray-600 text-center">
            Οπτικοποίηση της διαδικασίας καθαρισμού από το αρχικό σύνολο δεδομένων στο τελικό δείγμα
          </p>
        </div>

        {/* Sankey Diagram */}
        <DataCleaningFlow />

        {/* Explanation */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">Επεξήγηση Διαδικασίας</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <span className="font-semibold">Αρχικό Σύνολο:</span> 150 περιπτώσεις
            </li>
            <li>
              <span className="font-semibold">Αφαιρέθηκαν:</span>
              <ul className="list-circle pl-6 mt-2 space-y-1">
                <li>22 περιπτώσεις με ελλιπή δεδομένα</li>
                <li>12 περιπτώσεις με ακραίες τιμές βάρους</li>
                <li>8 περιπτώσεις με ασυνεπή δεδομένα</li>
              </ul>
            </li>
            <li>
              <span className="font-semibold">Τελικό Δείγμα:</span> 108 περιπτώσεις
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DataFlowPage;
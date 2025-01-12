import React from 'react';
import { ResponsiveContainer, Sankey, Label, Rectangle, Layer, Text } from 'recharts';

const DataCleaningFlow = () => {
  // Data structure for the Sankey diagram
  const data = {
    nodes: [
      { 
        name: 'Αρχικό Σύνολο\nΔεδομένων',
        value: 150,
        x: 10,
        y: 100
      },
      { 
        name: 'Ελλιπείς Τιμές',
        value: 22,
        x: 250,
        y: 0
      },
      { 
        name: 'Ακραίες Τιμές\nΒάρους',
        value: 12,
        x: 250,
        y: 100
      },
      { 
        name: 'Ασυνεπή\nΔεδομένα',
        value: 8,
        x: 250,
        y: 200
      },
      { 
        name: 'Τελικό Δείγμα',
        value: 108,
        x: 250,
        y: 300
      }
    ],
    links: [
      { 
        source: 0,
        target: 1,
        value: 22,
        label: '22 περιπτώσεις'
      },
      { 
        source: 0,
        target: 2,
        value: 12,
        label: '12 περιπτώσεις'
      },
      { 
        source: 0,
        target: 3,
        value: 8,
        label: '8 περιπτώσεις'
      },
      { 
        source: 0,
        target: 4,
        value: 108,
        label: '108 περιπτώσεις'
      }
    ]
  };

  const CustomNode = ({ x, y, width, height, index, payload }) => {
    return (
      <g>
        <Rectangle
          x={x}
          y={y}
          width={width}
          height={height}
          fill="#1f77b4"
          fillOpacity={0.9}
        />
        <text
          x={x + width / 2}
          y={y + height / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#fff"
          fontSize={12}
        >
          {payload.name}
          {'\n'}
          (n={payload.value})
        </text>
      </g>
    );
  };

  const CustomLink = ({ sourceX, sourceY, targetX, targetY, sourceControlX, targetControlX, linkWidth, index }) => {
    const link = data.links[index];
    const midX = (sourceX + targetX) / 2;
    const midY = (sourceY + targetY) / 2;

    return (
      <g>
        <path
          d={`
            M${sourceX},${sourceY}
            C${sourceControlX},${sourceY} ${targetControlX},${targetY} ${targetX},${targetY}
          `}
          fill="none"
          stroke="#77b5e8"
          strokeWidth={linkWidth}
          strokeOpacity={0.5}
        />
        <text
          x={midX}
          y={midY}
          dy={-10}
          textAnchor="middle"
          fill="#666"
          fontSize={12}
          className="font-medium"
        >
          {link.label}
        </text>
      </g>
    );
  };

  return (
    <div className="w-full h-[600px] bg-white rounded-lg shadow-lg p-4">
      <h2 className="text-2xl font-bold mb-4 text-center">Διαδικασία Καθαρισμού Δεδομένων</h2>
      <div className="w-full h-[500px]">
        <ResponsiveContainer>
          <Sankey
            data={data}
            node={CustomNode}
            link={CustomLink}
            nodePadding={50}
            margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
          />
        </ResponsiveContainer>
      </div>
      
      {/* Legend */}
      <div className="mt-4 flex justify-center gap-6">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-[#1f77b4] mr-2"></div>
          <span className="text-sm text-gray-600">Κόμβοι Δεδομένων</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-[#77b5e8] opacity-50 mr-2"></div>
          <span className="text-sm text-gray-600">Ροή Δεδομένων</span>
        </div>
      </div>
    </div>
  );
};

export default DataCleaningFlow;
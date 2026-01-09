import React from 'react';
import GaugeComponent from 'react-gauge-component';

interface GaugeChartProps {
  value: number; // 0 a 100
  size?: number;
}

const GaugeChart: React.FC<GaugeChartProps> = ({ value, size = 320 }) => {
  return (
    <div className="w-full flex justify-center">
      <GaugeComponent
        type="semicircle"
        arc={{
          width: 0.2,
          padding: 0.005,
          cornerRadius: 1,
          subArcs: [
            {
              limit: 80,
              color: '#e5e7eb',
              showTick: true,
              tooltip: {
                text: 'Progresso padrão'
              }
            },
            {
              limit: 85,
              color: '#fbbf24',
              showTick: true,
              tooltip: {
                text: 'SELO OURO - 80%'
              }
            },
            {
              limit: 100,
              color: '#3b82f6',
              showTick: true,
              tooltip: {
                text: 'SELO DIAMANTE - 85%'
              }
            }
          ]
        }}
        pointer={{
          color: value >= 85 ? '#3b82f6' : value >= 80 ? '#fbbf24' : '#6b7280',
          length: 0.80,
          width: 15,
          elastic: true
        }}
        labels={{
          valueLabel: { hide: true },
          tickLabels: {
            type: 'outer',
            ticks: [
              { value: 0 },
              { value: 20 },
              { value: 40 },
              { value: 60 },
              { value: 80 },
              { value: 85 },
              { value: 100 }
            ],
            defaultTickValueConfig: {
              style: {
                fontSize: '12px',
                fill: '#64748b',
                fontWeight: '600'
              }
            }
          }
        }}
        value={value}
        minValue={0}
        maxValue={100}
        marginInPercent={{
          top: 0.1,
          bottom: 0,
          left: 0.1,
          right: 0.1
        }}
      />
    </div>
  );
};

export default GaugeChart;

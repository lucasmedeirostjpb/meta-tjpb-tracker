import React from 'react';
import GaugeComponent from 'react-gauge-component';

interface GaugeChartProps {
  value: number; // 0 a 100
  maxValue?: number; // Limite máximo possível (0 a 100)
  size?: number;
}

const GaugeChart: React.FC<GaugeChartProps> = ({ value, maxValue, size = 320 }) => {
  // Construir subArcs baseado se há limite máximo
  const buildSubArcs = () => {
    const baseArcs = [
      {
        limit: 75,
        color: '#e5e7eb',
        showTick: true,
        tooltip: { text: 'Progresso padrão' }
      },
      {
        limit: 80,
        color: '#333b4dff',
        showTick: true,
        tooltip: { text: 'SELO PRATA - 75%' }
      },
      {
        limit: 85,
        color: '#fbbf24',
        showTick: true,
        tooltip: { text: 'SELO OURO - 80%' }
      }
    ];

    // Se há limite máximo, adicionar arco azul até o limite e vermelho depois
    if (maxValue !== undefined && maxValue < 100) {
      return [
        ...baseArcs,
        {
          limit: maxValue,
          color: '#3b82f6',
          showTick: true,
          tooltip: { text: `SELO DIAMANTE - 85% / Máximo: ${maxValue.toFixed(1)}%` }
        },
        {
          limit: 100,
          color: '#dc2626',
          showTick: false,
          tooltip: { text: 'Pontos comprometidos' }
        }
      ];
    }

    // Caso contrário, arco azul até 100%
    return [
      ...baseArcs,
      {
        limit: 100,
        color: '#3b82f6',
        showTick: true,
        tooltip: { text: 'SELO DIAMANTE - 85%' }
      }
    ];
  };

  return (
    <div className="w-full flex justify-center">
      <GaugeComponent
        type="semicircle"
        arc={{
          width: 0.2,
          padding: 0.005,
          cornerRadius: 1,
          subArcs: buildSubArcs()
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

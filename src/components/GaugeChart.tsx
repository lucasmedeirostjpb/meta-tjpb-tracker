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
    // Se há limite máximo e é menor que 85%, ajustar os arcos
    if (maxValue !== undefined && maxValue < 100 && maxValue > 0) {
      const arcs = [];
      
      // Arco cinza até 75% ou maxValue (o que for menor)
      if (maxValue > 75) {
        arcs.push({
          limit: 75,
          color: '#e5e7eb',
          showTick: true,
          tooltip: { text: 'Progresso padrão' }
        });
      } else {
        arcs.push({
          limit: maxValue,
          color: '#e5e7eb',
          showTick: true,
          tooltip: { text: `Máximo possível: ${maxValue.toFixed(1)}%` }
        });
      }
      
      // Arco prata até 80% ou maxValue (o que for menor)
      if (maxValue > 80 && arcs[arcs.length - 1].limit < 80) {
        arcs.push({
          limit: 80,
          color: '#9ca3af',
          showTick: true,
          tooltip: { text: 'SELO PRATA - 75%' }
        });
      } else if (maxValue > 75 && maxValue <= 80) {
        arcs.push({
          limit: maxValue,
          color: '#9ca3af',
          showTick: true,
          tooltip: { text: `SELO PRATA - 75% / Máximo: ${maxValue.toFixed(1)}%` }
        });
      }
      
      // Arco ouro até 85% ou maxValue (o que for menor)
      if (maxValue > 85 && arcs[arcs.length - 1].limit < 85) {
        arcs.push({
          limit: 85,
          color: '#fbbf24',
          showTick: true,
          tooltip: { text: 'SELO OURO - 80%' }
        });
      } else if (maxValue > 80 && maxValue <= 85) {
        arcs.push({
          limit: maxValue,
          color: '#fbbf24',
          showTick: true,
          tooltip: { text: `SELO OURO - 80% / Máximo: ${maxValue.toFixed(1)}%` }
        });
      }
      
      // Arco azul até maxValue (se maxValue > 85)
      if (maxValue > 85 && arcs[arcs.length - 1].limit < maxValue) {
        arcs.push({
          limit: maxValue,
          color: '#3b82f6',
          showTick: true,
          tooltip: { text: `SELO DIAMANTE - 85% / Máximo: ${maxValue.toFixed(1)}%` }
        });
      }
      
      // Arco vermelho de maxValue até 100% (pontos comprometidos)
      if (arcs[arcs.length - 1].limit < 100) {
        arcs.push({
          limit: 100,
          color: '#dc2626',
          showTick: false,
          tooltip: { text: 'Pontos comprometidos' }
        });
      }
      
      return arcs;
    }

    // Caso padrão sem limite máximo
    return [
      {
        limit: 75,
        color: '#e5e7eb',
        showTick: true,
        tooltip: { text: 'Progresso padrão' }
      },
      {
        limit: 80,
        color: '#9ca3af',
        showTick: true,
        tooltip: { text: 'SELO PRATA - 75%' }
      },
      {
        limit: 85,
        color: '#fbbf24',
        showTick: true,
        tooltip: { text: 'SELO OURO - 80%' }
      },
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

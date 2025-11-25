import React, { useState, useMemo } from 'react';

interface Point {
  x: number;
  y: number;
}

interface Series {
  name: string;
  color: string;
  points: Point[];
}

interface HistoryGraphProps {
  data: Series[];
  title: string;
  yAxisLabel: string;
  invertY?: boolean;
}

const HistoryGraph: React.FC<HistoryGraphProps> = ({ data, title, yAxisLabel, invertY = false }) => {
  const [tooltip, setTooltip] = useState<{ series: Series; point: Point; x: number; y: number } | null>(null);
  const padding = { top: 40, right: 20, bottom: 60, left: 50 };
  const width = 800;
  const height = 400;

  const { yMin, yMax, years } = useMemo(() => {
    let allPoints: Point[] = [];
    data.forEach(s => allPoints.push(...s.points));
    if (allPoints.length === 0) return { yMin: 70, yMax: 100, years: [] };

    const rawYMin = Math.min(...allPoints.map(p => p.y));
    const rawYMax = Math.max(...allPoints.map(p => p.y));
    const yRange = rawYMax - rawYMin;
    const yMin = invertY ? 0 : Math.floor(rawYMin - yRange * 0.1) - 1;
    const yMax = invertY ? (Math.ceil(rawYMax / 2) * 2) + 2 :Math.ceil(rawYMax + yRange * 0.1) + 1;
    
    const years = Array.from(new Set(allPoints.map(p => p.x))).sort((a,b)=> a-b);
    
    return { yMin, yMax, years };
  }, [data, invertY]);
  
  const yAxisTicks = useMemo(() => {
      const ticks = [];
      const range = yMax - yMin;
      if(range <= 0) return [yMin];
      
      const numTicks = 5;
      const rawStep = range / numTicks;
      const step = invertY ? 4 : Math.max(1, Math.round(rawStep / 5) * 5);
      const startTick = invertY ? yMin : Math.floor(yMin / step) * step;

      for (let i = startTick; i <= yMax; i += step) {
          if (i > 0) ticks.push(i);
      }
      return Array.from(new Set(ticks));
  }, [yMin, yMax, invertY]);

  const yearIndexMap = useMemo(() => new Map(years.map((year, i) => [year, i])), [years]);

  const scaleX = (year: number) => {
    const numYears = years.length;
    const index = yearIndexMap.get(year) ?? 0;
    const graphWidth = width - padding.left - padding.right;
    if (numYears <= 1) {
        return padding.left + graphWidth / 2;
    }
    return padding.left + (index / (numYears - 1)) * graphWidth;
  };

  const scaleY = (val: number) => {
    if (yMax - yMin === 0) return height - padding.bottom;
    const graphHeight = height - padding.top - padding.bottom;
    const valRatio = (val - yMin) / (yMax - yMin);
    const yPos = height - padding.bottom - (valRatio * graphHeight);
    return invertY ? padding.top + (valRatio * graphHeight) : yPos;
  };

  if (data.length === 0 || data.every(s => s.points.length === 0)) {
    return (
        <div className="w-full bg-gray-800 rounded-lg p-4 text-center">
            <h3 className="text-xl font-bold mb-2 text-white">{title}</h3>
            <p className="text-gray-400">Not enough data to display graph. Complete at least one season.</p>
        </div>
    );
  }

  return (
    <div className="relative bg-gray-800 rounded-lg p-4">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
        <text x={width / 2} y={padding.top / 2} textAnchor="middle" fill="white" fontSize="18" fontWeight="bold">
          {title}
        </text>
        
        {/* Y Axis Label and Grid */}
        <text transform={`translate(${padding.left / 3}, ${height / 2}) rotate(-90)`} textAnchor="middle" fill="#9ca3af" fontSize="12">
            {yAxisLabel}
        </text>
        {yAxisTicks.map(tick => (
          <g key={`y-tick-${tick}`}>
            <line x1={padding.left} y1={scaleY(tick)} x2={width - padding.right} y2={scaleY(tick)} stroke="#4b5563" strokeDasharray="2,2" />
            <text x={padding.left - 8} y={scaleY(tick) + 4} textAnchor="end" fill="#9ca3af" fontSize="10">{tick}</text>
          </g>
        ))}
        <line x1={padding.left} y1={padding.top} x2={padding.left} y2={height - padding.bottom} stroke="#9ca3af" />

        {/* X Axis & Vertical Lines */}
        {years.map(year => {
            const xPos = scaleX(year);
            return (
                <g key={`year-axis-${year}`}>
                    <line x1={xPos} y1={padding.top} x2={xPos} y2={height-padding.bottom} stroke="#4b5563" strokeDasharray="2,2" />
                    <text x={xPos} y={height - padding.bottom + 20} textAnchor="middle" fill="#9ca3af" fontSize="12">{year}</text>
                </g>
            )
        })}

        {/* Data Lines */}
        {data.map(series => (
            <path
                key={series.name}
                d={`M ${series.points.map(p => `${scaleX(p.x)} ${scaleY(p.y)}`).join(" L ")}`}
                fill="none"
                stroke={series.color}
                strokeWidth="2"
            />
        ))}

        {/* Data Points & Tooltip Triggers */}
        {data.map(series =>
            series.points.map(point => (
                <circle
                    key={`${series.name}-${point.x}`}
                    cx={scaleX(point.x)}
                    cy={scaleY(point.y)}
                    r="6"
                    fill={series.color}
                    className="cursor-pointer"
                    onMouseEnter={() => setTooltip({ series, point, x: scaleX(point.x), y: scaleY(point.y) })}
                    onMouseLeave={() => setTooltip(null)}
                />
            ))
        )}
      </svg>
      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-2">
        {data.map(series => (
            <div key={series.name} className="flex items-center">
                <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: series.color }}></div>
                <span className="text-xs text-gray-300">{series.name}</span>
            </div>
        ))}
      </div>
      {/* Tooltip */}
      {tooltip && (
          <div 
            className="absolute bg-gray-900 border border-gray-600 rounded-md p-2 text-xs text-white shadow-lg pointer-events-none transition-transform"
            style={{ left: `${tooltip.x}px`, top: `${tooltip.y}px`, transform: `translate(-50%, -120%)` }}
          >
            <p className="font-bold" style={{color: tooltip.series.color}}>{tooltip.series.name}</p>
            <p>Year: {tooltip.point.x}</p>
            <p>{yAxisLabel}: {tooltip.point.y}</p>
          </div>
      )}
    </div>
  );
};

export default HistoryGraph;
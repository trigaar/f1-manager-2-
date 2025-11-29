
import React, { useState } from 'react';
import { InitialDriver, Car, TeamPersonnel, Driver, DriverSkills, DriverTraitRarity } from '../types';
import { getTeamColors } from '../constants';
import { describeCarLink } from '../services/carLinkService';

const attributeColors: Record<string, string> = {
    overall: '#38bdf8',
    qualifyingPace: '#a855f7',
    raceCraft: '#f97316',
    tyreManagement: '#22c55e',
    consistency: '#facc15',
    wetWeatherSkill: '#0ea5e9',
    aggressionIndex: '#ef4444',
    incidentProneness: '#94a3b8',
    loyalty: '#fb7185',
    potential: '#8b5cf6',
    reputation: '#38bdf8',
};

const attributeLabels: Record<keyof DriverSkills, string> = {
    overall: 'Overall Rating',
    qualifyingPace: 'Qualifying Pace',
    raceCraft: 'Race Craft',
    tyreManagement: 'Tyre Management',
    consistency: 'Consistency',
    wetWeatherSkill: 'Wet Weather',
    aggressionIndex: 'Aggression',
    incidentProneness: 'Incident Proneness',
    loyalty: 'Loyalty',
    potential: 'Potential',
    reputation: 'Reputation',
    specialties: 'Specialties',
    trait: 'Trait',
};

const StatBar: React.FC<{ label: string; value: number; color: string }> = ({ label, value }) => (
  <div className="mb-2">
    <div className="flex justify-between mb-1">
      <span className="text-xs font-semibold text-gray-300 uppercase tracking-wide">{label}</span>
      <span className="text-sm font-extrabold text-white">{value.toFixed(0)}</span>
    </div>
    <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
      <div className="h-2 rounded-full shadow-lg" style={{ width: `${value}%`, backgroundColor: '#ffffff' }}></div>
    </div>
  </div>
);

const formatAttributeName = (attr: string) => {
    if (attributeLabels[attr as keyof DriverSkills]) {
        return attributeLabels[attr as keyof DriverSkills];
    }
    return attr.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
}

const RadarChart: React.FC<{ attributes: (keyof DriverSkills)[]; values: number[] }> = ({ attributes, values }) => {
    const size = 260;
    const center = size / 2;
    const radius = 95;

    const points = attributes.map((_, idx) => {
        const angle = (2 * Math.PI * idx / attributes.length) - Math.PI / 2;
        const value = values[idx] || 0;
        const r = (value / 100) * radius;
        const x = center + r * Math.cos(angle);
        const y = center + r * Math.sin(angle);
        return `${x},${y}`;
    }).join(' ');

    const gridRings = [0.25, 0.5, 0.75, 1];

    return (
        <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-64">
            <defs>
                <radialGradient id="radarGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="rgba(56,189,248,0.15)" />
                    <stop offset="100%" stopColor="rgba(56,189,248,0)" />
                </radialGradient>
            </defs>

            <circle cx={center} cy={center} r={radius + 14} fill="url(#radarGlow)" />

            {gridRings.map((ring, i) => (
                <polygon
                    key={ring}
                    points={attributes.map((_, idx) => {
                        const angle = (2 * Math.PI * idx / attributes.length) - Math.PI / 2;
                        const r = ring * radius;
                        const x = center + r * Math.cos(angle);
                        const y = center + r * Math.sin(angle);
                        return `${x},${y}`;
                    }).join(' ')}
                    fill="none"
                    stroke="rgba(148, 163, 184, 0.35)"
                    strokeWidth={i === gridRings.length - 1 ? 1.5 : 1}
                />
            ))}

            {attributes.map((_, idx) => {
                const angle = (2 * Math.PI * idx / attributes.length) - Math.PI / 2;
                const x = center + (radius + 2) * Math.cos(angle);
                const y = center + (radius + 2) * Math.sin(angle);
                return <line key={`axis-${idx}`} x1={center} y1={center} x2={x} y2={y} stroke="rgba(148, 163, 184, 0.3)" strokeWidth="1" />;
            })}

            <polygon
                points={points}
                fill="rgba(56, 189, 248, 0.22)"
                stroke="#38bdf8"
                strokeWidth="2"
            />

            {attributes.map((attr, idx) => {
                const angle = (2 * Math.PI * idx / attributes.length) - Math.PI / 2;
                const r = (values[idx] / 100) * radius;
                const x = center + r * Math.cos(angle);
                const y = center + r * Math.sin(angle);
                const labelDistance = radius + 18;
                const labelX = center + labelDistance * Math.cos(angle);
                const labelY = center + labelDistance * Math.sin(angle);
                return (
                    <g key={attr}>
                        <circle cx={x} cy={y} r={4} fill={attributeColors[attr] || '#38bdf8'} stroke="#0ea5e9" strokeWidth={1.5} />
                        <text
                            x={labelX}
                            y={labelY}
                            fill="#e5e7eb"
                            fontSize="10"
                            textAnchor="middle"
                            alignmentBaseline="middle"
                            className="drop-shadow-sm"
                        >
                            {formatAttributeName(attr)}
                        </text>
                    </g>
                );
            })}
        </svg>
    );
};

const TraitDisplay: React.FC<{ trait: InitialDriver['driverSkills']['trait'] }> = ({ trait }) => {
    if (!trait) return null;

    const getRarityColor = () => {
        switch (trait.rarity) {
            case DriverTraitRarity.Legendary: return 'border-yellow-400 text-yellow-400';
            case DriverTraitRarity.Rare: return 'border-blue-400 text-blue-400';
            case DriverTraitRarity.Common: return 'border-gray-400 text-gray-300';
            default: return 'border-gray-500';
        }
    };

    return (
        <div className={`mt-4 p-3 border rounded-md ${getRarityColor()}`}>
            <p className="font-bold text-sm">{trait.name} <span className="text-xs font-normal">({trait.rarity})</span></p>
            <p className="text-xs text-gray-400 italic mt-1">{trait.description}</p>
        </div>
    );
};

interface TeamDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  team: {
    drivers: (InitialDriver | Driver)[];
    car: Car;
    personnel: TeamPersonnel;
  } | null;
}

const TeamDetailModal: React.FC<TeamDetailModalProps> = ({ isOpen, onClose, team }) => {
  const [chartMode, setChartMode] = useState<'bar' | 'radar'>('bar');
  if (!isOpen || !team) return null;

  const { teamHexColor } = getTeamColors(team.car.teamName);

  const getRatingColor = (rating: number) => {
    if (rating > 85) return 'text-green-400';
    if (rating > 65) return 'text-teal-400';
    if (rating > 50) return 'text-yellow-400';
    return 'text-red-400';
  }
  
  const radarAttributes: (keyof DriverSkills)[] = [
    'overall',
    'qualifyingPace',
    'raceCraft',
    'tyreManagement',
    'consistency',
    'wetWeatherSkill',
    'aggressionIndex',
    'incidentProneness'
  ];

  const driverSkillsOrder: (keyof DriverSkills)[] = [...radarAttributes, 'loyalty', 'reputation'];

  // numeric subset used by the radar chart; declared once to avoid duplicate identifiers during bundling
  const numericSkillAttributes: (keyof DriverSkills)[] = radarAttributes;

  return (
    <div 
        className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4 animate-fade-in"
        onClick={onClose}
    >
      <div 
        className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto border border-gray-700"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-gray-800 p-4 border-b border-gray-700 flex justify-between items-center z-10">
          <h2 className="text-2xl font-bold text-white" style={{color: teamHexColor}}>{team.car.teamName}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
        </div>

        <div className="p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-300 uppercase tracking-wider">Drivers</h3>
                <div className="flex bg-gray-700/70 rounded-lg overflow-hidden border border-gray-600">
                    <button
                        className={`px-3 py-2 text-sm font-semibold ${chartMode === 'bar' ? 'bg-gray-600 text-white' : 'text-gray-300 hover:text-white'}`}
                        onClick={() => setChartMode('bar')}
                    >
                        Bar
                    </button>
                    <button
                        className={`px-3 py-2 text-sm font-semibold ${chartMode === 'radar' ? 'bg-gray-600 text-white' : 'text-gray-300 hover:text-white'}`}
                        onClick={() => setChartMode('radar')}
                    >
                        Radar
                    </button>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {team.drivers.map(driver => {
                    const seasonRatings = 'seasonRaceRatings' in driver && driver.seasonRaceRatings ? driver.seasonRaceRatings : [];
                    const avgSeasonRating = seasonRatings.length > 0
                        ? seasonRatings.reduce((a, b) => a + b, 0) / seasonRatings.length
                        : null;

                    const skillValues = numericSkillAttributes.map((attr) => {
                        const value = driver.driverSkills[attr];
                        return typeof value === 'number' ? value : 0;
                    });

                    return (
                        <div key={driver.id} className="bg-gray-900/60 p-5 rounded-xl border border-gray-800 shadow-xl space-y-4">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="font-bold text-xl text-white">{driver.name} <span className="text-sm text-gray-400 font-normal">({driver.age})</span></p>
                                    <p className="text-xs uppercase text-gray-400 tracking-wide">{driver.shortName}</p>
                                </div>
                                <div className="text-right space-y-1">
                                    <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-emerald-600/30 border border-emerald-500 text-emerald-100">Overall {driver.driverSkills.overall.toFixed(0)}</span>
                                    {driver.rookie && <p className="text-[11px] text-blue-200 uppercase">Rookie Prospect</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-gray-800/60 rounded-lg p-3 border border-gray-700/60">
                                    <p className="text-[11px] text-gray-400 uppercase">Salary</p>
                                    <p className="text-lg font-bold text-white">${(driver.salary / 1_000_000).toFixed(1)}M</p>
                                </div>
                                <div className="bg-gray-800/60 rounded-lg p-3 border border-gray-700/60">
                                    <p className="text-[11px] text-gray-400 uppercase">Season Rating</p>
                                    <p className={`text-lg font-bold ${avgSeasonRating ? getRatingColor(avgSeasonRating) : 'text-white'}`}>
                                        {avgSeasonRating ? avgSeasonRating.toFixed(0) : '-'}
                                    </p>
                                </div>
                                <div className="bg-gray-800/60 rounded-lg p-3 border border-gray-700/60 text-center">
                                    <p className="text-[11px] text-gray-400 uppercase">Wins</p>
                                    <p className="text-2xl font-bold text-white">{driver.careerWins || 0}</p>
                                </div>
                                <div className="bg-gray-800/60 rounded-lg p-3 border border-gray-700/60 text-center">
                                    <p className="text-[11px] text-gray-400 uppercase">Podiums</p>
                                    <p className="text-2xl font-bold text-white">{driver.careerPodiums || 0}</p>
                                </div>
                            </div>

                            <div className="grid lg:grid-cols-2 gap-4 items-start">
                                <div className="bg-gray-900/60 rounded-lg p-3 border border-gray-800/80">
                                    {chartMode === 'bar' ? (
                                        <div className="grid sm:grid-cols-2 gap-3">
                                            {driverSkillsOrder.map((key) => {
                                                const value = driver.driverSkills[key];
                                                if(typeof value === 'number') {
                                                    return (
                                                        <StatBar
                                                            key={key}
                                                            label={formatAttributeName(key)}
                                                            value={value}
                                                            color={attributeColors[key] || '#38bdf8'}
                                                        />
                                                    )
                                                }
                                                return null;
                                            })}
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <RadarChart attributes={numericSkillAttributes} values={skillValues} />
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                                {numericSkillAttributes.map((attr, idx) => (
                                                    <div key={attr} className="flex items-center gap-2 bg-gray-800/60 border border-gray-700 rounded-md px-2 py-1.5">
                                                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: attributeColors[attr] || '#38bdf8' }}></span>
                                                        <span className="text-gray-200">{formatAttributeName(attr)}</span>
                                                        <span className="ml-auto font-semibold text-white">{skillValues[idx].toFixed(0)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-3">
                                    <div className="bg-gray-900/70 border border-gray-800 rounded-lg p-3">
                                        <p className="text-xs text-gray-400 uppercase mb-1">Car Link</p>
                                        <div className="flex justify-between gap-3 items-start">
                                            <div>
                                                <p className="text-white font-semibold leading-tight">{describeCarLink(driver.carLink)}</p>
                                                {driver.carLink.notes && (
                                                    <p className="text-xs text-gray-400 mt-1">{driver.carLink.notes}</p>
                                                )}
                                            </div>
                                            <div className="text-right text-sm">
                                                <p className="text-[11px] uppercase text-gray-400">Compatibility</p>
                                                <p className="text-lg font-bold text-white">{driver.carLink.compatibility}%</p>
                                                <p className="text-[11px] uppercase text-gray-400 mt-2">Adaptation</p>
                                                <p className="text-lg font-bold text-white">{driver.carLink.adaptation}%</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 mt-3">
                                            <StatBar label="Compatibility" value={driver.carLink.compatibility} color="#e2e8f0" />
                                            <StatBar label="Adaptation" value={driver.carLink.adaptation} color="#cbd5e1" />
                                        </div>
                                    </div>
                                    {driver.driverSkills.specialties && driver.driverSkills.specialties.length > 0 && (
                                        <div className="bg-gray-900/70 border border-gray-800 rounded-lg p-3">
                                            <p className="text-xs text-gray-400 uppercase mb-1">Specialties</p>
                                            <div className="flex flex-wrap gap-2">
                                                {driver.driverSkills.specialties.slice(0, 3).map((specialty) => (
                                                    <span
                                                        key={specialty}
                                                        className="px-2 py-1 text-xs rounded-full border border-white/25 text-white bg-white/10"
                                                    >
                                                        {specialty}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    <TraitDisplay trait={driver.driverSkills.trait} />
                                </div>
                            </div>

                            <div className="bg-gray-900/60 border border-gray-800 rounded-lg p-3">
                                <h4 className="text-sm font-semibold mb-2 text-gray-300 uppercase tracking-wider">Career History</h4>
                                <div className="text-xs text-gray-300 space-y-1 max-h-24 overflow-y-auto bg-gray-800/40 p-2 rounded-md">
                                    {Object.entries(driver.careerHistory || {}).sort((a,b) => parseInt(b[0]) - parseInt(a[0])).map(([year, team]) => (
                                        <div key={year} className="flex justify-between">
                                            <span>{year}:</span>
                                            <span className="font-semibold">{team}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
      </div>
    </div>
  );
};

export default TeamDetailModal;

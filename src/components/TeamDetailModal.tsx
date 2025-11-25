
import React from 'react';
import { InitialDriver, Car, TeamPersonnel, Driver, DriverSkills, DriverTraitRarity } from '../types';
// FIX: Correct import paths
import { getTeamColors } from '../constants';

const StatBar: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
  <div className="mb-2">
    <div className="flex justify-between mb-1">
      <span className="text-sm font-medium text-gray-300">{label}</span>
      <span className="text-sm font-bold text-white">{value.toFixed(0)}</span>
    </div>
    <div className="w-full bg-gray-600 rounded-full h-2">
      <div className="h-2 rounded-full" style={{ width: `${value}%`, backgroundColor: color }}></div>
    </div>
  </div>
);

const formatAttributeName = (attr: string) => {
    return attr.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
}

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
  if (!isOpen || !team) return null;

  const { teamHexColor } = getTeamColors(team.car.teamName);

  const getRatingColor = (rating: number) => {
    if (rating > 85) return 'text-green-400';
    if (rating > 65) return 'text-teal-400';
    if (rating > 50) return 'text-yellow-400';
    return 'text-red-400';
  }
  
  const driverSkillsOrder: (keyof DriverSkills)[] = ['overall', 'qualifyingPace', 'raceCraft', 'tyreManagement', 'consistency', 'wetWeatherSkill', 'aggressionIndex', 'incidentProneness', 'loyalty', 'reputation'];

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
            <h3 className="text-xl font-semibold mb-4 text-gray-300 uppercase tracking-wider">Drivers</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {team.drivers.map(driver => {
                    const seasonRatings = 'seasonRaceRatings' in driver && driver.seasonRaceRatings ? driver.seasonRaceRatings : [];
                    const avgSeasonRating = seasonRatings.length > 0
                        ? seasonRatings.reduce((a, b) => a + b, 0) / seasonRatings.length
                        : null;

                    return (
                        <div key={driver.id} className="bg-gray-900/50 p-4 rounded-lg">
                            <p className="font-bold text-xl text-white">{driver.name} ({driver.age})</p>
                            
                            <div className="grid grid-cols-2 gap-4 my-3">
                                <div>
                                    <p className="text-xs text-gray-400 uppercase">Salary</p>
                                    <p className="text-lg font-bold text-white">${(driver.salary / 1_000_000).toFixed(1)}M</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 uppercase">Season Rating</p>
                                    <p className={`text-lg font-bold ${avgSeasonRating ? getRatingColor(avgSeasonRating) : 'text-white'}`}>
                                        {avgSeasonRating ? avgSeasonRating.toFixed(0) : '-'}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-4 my-3 border-b border-t border-gray-700 py-3">
                                <div className="text-center">
                                    <p className="text-xs text-gray-400 uppercase">Wins</p>
                                    <p className="text-2xl font-bold text-white">{driver.careerWins || 0}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-xs text-gray-400 uppercase">Podiums</p>
                                    <p className="text-2xl font-bold text-white">{driver.careerPodiums || 0}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-xs text-gray-400 uppercase">Championships</p>
                                    <p className="text-2xl font-bold text-yellow-400">{driver.championships || 0}</p>
                                </div>
                            </div>
                            {driverSkillsOrder.map((key) => {
                                const value = driver.driverSkills[key];
                                if(typeof value === 'number') {
                                    return (
                                        <StatBar 
                                            key={key} 
                                            label={formatAttributeName(key)} 
                                            value={value} 
                                            color={teamHexColor}
                                        />
                                    )
                                }
                                return null;
                            })}
                             <TraitDisplay trait={driver.driverSkills.trait} />
                            <h4 className="text-sm font-semibold mt-4 mb-2 text-gray-400 uppercase tracking-wider">Career History</h4>
                            <div className="text-xs text-gray-300 space-y-1 max-h-24 overflow-y-auto bg-gray-700/50 p-2 rounded-md">
                                {Object.entries(driver.careerHistory || {}).sort((a,b) => parseInt(b[0]) - parseInt(a[0])).map(([year, team]) => (
                                    <div key={year} className="flex justify-between">
                                        <span>{year}:</span>
                                        <span className="font-semibold">{team}</span>
                                    </div>
                                ))}
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

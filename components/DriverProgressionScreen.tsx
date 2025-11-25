import React from 'react';
import { DriverProgressionEvent, DriverSkillChange, DriverSkills } from '../types';
import { getTeamColors } from '../constants';

interface DriverProgressionScreenProps {
  season: number;
  log: DriverProgressionEvent[];
  onProceed: () => void;
  onSelectTeam: (teamName: string) => void;
}

const formatAttributeName = (attr: keyof DriverSkills) => {
    return attr.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
};

const ChangeDisplay: React.FC<{ change: DriverSkillChange }> = ({ change }) => {
    const diff = change.newValue - change.oldValue;
    if (diff === 0 && change.skill !== 'overall') return null;

    const color = diff > 0 ? 'text-green-400' : diff < 0 ? 'text-red-400' : 'text-gray-400';
    const sign = diff > 0 ? '+' : '';
    const isOverall = change.skill === 'overall';

    return (
        <div className={`flex justify-between items-center py-1 ${isOverall ? 'text-base border-t border-gray-700 mt-2 pt-2' : 'text-sm'}`}>
            <span className={` ${isOverall ? 'font-bold text-white' : 'text-gray-300'}`}>{formatAttributeName(change.skill)}</span>
            <span className="font-mono">
                {change.oldValue} → {change.newValue}
                <span className={`font-bold ml-2 w-10 inline-block text-right ${color}`}>
                    ({sign}{diff})
                </span>
            </span>
        </div>
    );
};

const DriverProgressionScreen: React.FC<DriverProgressionScreenProps> = ({ season, log, onProceed, onSelectTeam }) => {
    return (
        <div className="w-full max-w-6xl bg-gray-800 p-6 rounded-lg shadow-2xl flex flex-col items-center animate-fade-in">
            <h2 className="text-4xl font-bold mb-1 text-white tracking-widest">{season} OFF-SEASON</h2>
            <p className="text-lg text-gray-400 mb-4">Phase 2: Driver Progression</p>
            
            <div className="w-full bg-gray-900/50 p-4 rounded-lg mb-6">
                <h3 className="text-2xl font-bold mb-4 text-white text-center">End of Season Skill Changes</h3>
                <p className="text-center text-gray-400 mb-4">Driver skills have evolved based on their age and performance throughout the {season} season.</p>
                <div className="overflow-y-auto space-y-3" style={{ maxHeight: '60vh' }}>
                    {log.length === 0 ? (
                         <p className="text-gray-500 text-center py-8">No significant driver progression occurred this season.</p>
                    ) : (
                        log.map(event => {
                            const { teamHexColor } = getTeamColors(event.teamName);
                            return (
                                <div 
                                    key={event.driverId} 
                                    className="bg-gray-800 p-4 rounded-lg border-l-4 cursor-pointer hover:bg-gray-700 transition-colors"
                                    style={{ borderColor: teamHexColor }}
                                    onClick={() => onSelectTeam(event.teamName)}
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-bold text-xl text-white">{event.driverName}</p>
                                            <p className="text-xs text-gray-400">{event.teamName} · Age: {event.age}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-gray-400">Avg. Race Rating</p>
                                            <p className="font-bold text-2xl text-white">{event.averageRating}</p>
                                        </div>
                                    </div>
                                    <div className="mt-2">
                                        {event.changes.map(c => <ChangeDisplay key={c.skill} change={c} />)}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            <button
                onClick={onProceed}
                className="w-full max-w-md py-4 px-8 bg-red-600 hover:bg-red-700 text-white font-bold text-xl rounded-lg transition duration-300 ease-in-out transform hover:scale-105"
            >
                Proceed to Financials
            </button>
        </div>
    );
};

export default DriverProgressionScreen;
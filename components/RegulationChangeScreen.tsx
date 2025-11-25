import React from 'react';
import { RegulationEvent } from '../types';

interface RegulationChangeScreenProps {
  season: number;
  log: RegulationEvent[];
  onProceed: () => void;
  onSelectTeam: (teamName: string) => void;
}

const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-400';
    if (score >= 65) return 'text-teal-400';
    if (score > 40) return 'text-yellow-400';
    return 'text-red-500';
}

const RegulationChangeScreen: React.FC<RegulationChangeScreenProps> = ({ season, log, onProceed, onSelectTeam }) => {
    return (
        <div className="w-full max-w-6xl bg-gray-800 p-6 rounded-lg shadow-2xl flex flex-col items-center animate-fade-in">
            <h2 className="text-4xl font-bold mb-1 text-white tracking-widest">{season} OFF-SEASON</h2>
            <p className="text-lg text-gray-400 mb-1">Phase 5: Regulation Changes</p>
            <p className="text-2xl font-bold text-red-500 mb-4 animate-pulse">!!! REGULATION SHAKE-UP !!!</p>
            
            <div className="w-full bg-gray-900/50 p-4 rounded-lg mb-6">
                <h3 className="text-2xl font-bold mb-4 text-white text-center">Initial {season + 1} Car Concepts</h3>
                <p className="text-center text-gray-400 mb-4">Teams have revealed their initial designs for the new regulations. This forms the baseline before pre-season development.</p>
                <div className="overflow-y-auto space-y-2" style={{ maxHeight: '60vh' }}>
                    {log.map(res => (
                        <div 
                            key={res.teamName} 
                            className="bg-gray-800 p-3 rounded-lg border-l-4 cursor-pointer hover:bg-gray-700 transition-colors"
                            style={{borderColor: res.teamHexColor}}
                            onClick={() => onSelectTeam(res.teamName)}
                        >
                            <div className="flex flex-wrap justify-between items-center gap-2">
                                <div className="flex-grow">
                                    <p className="font-bold text-xl text-white">{res.teamName}</p>
                                    <p className="text-sm italic text-gray-300">"{res.summary}"</p>
                                </div>
                                <div className="text-right flex items-center gap-6">
                                    <div>
                                        <p className="text-xs text-gray-400">Adaptation Score</p>
                                        <p className={`text-3xl font-bold ${getScoreColor(res.adaptationScore)}`}>{res.adaptationScore}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400">New Base Pace</p>
                                        <p className="text-4xl font-bold text-white">{res.newBaseCar.overallPace}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <button
                onClick={onProceed}
                className="w-full max-w-md py-4 px-8 bg-red-600 hover:bg-red-700 text-white font-bold text-xl rounded-lg transition duration-300 ease-in-out transform hover:scale-105"
            >
                Proceed to Car Development
            </button>
        </div>
    );
};

export default RegulationChangeScreen;
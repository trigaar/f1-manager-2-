import React from 'react';
import { TeamFinances } from '../types';

interface FinancialsScreenProps {
  season: number;
  teamFinances: TeamFinances[];
  onProceed: () => void;
  onSelectTeam: (teamName: string) => void;
}

const formatCurrency = (value: number) => {
    if (value === 0) return '$0.0M';
    return `$${(value / 1_000_000).toFixed(1)}M`;
}

const FinancialsScreen: React.FC<FinancialsScreenProps> = ({ season, teamFinances, onProceed, onSelectTeam }) => {

    const totalBudget = teamFinances.reduce((sum, team) => sum + team.finalBudget, 0);

    return (
        <div className="w-full max-w-6xl bg-gray-800 p-6 rounded-lg shadow-2xl flex flex-col items-center animate-fade-in">
            <h2 className="text-4xl font-bold mb-1 text-white tracking-widest">{season} OFF-SEASON</h2>
            <p className="text-lg text-gray-400 mb-4">Phase 3: Financials</p>
            
            <div className="w-full bg-gray-900 rounded-lg p-4 mb-6 text-center">
                <h3 className="text-lg font-semibold text-gray-300 uppercase">Total Combined Development Budget</h3>
                <p className="text-6xl font-bold text-green-400">{formatCurrency(totalBudget)}</p>
                <p className="text-gray-400">The grid's total available spend for the new season's car.</p>
            </div>
            
            <div className="w-full bg-gray-900/50 p-4 rounded-lg mb-6">
                <h3 className="text-2xl font-bold mb-4 text-white text-center">Team Financial Overview</h3>
                <div className="overflow-y-auto space-y-1" style={{ maxHeight: '50vh' }}>
                    {teamFinances.map(team => (
                        <div 
                            key={team.teamName} 
                            className="bg-gray-800 p-3 rounded-md cursor-pointer hover:bg-gray-700 transition-colors"
                            onClick={() => onSelectTeam(team.teamName)}
                        >
                            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                                <div className="flex items-center flex-1 min-w-[200px]">
                                    <div className={`w-1.5 h-10 mr-4 rounded-full`} style={{ backgroundColor: team.teamHexColor }}></div>
                                    <p className="font-bold text-lg text-white">{team.teamName}</p>
                                </div>
                                <div className="flex items-center gap-2 sm:gap-4 text-center sm:text-right">
                                    <div>
                                        <p className="text-xs text-gray-400">Prize Money</p>
                                        <p className="font-mono text-sm">{formatCurrency(team.prizeMoney.total)}</p>
                                    </div>
                                    <div className="text-xl font-thin text-gray-500">+</div>
                                    <div>
                                        <p className="text-xs text-gray-400">Sponsors</p>
                                        <p className="font-mono text-sm text-blue-300">{formatCurrency(team.sponsorshipIncome)}</p>
                                    </div>
                                     <div className="text-xl font-thin text-gray-500">-</div>
                                    <div>
                                        <p className="text-xs text-gray-400">Salaries</p>
                                        <p className="font-mono text-sm text-red-400">{formatCurrency(team.driverSalaries)}</p>
                                    </div>
                                    <div className="text-xl font-thin text-gray-500">=</div>
                                    <div>
                                        <p className="text-xs text-gray-400">Final Budget</p>
                                        <p className="font-mono font-bold text-teal-300 text-lg">{formatCurrency(team.finalBudget)}</p>
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
                Proceed to Resource Allocation
            </button>
        </div>
    );
};

export default FinancialsScreen;
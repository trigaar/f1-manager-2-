
import React, { useMemo } from 'react';
import { DriverStanding, ConstructorStanding, SeasonHistoryEntry } from '../types';
import { TeamDebrief, DriverDebrief } from '../services/postSeasonService';
import ChampionshipPodium from './ChampionshipPodium';

interface DebriefScreenProps {
  season: number;
  onProceed: () => void;
  teamDebriefs: TeamDebrief[];
  driverDebriefs: DriverDebrief[];
  mvi: number;
  onSelectTeam: (teamName: string) => void;
}

const getRatingColor = (value: number, isMVI: boolean = false) => {
    const thresholdHigh = isMVI ? 70 : 85;
    const thresholdLow = isMVI ? 30 : 65;
    if (value >= thresholdHigh) return 'text-green-400';
    if (value < thresholdLow) return 'text-red-400';
    return 'text-yellow-400';
}

const DebriefScreen: React.FC<DebriefScreenProps> = ({ season, onProceed, teamDebriefs, driverDebriefs, mvi, onSelectTeam }) => {

    const finalDriverStandings = useMemo(() => 
        [...driverDebriefs].sort((a,b) => a.position - b.position),
        [driverDebriefs]
    );

    const finalConstructorStandings = useMemo(() =>
        [...teamDebriefs].sort((a,b) => a.position - b.position),
        [teamDebriefs]
    );

    const sortedTeamDebriefs = useMemo(() => 
        [...teamDebriefs].sort((a, b) => b.tpr - a.tpr), 
        [teamDebriefs]
    );

    const sortedDriverDebriefs = useMemo(() => 
        [...driverDebriefs].sort((a, b) => a.position - b.position),
        [driverDebriefs]
    );

  return (
    <div className="w-full max-w-7xl bg-gray-800 p-6 rounded-lg shadow-2xl flex flex-col items-center animate-fade-in">
      <h2 className="text-4xl font-bold mb-1 text-white tracking-widest">{season} SEASON REVIEW</h2>
      <p className="text-lg text-gray-400 mb-6">Champions & Market Analysis</p>
      
      <ChampionshipPodium 
        driverStandings={finalDriverStandings}
        constructorStandings={finalConstructorStandings}
      />

      <div className="w-full bg-gray-900 rounded-lg p-4 my-6 text-center">
        <h3 className="text-lg font-semibold text-gray-300 uppercase">Market Volatility Index (MVI)</h3>
        <p className={`text-6xl font-bold ${getRatingColor(mvi, true)}`}>{mvi}</p>
        <p className="text-gray-400">Determines the chaos of the upcoming "silly season".</p>
      </div>

      <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Team Prestige */}
        <div className="bg-gray-900/50 p-4 rounded-lg">
           <h3 className="text-2xl font-bold mb-4 text-white">Team Prestige Rating (TPR)</h3>
           <div className="overflow-y-auto space-y-2" style={{ maxHeight: '50vh'}}>
                {sortedTeamDebriefs.map(team => (
                    <div key={team.teamName} className="bg-gray-800 p-3 rounded-md cursor-pointer hover:bg-gray-700 transition-colors" onClick={() => onSelectTeam(team.teamName)}>
                        <div className="flex justify-between items-center">
                            <div className="flex items-center">
                                <div className={`w-1 h-8 mr-3`} style={{ backgroundColor: team.teamHexColor }}></div>
                                <div>
                                    <p className="font-bold text-white">{team.teamName}</p>
                                    <p className="text-xs text-gray-400">Finished P{team.position} ({team.points} pts)</p>
                                </div>
                            </div>
                            <p className={`text-3xl font-bold ${getRatingColor(team.tpr)}`}>{team.tpr}</p>
                        </div>
                    </div>
                ))}
           </div>
        </div>

        {/* Driver Stock Value */}
        <div className="bg-gray-900/50 p-4 rounded-lg">
           <h3 className="text-2xl font-bold mb-4 text-white">Driver Stock Value (DSV)</h3>
            <div className="overflow-y-auto space-y-2" style={{ maxHeight: '50vh'}}>
                {sortedDriverDebriefs.map(driver => (
                    <div key={driver.driverId} className="bg-gray-800 p-3 rounded-md cursor-pointer hover:bg-gray-700 transition-colors" onClick={() => onSelectTeam(driver.teamName)}>
                        <div className="flex justify-between items-center">
                            <div className="flex items-center">
                                <div className={`w-1 h-8 mr-3`} style={{ backgroundColor: driver.teamHexColor }}></div>
                                <div>
                                    <p className="font-bold text-white">{driver.name}</p>
                                    <p className="text-xs text-gray-400">Finished P{driver.position} ({driver.points} pts)</p>
                                </div>
                            </div>
                            <p className={`text-3xl font-bold ${getRatingColor(driver.dsv)}`}>{driver.dsv}</p>
                        </div>
                    </div>
                ))}
           </div>
        </div>
      </div>


      <button
        onClick={onProceed}
        className="w-full max-w-md py-4 px-8 bg-red-600 hover:bg-red-700 text-white font-bold text-xl rounded-lg transition duration-300 ease-in-out transform hover:scale-105"
      >
        Proceed to Driver Progression
      </button>
    </div>
  );
};

export default DebriefScreen;

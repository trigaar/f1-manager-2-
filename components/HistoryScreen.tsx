
import React, { useState, useMemo } from 'react';
import { SeasonHistoryEntry, InitialDriver, RookieDriver, AiSeasonReview } from '../types';

type PaddockTab = 'Hall of Fame' | 'Free Agents' | 'Rookie Pool';
type DetailTab = 'Driver Standings' | 'Constructor Standings' | 'Season Review';

const SeasonReviewDisplay: React.FC<{ review: AiSeasonReview }> = ({ review }) => (
    <div className="bg-gray-700/50 p-4 rounded-lg space-y-4">
        <h4 className="text-2xl font-bold text-red-500 text-center">{review.headline}</h4>
        <p className="text-sm text-gray-300 leading-relaxed italic text-center">{review.summary}</p>
        <div className="space-y-3 pt-2">
            {review.principalQuotes.map((q, i) => (
                <div key={i} className="bg-gray-800 p-3 rounded-md border-l-2 border-gray-600">
                    <p className="font-bold text-white">{q.principalName} <span className="text-xs font-normal text-gray-400">({q.teamName})</span></p>
                    <p className="text-sm text-gray-200 mt-1">"{q.quote}"</p>
                </div>
            ))}
        </div>
    </div>
);

interface HistoryScreenProps {
  history: SeasonHistoryEntry[];
  roster: InitialDriver[];
  rookiePool: RookieDriver[];
  onClose: () => void;
}

const HistoryScreen: React.FC<HistoryScreenProps> = ({ history, roster, rookiePool, onClose }) => {
  const [selectedSeason, setSelectedSeason] = useState<SeasonHistoryEntry | null>(history.length > 0 ? history[history.length - 1] : null);
  const [activePaddockTab, setActivePaddockTab] = useState<PaddockTab>('Hall of Fame');
  const [activeDetailTab, setActiveDetailTab] = useState<DetailTab>('Driver Standings');
  
  const retiredDrivers = useMemo(() => {
      return roster.filter(d => d.status === 'Retired').sort((a,b) => b.championships - a.championships || b.careerPodiums - a.careerPodiums);
  }, [roster]);

  const freeAgents = useMemo(() => {
      return roster.filter(d => d.status === 'Free Agent').sort((a,b) => b.driverSkills.overall - a.driverSkills.overall);
  }, [roster]);

  const renderPaddockContent = () => {
    switch(activePaddockTab) {
        case 'Hall of Fame':
            return (
                <div className="space-y-2">
                    {retiredDrivers.length > 0 ? retiredDrivers.map(driver => (
                        <div key={driver.id} className="bg-gray-700 p-3 rounded-md flex justify-between items-center">
                            <div>
                                <p className="font-bold text-lg text-white">{driver.name}</p>
                                <p className="text-xs text-gray-400">Last Team: {driver.car.teamName} · Retired at Age {driver.age}</p>
                            </div>
                            <div className="flex gap-4 text-center">
                                <div>
                                    <p className="text-xs text-gray-400">Podiums</p>
                                    <p className="font-bold text-xl">{driver.careerPodiums}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400">Titles</p>
                                    <p className="font-bold text-xl text-yellow-400">{driver.championships}</p>
                                </div>
                            </div>
                        </div>
                    )) : (
                        <p className="text-gray-500 text-center py-8">No drivers have retired yet.</p>
                    )}
                </div>
            );
        case 'Free Agents':
             return (
                <div className="space-y-2">
                    {freeAgents.length > 0 ? freeAgents.map(driver => (
                        <div key={driver.id} className="bg-gray-700/80 p-3 rounded-md border-b-2 border-gray-800">
                            <div className="flex justify-between items-center">
                                <div>
                                  <p className="font-bold text-lg text-white">{driver.name} <span className="text-base font-normal text-gray-300">({driver.age})</span></p>
                                  <p className="text-xs text-gray-400 mt-1">Salary Estimate: ${(driver.salary / 1_000_000).toFixed(1)}M</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <p className="font-mono text-lg font-bold text-white">OVR: {driver.driverSkills.overall}</p>
                                </div>
                            </div>
                        </div>
                    )) : (
                        <p className="text-gray-500 text-center py-8">No free agents are currently available.</p>
                    )}
                </div>
            );
        case 'Rookie Pool':
             return (
                <div className="space-y-2">
                    {rookiePool.length > 0 ? rookiePool.map(rookie => (
                        <div key={rookie.name} className="bg-gray-700 p-3 rounded-md">
                            <div className="flex justify-between items-center">
                                <p className="font-bold text-lg text-white">{rookie.name}</p>
                                <div className="flex items-center gap-4">
                                    <p className="font-mono text-lg font-bold">POT: {rookie.potential}</p>
                                </div>
                            </div>
                            <div className="text-xs text-gray-400 flex gap-4">
                                <span>Pace: {rookie.rawPace}</span>
                                <span>Cons: {rookie.consistency}</span>
                                <span>Affiliation: {rookie.affiliation}</span>
                            </div>
                        </div>
                    )) : (
                         <p className="text-gray-500 text-center py-8">The rookie pool is empty.</p>
                    )}
                </div>
            );
    }
  }

  const renderSelectedSeasonDetails = () => {
    if (!selectedSeason) {
        return <p className="text-gray-500 text-center py-16">Select a season to view its history.</p>;
    }
    
    switch (activeDetailTab) {
        case 'Driver Standings':
            return (
                <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-gray-900/80">
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase">Pos</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase">Driver</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-300 uppercase">Points</th>
                        </tr>
                    </thead>
                    <tbody className="bg-gray-800 divide-y divide-gray-700">
                        {selectedSeason.driverStandings.map((driver) => (
                            <tr key={driver.driverId}>
                                <td className="px-4 py-2 font-semibold">{driver.position}</td>
                                <td className="px-4 py-2">
                                    <div className="flex items-center">
                                        <div className={`w-1 h-5 mr-3`} style={{ backgroundColor: driver.teamHexColor }}></div>
                                        <div>
                                            <div className="text-sm font-medium text-white">{driver.name}</div>
                                            <div className="text-xs text-gray-400">{driver.teamName}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-2 text-right font-bold font-mono">{driver.points}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            );
        case 'Constructor Standings':
            return (
                 <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-gray-900/80">
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase">Pos</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase">Team</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-300 uppercase">Points</th>
                        </tr>
                    </thead>
                    <tbody className="bg-gray-800 divide-y divide-gray-700">
                        {selectedSeason.constructorStandings.map((team) => (
                            <tr key={team.teamName}>
                                <td className="px-4 py-2 font-semibold">{team.position}</td>
                                <td className="px-4 py-2">
                                    <div className="flex items-center">
                                        <div className={`w-1 h-5 mr-3`} style={{ backgroundColor: team.teamHexColor }}></div>
                                        <div className="text-sm font-medium text-white">{team.teamName}</div>
                                    </div>
                                </td>
                                <td className="px-4 py-2 text-right font-bold font-mono">{team.points}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            );
        case 'Season Review':
            return selectedSeason.aiSeasonReview 
                ? <SeasonReviewDisplay review={selectedSeason.aiSeasonReview} />
                : <p className="text-gray-500 text-center py-16">No AI Season Review available for {selectedSeason.year}.</p>;
    }
  }


  return (
    <div className="w-full max-w-7xl bg-gray-900/50 backdrop-blur-sm p-6 rounded-lg shadow-2xl flex flex-col items-center animate-fade-in">
        <div className="w-full flex justify-between items-center mb-4">
            <h2 className="text-3xl font-bold text-white tracking-widest">Archives & Paddock</h2>
            <button
                onClick={onClose}
                className="py-2 px-6 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition duration-300"
            >
                Back to Sim
            </button>
        </div>
        
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: Archives */}
            <div className="bg-gray-800 p-2 rounded-lg flex flex-col">
                <h3 className="text-xl font-bold mb-2 text-white px-2">Archives</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                    <div className="md:col-span-1 space-y-1">
                        {[...history].reverse().map(season => (
                            <button
                                key={season.year}
                                onClick={() => setSelectedSeason(season)}
                                className={`w-full text-left p-2 rounded-md font-semibold transition-colors ${selectedSeason?.year === season.year ? 'bg-red-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}
                            >
                                {season.year} Season
                            </button>
                        ))}
                    </div>
                    <div className="md:col-span-3 bg-gray-900/50 rounded-lg">
                        <div className="w-full flex border-b border-gray-700">
                            {(['Driver Standings', 'Constructor Standings', 'Season Review'] as DetailTab[]).map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveDetailTab(tab)}
                                    className={`py-1 px-3 text-sm font-semibold transition-colors duration-200 rounded-t-md ${
                                        activeDetailTab === tab 
                                        ? 'text-white bg-gray-700' 
                                        : 'text-gray-400 hover:bg-gray-700/50'
                                    }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                        <div className="overflow-y-auto p-2" style={{ maxHeight: '60vh' }}>
                            {renderSelectedSeasonDetails()}
                        </div>
                    </div>
                </div>
            </div>

             {/* Right Column: Paddock */}
             <div className="bg-gray-800 p-2 rounded-lg flex flex-col">
                 <h3 className="text-xl font-bold mb-2 text-white px-2">Paddock</h3>
                 <div className="bg-gray-900/50 rounded-lg flex-grow flex flex-col">
                    <div className="w-full flex border-b border-gray-700">
                        {(['Hall of Fame', 'Free Agents', 'Rookie Pool'] as PaddockTab[]).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActivePaddockTab(tab)}
                                className={`py-1 px-3 text-sm font-semibold transition-colors duration-200 rounded-t-md ${
                                    activePaddockTab === tab 
                                    ? 'text-white bg-gray-700' 
                                    : 'text-gray-400 hover:bg-gray-700/50'
                                }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                    <div className="overflow-y-auto p-2 flex-grow" style={{ maxHeight: '60vh' }}>
                        {renderPaddockContent()}
                    </div>
                 </div>
            </div>
        </div>
    </div>
  );
};

export default HistoryScreen;
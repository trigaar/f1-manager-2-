
import React, { useMemo } from 'react';
import { Track, DriverStanding, ConstructorStanding, UpcomingRaceQuote, RaceHistory, InitialDriver } from '../types';
import DriverStandings from './DriverStandings';
import ConstructorStandings from './ConstructorStandings';

interface SetupScreenProps {
  season: number;
  seasonTracks: Track[];
  currentRaceIndex: number;
  onStartPracticeWeekend: (track: Track) => void;
  standings: DriverStanding[];
  constructorStandings: ConstructorStanding[];
  onResetStandings: () => void;
  onSelectTeam: (teamName: string) => void;
  onShowHistory: () => void;
  onShowGarage: () => void;
  onShowHq: () => void;
  onSkipToOffSeason: () => void;
  upcomingRaceQuote: UpcomingRaceQuote | null;
  raceHistory: RaceHistory;
  roster: InitialDriver[];
  onSetSeasonLength: (length: 'full' | 'short') => void;
  seasonLength: 'full' | 'short';
  playerTeam: string | null;
  onSetPlayerTeam: (teamName: string) => void;
  onShowHowToPlay: () => void;
}

const InfoPill: React.FC<{ label: string; value: string | number; color?: string }> = ({ label, value, color = 'bg-gray-600' }) => (
    <div className="flex justify-between items-center text-sm">
      <span className="text-gray-400">{label}</span>
      <span className={`font-bold px-2 py-0.5 rounded-full text-white ${color}`}>{value}</span>
    </div>
);

const DriverPreview: React.FC<{ quote: UpcomingRaceQuote | null }> = ({ quote }) => {
    if (!quote) return null;
    return (
        <div className="w-full bg-gray-700 p-4 rounded-lg mt-6 animate-fade-in">
            <h4 className="text-sm font-bold text-gray-400 uppercase">Paddock Buzz</h4>
            <p className="text-lg font-bold text-white mt-1">{quote.driverName}</p>
            <blockquote className="mt-1">
                <p className="text-gray-200 italic">"{quote.quote}"</p>
            </blockquote>
        </div>
    );
};

const SetupScreen: React.FC<SetupScreenProps> = ({ season, onStartPracticeWeekend, standings, constructorStandings, onResetStandings, seasonTracks, currentRaceIndex, onSelectTeam, onShowHistory, onShowGarage, onShowHq, onSkipToOffSeason, upcomingRaceQuote, raceHistory, roster, onSetSeasonLength, seasonLength, playerTeam, onSetPlayerTeam, onShowHowToPlay }) => {
  const currentTrack = seasonTracks[currentRaceIndex];
  
  const driverMap = useMemo(() => new Map(roster.map(d => [d.id, d.name])), [roster]);

  const combinedWinners = useMemo(() => {
    const dynamicWinners = (raceHistory[currentTrack.name] || [])
        .slice(0, 3)
        .map(entry => ({
            year: entry.year,
            name: driverMap.get(entry.winnerId) || 'Unknown Driver'
        }));
    
    const staticWinners = currentTrack.pastWinners
        .map((name, index) => ({ year: 2024 - index, name }))
        .filter(sw => !dynamicWinners.some(dw => dw.year === sw.year));

    return [...dynamicWinners, ...staticWinners].slice(0, 3);
  }, [raceHistory, currentTrack.name, currentTrack.pastWinners, driverMap]);

  const handleLengthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const length = e.target.value as 'full' | 'short';
      onSetSeasonLength(length);
  }

  return (
    <div className="w-full max-w-7xl">
        <div className="w-full text-center mb-4">
            <button
                onClick={() => onStartPracticeWeekend(currentTrack)}
                className="py-4 px-12 bg-red-600 hover:bg-red-700 text-white font-bold text-xl rounded-lg transition duration-300 ease-in-out transform hover:scale-105 shadow-lg"
            >
                Start Race Weekend
            </button>
        </div>
        
        <div className="w-full grid grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
             <button
                onClick={onShowHq}
                className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition duration-300"
            >
                Headquarters
            </button>
             <button
                onClick={onShowGarage}
                className="w-full py-3 px-4 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition duration-300"
            >
                Garage
            </button>
             <button
                onClick={onShowHistory}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition duration-300"
            >
                View Season History
            </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
            <div className="w-full lg:w-1/3 flex flex-col">
                <div className="bg-gray-800 p-8 rounded-lg shadow-2xl">
                    <h2 className="text-3xl font-bold mb-6 text-white text-center">Race Setup - {season}</h2>
                    
                    {currentRaceIndex === 0 && (
                        <div className="w-full bg-gray-700 p-4 rounded-md mb-6">
                            <h3 className="text-lg font-semibold mb-2">Season Length</h3>
                            <div className="flex justify-around">
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input type="radio" name="seasonLength" value="full" checked={seasonLength === 'full'} onChange={handleLengthChange} className="form-radio h-4 w-4 text-red-600 bg-gray-800 border-gray-600 focus:ring-red-500" />
                                    <span>Full Season (24 Races)</span>
                                </label>
                                 <label className="flex items-center space-x-2 cursor-pointer">
                                    <input type="radio" name="seasonLength" value="short" checked={seasonLength === 'short'} onChange={handleLengthChange} className="form-radio h-4 w-4 text-red-600 bg-gray-800 border-gray-600 focus:ring-red-500" />
                                    <span>Short Season (14 Races)</span>
                                </label>
                            </div>
                        </div>
                    )}

                    <div className="w-full bg-gray-700 p-4 rounded-md mb-6">
                        <h3 className="text-xl font-semibold mb-2">{currentTrack.name}</h3>
                        <p className="text-sm text-gray-400 mb-4">{currentTrack.description}</p>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                            <InfoPill label="Laps" value={currentTrack.laps} />
                            <InfoPill label="Pit Loss" value={`${currentTrack.pitLaneTimeLoss}s`} />
                            <InfoPill label="Downforce" value={`${currentTrack.downforceLevel}/5`} color="bg-blue-500" />
                            <InfoPill label="Power" value={`${currentTrack.powerSensitivity}/5`} color="bg-purple-500" />
                            <InfoPill label="Tyre Stress" value={`${currentTrack.tyreStress}/5`} color="bg-yellow-500" />
                            <InfoPill label="Brake Wear" value={`${currentTrack.brakeWear}/5`} color="bg-orange-500" />
                            <InfoPill label="Overtaking" value={`${currentTrack.overtakingDifficulty}/5`} color="bg-green-500" />
                            <InfoPill label="SC Risk" value={`${Math.round(currentTrack.safetyCarProbability * 100)}%`} color="bg-red-500" />
                        </div>
                        <div className="mt-4 pt-2 border-t border-gray-600">
                            <h4 className="text-sm font-semibold text-gray-300 mb-1">Recent Winners</h4>
                            <div className="text-xs space-y-1">
                                {combinedWinners.map((winner, i) => (
                                    <p key={i} className="text-gray-400"><span className="font-bold text-gray-200">{winner.year}:</span> {winner.name}</p>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
                <DriverPreview quote={upcomingRaceQuote} />
            </div>
            <div className="w-full lg:w-2/3 flex flex-col gap-6">
                <div className="flex flex-col md:flex-row gap-6 flex-grow">
                    <div className="md:w-1/2 flex">
                        <DriverStandings standings={standings} onSelectTeam={onSelectTeam} />
                    </div>
                    <div className="md:w-1/2 flex">
                        <ConstructorStandings standings={constructorStandings} onSelectTeam={onSelectTeam} />
                    </div>
                </div>
            </div>
        </div>
        <div className="w-full mt-4 flex flex-col sm:flex-row justify-center items-center gap-4">
            <button
                onClick={onSkipToOffSeason}
                className="w-full max-w-sm py-3 px-4 bg-yellow-700 hover:bg-yellow-800 text-white font-semibold rounded-lg transition duration-300"
            >
                Skip to Off-Season
            </button>
            <button
                onClick={onResetStandings}
                className="w-full max-w-sm py-3 px-4 bg-gray-700 hover:bg-gray-800 text-gray-300 font-semibold rounded-lg transition duration-300"
            >
                Reset All Standings & History
            </button>
        </div>
    </div>
  );
};

export default SetupScreen;

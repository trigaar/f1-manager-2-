
import React, { useMemo } from 'react';
import { RaceState, RaceFlag, RaceHistory, InitialDriver } from '../types';
import { SunIcon, CloudIcon, LightRainIcon, HeavyRainIcon, ExtremeRainIcon } from './IconComponents';

interface RaceControlPanelProps {
  raceState: RaceState;
  simSpeed: number;
  onSpeedChange: (speed: number) => void;
  raceHistory: RaceHistory;
  roster: InitialDriver[];
  season: number;
}

const WeatherIcon: React.FC<{ weather: RaceState['weather'] }> = ({ weather }) => {
    switch(weather) {
        case 'Sunny': return <SunIcon className="w-10 h-10" />;
        case 'Cloudy': return <CloudIcon className="w-10 h-10" />;
        case 'Light Rain': return <LightRainIcon className="w-10 h-10" />;
        case 'Heavy Rain': return <HeavyRainIcon className="w-10 h-10" />;
        case 'Extreme Rain': return <ExtremeRainIcon className="w-10 h-10" />;
        default: return null;
    }
}

const InfoItem: React.FC<{ label: string; value: string | number; }> = ({ label, value }) => (
    <div>
      <p className="text-xs text-gray-400 uppercase truncate">{label}</p>
      <p className="font-bold text-white text-sm truncate">{value}</p>
    </div>
);


const RaceControlPanel: React.FC<RaceControlPanelProps> = ({ raceState, simSpeed, onSpeedChange, raceHistory, roster, season }) => {

  const getFlagInfo = () => {
    switch(raceState.flag) {
        case RaceFlag.Green:
            return { text: 'GREEN FLAG', color: 'bg-green-500 text-white' };
        case RaceFlag.Yellow:
            return { text: 'YELLOW FLAG', color: 'bg-yellow-400 text-black' };
        case RaceFlag.SafetyCar:
            return { text: 'SAFETY CAR', color: 'bg-yellow-500 text-black animate-pulse' };
        case RaceFlag.VirtualSafetyCar:
            return { text: 'VIRTUAL SAFETY CAR', color: 'bg-yellow-500 text-black' };
        case RaceFlag.Red:
            return { text: 'RED FLAG', color: 'bg-red-600 text-white animate-pulse' };
        default:
            return { text: '---', color: 'bg-gray-600' };
    }
  }

  const driverMap = useMemo(() => new Map(roster.map(d => [d.id, d.name])), [roster]);

  const combinedWinners = useMemo(() => {
    const dynamicWinners = (raceHistory[raceState.track.name] || [])
        .slice(0, 3)
        .map(entry => ({
            year: entry.year,
            name: driverMap.get(entry.winnerId) || 'Unknown Driver'
        }));
    
    const staticWinners = raceState.track.pastWinners
        .map((name, index) => ({ year: 2024 - index, name }))
        .filter(sw => !dynamicWinners.some(dw => dw.year === sw.year));

    return [...dynamicWinners, ...staticWinners].slice(0, 3);
  }, [raceHistory, raceState.track.name, raceState.track.pastWinners, driverMap]);


  const flagInfo = getFlagInfo();

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg">
      <div className="p-4 bg-gray-700 rounded-t-lg">
        <h2 className="text-xl font-bold text-white">Race Hub</h2>
      </div>
      <div className="p-4 grid grid-cols-2 gap-4 border-b border-gray-700">
        <div className="bg-gray-900 p-3 rounded-md text-center flex flex-col justify-center">
          <p className="text-xs text-gray-400 uppercase">Lap</p>
          <p className="text-2xl font-bold font-mono">{raceState.lap > raceState.totalLaps ? raceState.totalLaps : raceState.lap} / {raceState.totalLaps}</p>
        </div>
        <div className="bg-gray-900 p-3 rounded-md text-center">
          <p className="text-xs text-gray-400 uppercase mb-1">Weather</p>
          <div className="flex items-center justify-center gap-2">
            <WeatherIcon weather={raceState.weather} />
            <p className="text-lg font-bold">{raceState.weather}</p>
          </div>
        </div>
      </div>
      
      <div className="p-4 border-b border-gray-700">
        <h3 className="text-sm font-bold text-gray-400 uppercase mb-3 text-center">Track Conditions</h3>
        <div className="grid grid-cols-2 gap-2 text-center">
          <InfoItem label="Air Temp" value={`${raceState.airTemp}°C`} />
          <InfoItem label="Track Temp" value={`${raceState.trackTemp}°C`} />
        </div>
      </div>

      <div className="p-4 border-b border-gray-700">
        <h3 className="text-sm font-bold text-gray-400 uppercase mb-2 text-center">Track Records</h3>
        <div className="text-center space-y-1">
            {combinedWinners.map((winner, i) => (
                <p key={i} className="text-xs text-gray-300"><span className="font-bold">{winner.year}</span>: {winner.name}</p>
            ))}
        </div>
      </div>

       <div className="p-4">
        <p className={`text-xl font-bold text-center py-2 rounded-md transition-colors duration-500 ${flagInfo.color}`}>
            {flagInfo.text}
        </p>
       </div>
       
       <div className="p-4 border-t border-gray-700">
            <p className="text-xs text-gray-400 uppercase text-center mb-2">Simulation Speed</p>
            <div className="grid grid-cols-4 gap-2">
                {[1, 2, 4, 8].map(speed => (
                    <button
                        key={speed}
                        onClick={() => onSpeedChange(speed)}
                        className={`py-1 rounded font-bold transition-colors ${
                            simSpeed === speed 
                                ? 'bg-red-600 text-white' 
                                : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                        }`}
                    >
                        {speed}x
                    </button>
                ))}
            </div>
        </div>
    </div>
  );
};

export default RaceControlPanel;
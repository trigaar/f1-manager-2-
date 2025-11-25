import React from 'react';
import { Driver, TyreCompound, DriverStatus, Tyre } from '../types';
import { TyreSoftIcon, TyreMediumIcon, TyreHardIcon, TyreIntermediateIcon, TyreWetIcon, UpArrowIcon, DownArrowIcon } from './IconComponents';

interface LeaderboardProps {
  drivers: Driver[];
  onSelectTeam: (teamName: string) => void;
}

const TyreIcon: React.FC<{ compound: TyreCompound }> = ({ compound }) => {
  switch (compound) {
    case TyreCompound.Soft:
      return <TyreSoftIcon />;
    case TyreCompound.Medium:
      return <TyreMediumIcon />;
    case TyreCompound.Hard:
      return <TyreHardIcon />;
    case TyreCompound.Intermediate:
      return <TyreIntermediateIcon />;
    case TyreCompound.Wet:
      return <TyreWetIcon />;
    default:
      return <div className="w-5 h-5 rounded-full bg-gray-500" title={compound}></div>;
  }
};

const TyreStatusIndicator: React.FC<{ tyre: Tyre }> = ({ tyre }) => {
    let color = 'bg-green-500'; // Optimal
    let text = null;
    let title = `Optimal (${tyre.temperature.toFixed(0)}°C)`;

    switch (tyre.condition) {
        case 'Cold':
            color = 'bg-blue-400';
            title = `Cold (${tyre.temperature.toFixed(0)}°C)`;
            break;
        case 'Hot':
            color = 'bg-orange-500';
            title = `Hot (${tyre.temperature.toFixed(0)}°C)`;
            break;
        case 'Graining':
            color = 'bg-yellow-400';
            text = 'G';
            title = `Graining (${tyre.temperature.toFixed(0)}°C)`;
            break;
        case 'Blistering':
            color = 'bg-red-600';
            text = 'B';
            title = `Blistering (${tyre.temperature.toFixed(0)}°C)`;
            break;
    }

    return (
        <div 
            className={`w-3 h-3 rounded-full flex items-center justify-center text-black text-[8px] font-black ${color}`}
            title={title}
        >
            {text}
        </div>
    );
};


const PositionChange: React.FC<{ change: number }> = ({ change }) => {
    if (change === 0) return null;
    
    const isGain = change > 0;
    const color = isGain ? 'text-green-500' : 'text-red-500';
    const Icon = isGain ? UpArrowIcon : DownArrowIcon;

    return (
        <span className={`ml-2 flex items-center font-bold text-xs ${color}`}>
            <Icon className="w-3 h-3" />
            {Math.abs(change)}
        </span>
    );
};


const Leaderboard: React.FC<LeaderboardProps> = ({ drivers, onSelectTeam }) => {
  const getStatusColor = (status: DriverStatus) => {
    switch(status) {
        case 'In Pits': return 'bg-purple-500';
        case 'Crashed': return 'bg-red-700';
        case 'DNF': return 'bg-red-900';
        case 'Mechanical Issue': return 'bg-orange-500';
        case 'Damaged': return 'bg-yellow-500';
        default: return 'bg-transparent';
    }
  }

  const getERSColor = (charge: number) => {
      if (charge > 70) return 'bg-green-500';
      if (charge > 30) return 'bg-yellow-500';
      return 'bg-red-500';
  }

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      <div className="p-4 bg-gray-700">
        <h2 className="text-xl font-bold text-white">Leaderboard</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-800">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Pos</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Driver</th>
              <th scope="col" className="px-2 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Lap Time</th>
              <th scope="col" className="px-2 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Gap</th>
              <th scope="col" className="px-2 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">Tyres</th>
              <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-gray-800 divide-y divide-gray-700">
            {drivers.map((driver, index) => {
              const positionChange = driver.startingPosition - driver.position;
              return (
              <tr 
                key={driver.id} 
                onClick={() => onSelectTeam(driver.car.teamName)}
                className={`cursor-pointer transition-colors ${index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-700/50'} hover:bg-gray-700`}>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-white">
                    <div className="flex items-center">
                        {driver.position}
                        <PositionChange change={positionChange} />
                    </div>
                </td>
                <td className="px-6 py-3 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className={`w-1 h-6 mr-3`} style={{ backgroundColor: driver.teamHexColor }}></div>
                    <div>
                        <div className="text-sm font-medium text-white flex items-center">
                            {driver.name}
                            {driver.penalties && driver.penalties.some(p => !p.served) && 
                                <span className="ml-2 text-xs bg-yellow-500 text-black font-bold px-1.5 rounded" title="Unserved Penalty">PEN</span>
                            }
                        </div>
                        <div className="text-xs text-gray-400 flex items-center gap-2">
                            {driver.car.teamName}
                            <div className="w-16 h-2 bg-gray-600 rounded-full overflow-hidden" title={`ERS: ${driver.ersCharge.toFixed(0)}%`}>
                                <div className={`h-full ${getERSColor(driver.ersCharge)}`} style={{width: `${driver.ersCharge}%`}}></div>
                            </div>
                        </div>
                    </div>
                  </div>
                </td>
                <td className="px-2 py-3 whitespace-nowrap text-sm text-gray-300 font-mono">{driver.lapTime > 0 ? driver.lapTime.toFixed(3) : '-'}</td>
                <td className="px-2 py-3 whitespace-nowrap text-sm text-gray-400 font-mono">{driver.gapToLeader === 0 && driver.raceStatus !== 'Crashed' && driver.raceStatus !== 'DNF' ? 'Leader' : (driver.gapToLeader > 0 ? `+${driver.gapToLeader.toFixed(3)}` : '-')}</td>
                <td className="px-2 py-3 whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1.5">
                        <TyreStatusIndicator tyre={driver.currentTyres} />
                        <TyreIcon compound={driver.currentTyres.compound} />
                        <span className="text-xs text-gray-400 w-10 text-left">({driver.currentTyres.age} L)</span>
                    </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-center">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(driver.raceStatus)} text-white`}>
                        {driver.raceStatus}
                    </span>
                </td>
              </tr>
            )})}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Leaderboard;

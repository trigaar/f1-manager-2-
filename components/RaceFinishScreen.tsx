import React from 'react';
import { Driver } from '../types';
import { POINTS_SYSTEM } from '../constants';

interface RaceFinishScreenProps {
  drivers: Driver[];
  onProceed: () => void;
  onSkip: () => void;
}

const Podium: React.FC<{ drivers: Driver[] }> = ({ drivers }) => {
  const podiumOrder = [drivers[1], drivers[0], drivers[2]].filter(Boolean); // P2, P1, P3

  return (
    <div className="flex justify-center items-end gap-2 mb-8 px-4">
      {podiumOrder.map((driver, index) => {
        if (!driver) return null;
        const position = driver.position;
        const height = position === 1 ? 'h-48' : position === 2 ? 'h-36' : 'h-28';
        const podiumColor = position === 1 ? 'bg-yellow-400' : position === 2 ? 'bg-gray-300' : 'bg-yellow-600';
        
        return (
            <div key={driver.id} className={`flex flex-col justify-between items-center w-1/3 p-3 rounded-t-lg shadow-lg text-black ${height}`} style={{ backgroundColor: driver.teamHexColor }}>
                <div className="text-center">
                    <p className="text-3xl font-black text-white" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.7)' }}>{driver.position}</p>
                    <p className="font-bold text-white truncate">{driver.name}</p>
                    <p className="text-xs text-gray-200">{driver.car.teamName}</p>
                </div>
                <div className={`w-12 h-12 flex items-center justify-center rounded-full ${podiumColor} border-2 border-white`}>
                    <span className="text-2xl font-bold">{driver.position}</span>
                </div>
            </div>
        )
      })}
    </div>
  );
};

const getRatingColor = (rating: number) => {
    if (rating > 85) return 'text-green-400';
    if (rating > 65) return 'text-teal-400';
    if (rating > 50) return 'text-yellow-400';
    return 'text-red-400';
}

const RaceFinishScreen: React.FC<RaceFinishScreenProps> = ({ drivers, onProceed, onSkip }) => {
    const leader = drivers[0];

    return (
        <div className="w-full max-w-4xl bg-gray-800 p-8 rounded-lg shadow-2xl flex flex-col items-center animate-fade-in">
            <h2 className="text-4xl font-bold mb-2 text-white tracking-widest">RACE RESULTS</h2>
            <p className="text-lg text-gray-400 mb-8">Final Classification</p>

            <Podium drivers={drivers} />

            <div className="w-full bg-gray-900 rounded-lg overflow-hidden shadow-lg mb-8">
                <div className="overflow-y-auto" style={{ maxHeight: '40vh'}}>
                    <table className="min-w-full divide-y divide-gray-700">
                        <thead className="bg-gray-800 sticky top-0">
                            <tr>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Pos</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Driver</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Time/Gap</th>
                                <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">Points</th>
                                <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">Rating</th>
                                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-gray-800 divide-y divide-gray-700">
                            {drivers.map((driver) => {
                                const isFinished = driver.raceStatus !== 'Crashed' && driver.raceStatus !== 'DNF';
                                const points = isFinished && driver.position <= 10 ? POINTS_SYSTEM[driver.position - 1] : 0;
                                return (
                                <tr key={driver.id}>
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-white">{driver.position}</td>
                                <td className="px-6 py-3 whitespace-nowrap">
                                    <div className="flex items-center">
                                    <div className={`w-1 h-6 mr-3`} style={{ backgroundColor: driver.teamHexColor }}></div>
                                    <div>
                                        <div className="text-sm font-medium text-white">{driver.name}</div>
                                        <div className="text-xs text-gray-400">{driver.car.teamName}</div>
                                    </div>
                                    </div>
                                </td>
                                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-300 font-mono">
                                    {driver.position === 1 ? leader.totalRaceTime.toFixed(3) : 
                                     isFinished ? `+${driver.gapToLeader.toFixed(3)}` : '-'}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-center font-bold text-teal-300">
                                    {points > 0 ? `+${points}` : '-'}
                                </td>
                                <td className={`px-4 py-3 whitespace-nowrap text-center font-bold ${getRatingColor(driver.raceRating || 0)}`}>
                                    {driver.raceRating?.toFixed(0) || '-'}
                                </td>
                                <td className="px-6 py-3 whitespace-nowrap text-center">
                                     <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${isFinished ? 'bg-green-600' : 'bg-red-700'} text-white`}>
                                        {isFinished ? 'Finished' : driver.raceStatus}
                                     </span>
                                </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="w-full max-w-xl flex flex-col sm:flex-row gap-4">
                <button
                    onClick={onSkip}
                    className="w-full py-3 px-6 bg-gray-600 hover:bg-gray-700 text-white font-bold text-lg rounded-lg transition duration-300"
                >
                    Skip & Proceed
                </button>
                <button
                    onClick={onProceed}
                    className="w-full py-3 px-6 bg-red-600 hover:bg-red-700 text-white font-bold text-lg rounded-lg transition duration-300 ease-in-out transform hover:scale-105"
                >
                    View AI Analysis
                </button>
            </div>
        </div>
    );
};

export default RaceFinishScreen;
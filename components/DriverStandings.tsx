import React from 'react';
import { DriverStanding } from '../types';

interface DriverStandingsProps {
  standings: DriverStanding[];
  onSelectTeam: (teamName: string) => void;
}

const DriverStandings: React.FC<DriverStandingsProps> = ({ standings, onSelectTeam }) => {
  const sortedStandings = [...standings].sort((a, b) => b.points - a.points);

  return (
    <div className="w-full bg-gray-800 p-6 rounded-lg shadow-2xl h-full flex flex-col">
      <h3 className="text-2xl font-bold mb-4 text-white">Championship Standings</h3>
      <div className="overflow-y-auto flex-grow">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-900 sticky top-0">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase">Pos</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase">Driver</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-300 uppercase">Points</th>
            </tr>
          </thead>
          <tbody className="bg-gray-800 divide-y divide-gray-700">
            {sortedStandings.map((driver, index) => (
              <tr 
                key={driver.driverId}
                onClick={() => onSelectTeam(driver.teamName)}
                className="cursor-pointer hover:bg-gray-700 transition-colors"
              >
                <td className="px-4 py-3 font-semibold">{index + 1}</td>
                <td className="px-4 py-3">
                   <div className="flex items-center">
                    <div className={`w-1 h-5 mr-3`} style={{ backgroundColor: driver.teamHexColor }}></div>
                    <div>
                        <div className="text-sm font-medium text-white">{driver.name}</div>
                        <div className="text-xs text-gray-400">{driver.teamName}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-right font-bold font-mono">{driver.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DriverStandings;

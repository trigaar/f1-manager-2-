import React from 'react';
import { PracticeResult, InitialDriver } from '../types';
// FIX: Correct import path for constants
import { getTeamColors } from '../constants';

interface PracticeScreenProps {
  results: PracticeResult[];
  roster: InitialDriver[];
  onProceed: () => void;
}

const getGradeColor = (grade: PracticeResult['grade']) => {
    switch(grade) {
        case 'A': return 'bg-green-500';
        case 'B': return 'bg-teal-500';
        case 'C': return 'bg-yellow-500 text-black';
        case 'D': return 'bg-orange-500';
        case 'E': return 'bg-red-500';
        case 'F': return 'bg-red-700';
        default: return 'bg-gray-600';
    }
}

const PracticeScreen: React.FC<PracticeScreenProps> = ({ results, roster, onProceed }) => {
    
    // FIX: Add explicit type to map callback parameter to fix type inference issue.
    const driverMap = new Map(roster.map((d: InitialDriver) => [d.id, d]));

    return (
        <div className="w-full max-w-4xl bg-gray-900/50 backdrop-blur-sm p-6 rounded-lg shadow-2xl flex flex-col items-center animate-fade-in">
            <div className="w-full text-center mb-6">
                <button 
                    onClick={onProceed}
                    className="py-3 px-8 bg-red-600 hover:bg-red-700 text-white font-bold text-lg rounded-lg transition duration-300 ease-in-out transform hover:scale-105 shadow-md"
                >
                    Proceed to Qualifying
                </button>
            </div>

            <div className="w-full flex justify-between items-center mb-4">
                <h2 className="text-3xl font-bold text-white tracking-widest">Practice Session Results</h2>
            </div>
            
            <div className="w-full bg-gray-800/50 rounded-lg overflow-hidden shadow-lg mb-6">
                <div className="overflow-y-auto" style={{ maxHeight: '65vh' }}>
                    <table className="min-w-full divide-y divide-gray-700">
                        <thead className="bg-gray-900/80 sticky top-0">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Driver</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase">Grade</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Summary</th>
                            </tr>
                        </thead>
                        <tbody className="bg-gray-800 divide-y divide-gray-700">
                            {results.map(res => {
                                const driver = driverMap.get(res.driverId);
                                if (!driver) return null;
                                const { teamHexColor } = getTeamColors(driver.car.teamName);
                                
                                return (
                                    <tr key={res.driverId}>
                                        <td className="px-6 py-3 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className={`w-1 h-5 mr-3`} style={{ backgroundColor: teamHexColor }}></div>
                                                <div>
                                                    <div className="text-sm font-medium text-white">{res.driverName}</div>
                                                    <div className="text-xs text-gray-400">{driver.car.teamName}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-center">
                                            <span className={`px-3 py-1 inline-flex text-lg leading-5 font-black rounded-full ${getGradeColor(res.grade)} text-white`}>
                                                {res.grade}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-sm text-gray-300">
                                            {res.summary}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default PracticeScreen;
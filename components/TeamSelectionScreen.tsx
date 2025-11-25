



import React, { useState } from 'react';
import { Car, InitialDriver, TeamPersonnel, CarAttribute } from '../types';
import { getTeamColors } from '../constants';
import { F1CarIcon } from './IconComponents';
import HowToPlayModal from './HowToPlayModal';

// Copied from TeamDetailModal and adjusted for reuse
const StatBar: React.FC<{ label: string; value: number; maxValue?: number; colorClass?: string }> = ({ label, value, maxValue = 100, colorClass }) => {
    const getStatColor = (val: number) => {
        if (val >= 95) return 'bg-purple-500';
        if (val >= 90) return 'bg-green-500';
        if (val >= 85) return 'bg-teal-400';
        if (val >= 80) return 'bg-yellow-400';
        return 'bg-red-500';
    };
    
    return (
        <div className="mb-2">
            <div className="flex justify-between mb-0.5">
            <span className="text-xs font-medium text-gray-300">{label}</span>
            <span className="text-xs font-bold text-white">{value.toFixed(0)}</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-1.5">
            <div className={`${colorClass || getStatColor(value)} h-1.5 rounded-full`} style={{ width: `${(value / maxValue) * 100}%` }}></div>
            </div>
        </div>
    );
};

const formatAttributeName = (attr: string) => {
    return attr.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
};


interface TeamData {
    car?: Car;
    personnel?: TeamPersonnel;
    drivers: InitialDriver[];
}

interface TeamSelectionScreenProps {
  teams: TeamData[];
  onSelectTeam: (teamName: string) => void;
  onShowHowToPlay: () => void;
}

const TeamSelectionScreen: React.FC<TeamSelectionScreenProps> = ({ teams, onSelectTeam, onShowHowToPlay }) => {
    const [selectedTeam, setSelectedTeam] = useState<TeamData | null>(teams.length > 0 ? teams[0] : null);

    const carAttributes: (keyof Omit<Car, 'teamName' | 'isLST' | 'overallPace'>)[] = ['highSpeedCornering', 'mediumSpeedCornering', 'lowSpeedCornering', 'powerSensitivity', 'reliability', 'tyreWearFactor'];

    return (
        <div className="w-full max-w-7xl bg-gray-900/50 backdrop-blur-sm p-6 rounded-lg shadow-2xl flex flex-col items-center animate-fade-in">
            <header className="w-full text-center mb-6 relative">
                <h1 className="text-5xl font-bold text-red-500 tracking-wider">F1 Management Simulator</h1>
                <p className="text-xl text-gray-300 mt-2">Choose Your Team for the 2025 Season</p>
                 <button 
                    onClick={onShowHowToPlay}
                    className="absolute top-0 right-0 py-2 px-4 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition duration-300"
                >
                    How to Play
                </button>
            </header>

            <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Team Grid */}
                <div className="lg:col-span-1 bg-gray-800 p-3 rounded-lg overflow-y-auto" style={{ maxHeight: '65vh' }}>
                    <div className="grid grid-cols-2 gap-3">
                        {teams.map((team) => {
                            if (!team.car) return null;
                            const { teamHexColor } = getTeamColors(team.car.teamName);
                            const isSelected = selectedTeam?.car?.teamName === team.car.teamName;
                            return (
                                <button 
                                    key={team.car.teamName} 
                                    onClick={() => setSelectedTeam(team)}
                                    className={`p-3 rounded-lg text-center transition-all duration-200 transform hover:scale-105 ${isSelected ? 'ring-2 ring-white shadow-lg' : 'hover:bg-gray-700'}`}
                                    style={{ backgroundColor: isSelected ? teamHexColor : '#374151' /* bg-gray-700 */ }}
                                >
                                    <F1CarIcon color={isSelected ? '#FFFFFF' : teamHexColor} className="w-16 h-16 mx-auto" />
                                    <p className="font-bold text-white text-sm mt-2 truncate">{team.car.teamName}</p>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Details Panel */}
                <div className="lg:col-span-2 bg-gray-800 p-4 rounded-lg">
                    {selectedTeam && selectedTeam.car && selectedTeam.personnel ? (
                        <>
                            <div className="text-center pb-4 border-b-4" style={{ borderColor: getTeamColors(selectedTeam.car.teamName).teamHexColor }}>
                                <h2 className="text-3xl font-bold text-white">{selectedTeam.car.teamName}</h2>
                                <p className="text-lg text-gray-400">Overall Pace: <span className="font-bold text-white">{selectedTeam.car.overallPace}</span></p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-300 mb-2">Car Performance</h3>
                                    <div className="bg-gray-900/50 p-3 rounded-md">
                                        {carAttributes.map(attr => (
                                            <StatBar key={attr} label={formatAttributeName(attr)} value={selectedTeam.car![attr]} />
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-300 mb-2">Leadership</h3>
                                    {selectedTeam.personnel.teamPrincipal &&
                                        <div className="bg-gray-900/50 p-3 rounded-md mb-3">
                                            <p className="font-bold text-white">{selectedTeam.personnel.teamPrincipal.name}</p>
                                            <p className="text-xs text-gray-400">Team Principal</p>
                                        </div>
                                    }
                                    {selectedTeam.personnel.headOfTechnical &&
                                        <div className="bg-gray-900/50 p-3 rounded-md">
                                            <p className="font-bold text-white">{selectedTeam.personnel.headOfTechnical.name}</p>
                                            <p className="text-xs text-gray-400">Head of Technical</p>
                                        </div>
                                    }
                                    <h3 className="text-lg font-semibold text-gray-300 mt-4 mb-2">Drivers</h3>
                                    {selectedTeam.drivers.map(driver => (
                                        <div key={driver.id} className="bg-gray-900/50 p-3 rounded-md mb-2">
                                            <div className="flex justify-between items-center">
                                                <p className="font-bold text-white">{driver.name}</p>
                                                <p className="text-sm font-mono">OVR: {driver.driverSkills.overall}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="mt-6 text-center">
                                <button 
                                    onClick={() => onSelectTeam(selectedTeam.car!.teamName)}
                                    className="py-3 px-12 bg-red-600 hover:bg-red-700 text-white font-bold text-xl rounded-lg transition duration-300 ease-in-out transform hover:scale-105 shadow-lg"
                                >
                                    Manage This Team
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="flex justify-center items-center h-full">
                            <p className="text-gray-500">Select a team to view details</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TeamSelectionScreen;
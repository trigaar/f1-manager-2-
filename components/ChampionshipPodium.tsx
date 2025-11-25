import React from 'react';
import { DriverStanding, ConstructorStanding } from '../types';

interface ChampionshipPodiumProps {
    driverStandings: DriverStanding[];
    constructorStandings: ConstructorStanding[];
}

const CrownIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2l2.54 7.78h8.46l-6.84 4.8 2.58 7.42-6.74-4.82-6.74 4.82 2.58-7.42-6.84-4.8h8.46L12 2z" />
    </svg>
);

const ChampionshipPodium: React.FC<ChampionshipPodiumProps> = ({ driverStandings, constructorStandings }) => {
    const podiumDrivers = [
        driverStandings.find(d => d.position === 2),
        driverStandings.find(d => d.position === 1),
        driverStandings.find(d => d.position === 3)
    ].filter(Boolean) as DriverStanding[];
    
    const wcc = constructorStandings.find(c => c.position === 1);

    return (
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6 bg-gray-900/50 p-4 rounded-lg">
            {/* WDC Podium */}
            <div>
                <h3 className="text-2xl font-bold mb-4 text-white text-center">Drivers' Championship</h3>
                <div className="flex justify-center items-end gap-2 px-2 h-56">
                    {podiumDrivers.map((driver) => {
                        if (!driver) return null;
                        const height = driver.position === 1 ? 'h-48' : driver.position === 2 ? 'h-40' : 'h-32';
                        return (
                            <div key={driver.driverId} className={`flex flex-col justify-end items-center w-1/3 p-2 rounded-t-lg shadow-lg text-white ${height}`} style={{ backgroundColor: driver.teamHexColor }}>
                                {driver.position === 1 && <CrownIcon className="w-8 h-8 text-yellow-400 mb-1" />}
                                <div className="text-center">
                                    <p className="text-2xl font-black" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.7)' }}>{driver.position}</p>
                                    <p className="font-bold text-sm truncate">{driver.name}</p>
                                    <p className="text-xs font-mono">{driver.points} pts</p>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* WCC Standings */}
            <div>
                <h3 className="text-2xl font-bold mb-4 text-white text-center">Constructors' Championship</h3>
                {wcc && (
                     <div className="bg-gray-800 rounded-lg p-3 mb-3 text-center border-2 border-yellow-400">
                        <p className="text-xs text-yellow-400 font-bold uppercase">World Champions</p>
                        <p className="text-xl font-bold text-white">{wcc.teamName}</p>
                        <p className="text-lg font-mono text-gray-300">{wcc.points} pts</p>
                    </div>
                )}
                <div className="space-y-1">
                    {constructorStandings.slice(1, 5).map(team => (
                        <div key={team.teamName} className="bg-gray-800 p-2 rounded-md flex justify-between items-center">
                            <div className="flex items-center">
                                <span className="font-bold w-6">{team.position}.</span>
                                <div className="w-1 h-5 mr-2" style={{backgroundColor: team.teamHexColor}}></div>
                                <span className="font-semibold text-sm">{team.teamName}</span>
                            </div>
                            <span className="font-mono text-sm text-gray-300">{team.points} pts</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ChampionshipPodium;
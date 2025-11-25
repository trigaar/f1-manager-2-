
import React, { useState, useMemo } from 'react';
import { InitialDriver, DriverMarketEvent, RookieDriver, TeamFinances, DriverTraitRarity, ShortlistDriver } from '../types';
// FIX: Correct import path
import { CARS, getTeamColors } from '../constants';
import { generateRookieDriver } from '../services/driverMarketService';

interface DriverMarketScreenProps {
  season: number;
  roster: InitialDriver[];
  onProceed: (newPlayerRoster: InitialDriver[]) => void;
  playerTeam: string;
  teamFinances: TeamFinances[];
  rookiePool: RookieDriver[];
  shortlist: ShortlistDriver[];
}

const formatCurrency = (value: number) => `$${(value / 1_000_000).toFixed(1)}M`;

const TeamTag: React.FC<{ teamName: string }> = ({ teamName }) => {
    const { teamHexColor } = getTeamColors(teamName);
    return (
        <span className="font-semibold px-2 py-1 rounded text-xs text-white" style={{ backgroundColor: teamHexColor }}>
            {teamName}
        </span>
    );
};

const TraitPill: React.FC<{ trait: InitialDriver['driverSkills']['trait'] }> = ({ trait }) => {
    if (!trait) return null;

    const getRarityColor = () => {
        switch (trait.rarity) {
            case DriverTraitRarity.Legendary: return 'bg-yellow-500/80 text-yellow-200';
            case DriverTraitRarity.Rare: return 'bg-blue-500/80 text-blue-200';
            case DriverTraitRarity.Common: return 'bg-gray-500/80 text-gray-200';
            default: return 'bg-gray-600';
        }
    };
    return (
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getRarityColor()}`}>{trait.name}</span>
    );
};

const DriverCard: React.FC<{ driver: InitialDriver, onAction: () => void, actionLabel: string, actionColor: string, disabled: boolean, cost?: number }> = ({ driver, onAction, actionLabel, actionColor, disabled, cost }) => {
    const isFA = driver.status === 'Free Agent';
    return (
        <div className="bg-gray-700 p-2 rounded-md flex justify-between items-center">
            <div>
                <div className="flex items-center gap-2">
                    <p className="font-semibold">{driver.name}</p>
                    <TraitPill trait={driver.driverSkills.trait} />
                </div>
                <p className="text-xs text-gray-400">
                    OVR: {driver.driverSkills.overall} | Age: {driver.age} | Salary: {formatCurrency(driver.salary)}
                    {!isFA && <span className="ml-2">({driver.car.teamName})</span>}
                </p>
            </div>
            <button onClick={onAction} disabled={disabled} className={`text-xs font-semibold py-1 px-3 rounded-md transition-colors ${actionColor} disabled:bg-gray-600 disabled:cursor-not-allowed`}>
                {actionLabel} {cost ? `(${formatCurrency(cost)})` : ''}
            </button>
        </div>
    );
};

const DriverMarketScreen: React.FC<DriverMarketScreenProps> = ({ season, roster, onProceed, playerTeam, teamFinances, rookiePool, shortlist }) => {
    
    const [playerRoster, setPlayerRoster] = useState<InitialDriver[]>(() => roster.filter(d => d.car.teamName === playerTeam && d.status === 'Active'));
    const [marketDrivers, setMarketDrivers] = useState<{ FAs: InitialDriver[], Rookies: RookieDriver[], Shortlist: ShortlistDriver[] }>(() => {
        const playerDriverIds = new Set(playerRoster.map(d => d.id));
        const initialShortlist = shortlist.filter(d => !playerDriverIds.has(d.id));
        const shortlistIds = new Set(initialShortlist.map(d => d.id));
        return {
            FAs: roster.filter(d => d.status === 'Free Agent' && !shortlistIds.has(d.id)),
            Rookies: rookiePool,
            Shortlist: initialShortlist,
        }
    });
    const [driverToReplace, setDriverToReplace] = useState<ShortlistDriver | null>(null);

    const playerFinance = useMemo(() => teamFinances.find(f => f.teamName === playerTeam), [teamFinances, playerTeam]);
    const budget = playerFinance?.driverAcquisitionFund || 0;
    const currentSalaries = playerRoster.reduce((sum, d) => sum + d.salary, 0);
    
    const handleSign = (driver: InitialDriver | RookieDriver, list: 'FAs' | 'Rookies' | 'Shortlist') => {
        if (playerRoster.length >= 2) return;

        let newDriver: InitialDriver;
        let cost = 0;

        if ('rawPace' in driver) { // Rookie
            const newId = Math.max(100, ...roster.map(d => d.id), ...playerRoster.map(d => d.id)) + 1;
            newDriver = generateRookieDriver(driver, playerTeam, newId);
            cost = newDriver.salary;
        } else { // Free Agent or Poach
            newDriver = { ...driver, status: 'Active', car: CARS[Object.keys(CARS).find(k => CARS[k as keyof typeof CARS].teamName === playerTeam)!] };
            cost = driver.status === 'Free Agent' ? driver.salary : driver.salary * 1.5;
        }

        if (budget - currentSalaries - cost < 0) return;

        if ('rawPace' in driver) {
            setMarketDrivers(prev => ({ ...prev, Rookies: prev.Rookies.filter(r => r.name !== driver.name)}));
        } else {
             setMarketDrivers(prev => ({ ...prev, [list]: prev[list as 'FAs' | 'Shortlist'].filter(d => d.id !== driver.id)}));
        }
        setPlayerRoster(prev => [...prev, newDriver]);
    };

    const handlePoach = (driver: ShortlistDriver) => {
        if(playerRoster.length < 2) {
            handleSign(driver, 'Shortlist');
        } else {
            setDriverToReplace(driver);
        }
    }

    const executeReplacement = (driverToRelease: InitialDriver) => {
        if (!driverToReplace) return;

        const poachCost = driverToReplace.salary * 1.5;
        if (budget - (currentSalaries - driverToRelease.salary) - poachCost < 0) {
            setDriverToReplace(null);
            return;
        };

        // Release old driver
        setPlayerRoster(prev => prev.filter(d => d.id !== driverToRelease.id));
        setMarketDrivers(prev => ({...prev, FAs: [...prev.FAs, {...driverToRelease, status: 'Free Agent'}]}));

        // Sign new driver
        const newDriver: InitialDriver = { ...driverToReplace, status: 'Active', car: CARS[Object.keys(CARS).find(k => CARS[k as keyof typeof CARS].teamName === playerTeam)!] };
        setPlayerRoster(prev => [...prev, newDriver]);
        setMarketDrivers(prev => ({...prev, Shortlist: prev.Shortlist.filter(d => d.id !== newDriver.id)}));

        setDriverToReplace(null);
    }

    const handleRelease = (driverId: number) => {
        const driverToRelease = playerRoster.find(d => d.id === driverId)!;
        setPlayerRoster(prev => prev.filter(d => d.id !== driverId));
        setMarketDrivers(prev => ({...prev, FAs: [...prev.FAs, {...driverToRelease, status: 'Free Agent'}]}));
    };

    const remainingBudget = budget - currentSalaries;

    return (
        <div className="w-full max-w-7xl bg-gray-800 p-6 rounded-lg shadow-2xl flex flex-col items-center animate-fade-in">
            <h2 className="text-4xl font-bold mb-1 text-white tracking-widest">{season} OFF-SEASON</h2>
            <p className="text-lg text-gray-400 mb-4">Phase 5: Driver Market ("Silly Season")</p>

            <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Your Team & Roster */}
                <div className="bg-gray-900/50 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-4">
                       <h3 className="text-2xl font-bold text-white">Your Roster: {playerTeam}</h3>
                       <div>
                           <p className="text-xs text-gray-400">Remaining Driver Budget</p>
                           <p className={`font-mono font-bold text-lg ${remainingBudget >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(remainingBudget)}</p>
                       </div>
                    </div>
                    <div className="space-y-2">
                        {playerRoster.length > 0 ? playerRoster.map(driver => (
                             <div key={driver.id} className="bg-gray-800 p-3 rounded-md">
                                <p className="font-bold text-white">{driver.name}</p>
                                <p className="text-xs text-gray-400">Salary: {formatCurrency(driver.salary)}</p>
                                <button onClick={() => handleRelease(driver.id)} className="w-full mt-2 text-xs bg-red-600 hover:bg-red-700 font-semibold py-1 px-2 rounded">Release to Free Agency</button>
                            </div>
                        )) : <p className="text-gray-500 italic text-center">No drivers signed.</p>}
                        {Array.from({ length: 2 - playerRoster.length }).map((_, i) => (
                             <div key={i} className="bg-gray-800 p-3 rounded-md text-center flex items-center justify-center h-[76px]">
                                <p className="text-gray-500 italic">Seat Available</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Market */}
                <div className="bg-gray-900/50 p-4 rounded-lg flex flex-col">
                    <h3 className="text-2xl font-bold mb-4 text-white">Driver Market</h3>
                    <div className="overflow-y-auto flex-grow space-y-3" style={{ maxHeight: '60vh' }}>
                        <div>
                            <h4 className="text-lg font-bold text-yellow-400 sticky top-0 bg-gray-900/80 py-1 backdrop-blur-sm z-10">Transfer Shortlist</h4>
                            {marketDrivers.Shortlist.map(d => (
                                <DriverCard key={d.id} driver={d} onAction={() => handlePoach(d)} actionLabel={d.status === 'Free Agent' ? 'Sign' : 'Poach'} actionColor="bg-yellow-600 hover:bg-yellow-700" disabled={playerRoster.length >= 2 && !driverToReplace} cost={d.status === 'Free Agent' ? d.salary : d.salary * 1.5} />
                            ))}
                        </div>
                        <div>
                           <h4 className="text-lg font-bold text-blue-400 sticky top-0 bg-gray-900/80 py-1 backdrop-blur-sm z-10">Free Agents</h4>
                            {marketDrivers.FAs.map(d => (
                                <DriverCard key={d.id} driver={d} onAction={() => handleSign(d, 'FAs')} actionLabel="Sign" actionColor="bg-green-600 hover:bg-green-700" disabled={playerRoster.length >= 2} />
                            ))}
                        </div>
                         <div>
                           <h4 className="text-lg font-bold text-purple-400 sticky top-0 bg-gray-900/80 py-1 backdrop-blur-sm z-10">Rookie Pool</h4>
                           {marketDrivers.Rookies.map(r => (
                               <div key={r.name} className="bg-gray-700 p-2 rounded-md flex justify-between items-center">
                                    <div><p className="font-semibold">{r.name}</p><p className="text-xs text-gray-400">Pace: {r.rawPace} | Potential: {r.potential}</p></div>
                                    <button onClick={() => handleSign(r, 'Rookies')} disabled={playerRoster.length >= 2} className="text-xs bg-green-600 hover:bg-green-700 font-semibold py-1 px-3 rounded-md disabled:bg-gray-600 disabled:cursor-not-allowed">Sign</button>
                               </div>
                           ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="w-full flex flex-col sm:flex-row justify-center items-center gap-4 mt-6">
                <button
                    onClick={() => onProceed(playerRoster)}
                    disabled={playerRoster.length !== 2 || remainingBudget < 0}
                    className="w-full max-w-md py-3 px-6 bg-red-600 hover:bg-red-700 text-white font-bold text-lg rounded-lg transition duration-300 ease-in-out transform hover:scale-105 disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                    Confirm Roster & Proceed
                </button>
            </div>
            
            {/* Replacement Modal */}
            {driverToReplace && (
                 <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
                    <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
                        <h3 className="text-xl font-bold mb-2">Replace a Driver</h3>
                        <p className="text-sm text-gray-300 mb-4">To sign <span className="font-bold">{driverToReplace.name}</span>, you must release one of your current drivers.</p>
                        <div className="space-y-2">
                            {playerRoster.map(d => (
                                <button key={d.id} onClick={() => executeReplacement(d)} className="w-full text-left bg-gray-700 hover:bg-red-700 p-3 rounded-md transition-colors">
                                    <p className="font-semibold">Release {d.name}</p>
                                    <p className="text-xs text-gray-400">Salary: {formatCurrency(d.salary)}</p>
                                </button>
                            ))}
                        </div>
                         <button onClick={() => setDriverToReplace(null)} className="w-full mt-4 text-sm text-gray-400 hover:text-white">Cancel</button>
                    </div>
                 </div>
            )}
        </div>
    );
};

export default DriverMarketScreen;

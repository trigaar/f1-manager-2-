
import React, { useState, useMemo } from 'react';
import { CarDevelopmentResult, CarAttribute, Car, TeamFinances, PlayerCarDev, TeamPersonnel } from '../types';
// FIX: Correct import path to constants index
import { getTeamColors } from '../constants';

interface CarDevelopmentScreenProps {
  season: number;
  onProceed: (playerCarDev: PlayerCarDev) => void;
  onSelectTeam: (teamName: string) => void;
  playerTeam: string;
  teamFinances: TeamFinances[];
  carRatings: { [key: string]: Car };
  personnel: TeamPersonnel[];
}

const formatCurrency = (value: number) => `$${(value / 1_000_000).toFixed(1)}M`;
const formatAttributeName = (attr: CarAttribute) => {
    return attr.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
}

const getStatColor = (value: number) => {
    if (value >= 95) return 'bg-purple-500';
    if (value >= 90) return 'bg-green-500';
    if (value >= 85) return 'bg-teal-400';
    if (value >= 80) return 'bg-yellow-400';
    return 'bg-red-500';
};

const getGainColor = (gain: number) => {
    if (gain > 0) return 'text-green-400';
    return 'text-gray-400';
}

const CarDevelopmentScreen: React.FC<CarDevelopmentScreenProps> = ({ season, onProceed, playerTeam, carRatings, teamFinances, personnel }) => {
    
    const playerCarInitial = useMemo(() => Object.values(carRatings).find((c: Car) => c.teamName === playerTeam)!, [carRatings, playerTeam]);
    const playerFinance = useMemo(() => teamFinances.find(f => f.teamName === playerTeam)!, [teamFinances, playerTeam]);
    const playerPersonnel = useMemo(() => personnel.find(p => p.teamName === playerTeam)!, [personnel, playerTeam]);

    const devPoints = useMemo(() => {
        if (!playerFinance || !playerPersonnel) return 0;
        const RD_CONVERSION_RATE = 1 / 50000;
        // FIX: Add null-safe access with fallback values for personnel skills
        const effectiveBudget = playerFinance.carDevelopmentBudget * (1 + ((playerPersonnel.teamPrincipal?.financialAcumen || 10) - 10) * 0.01);
        const baseDP = effectiveBudget * (RD_CONVERSION_RATE * ((playerPersonnel.headOfTechnical?.rdConversion || 15) / 15));
        return Math.round(baseDP);
    }, [playerFinance, playerPersonnel]);

    const CAR_ATTRIBUTES: CarAttribute[] = ['highSpeedCornering', 'mediumSpeedCornering', 'lowSpeedCornering', 'powerSensitivity', 'reliability', 'tyreWearFactor'];
    
    const [pointsAllocation, setPointsAllocation] = useState<Record<CarAttribute, number>>(
      CAR_ATTRIBUTES.reduce((acc, attr) => ({...acc, [attr]: 0}), {} as Record<CarAttribute, number>)
    );

    const totalPointsSpent = useMemo(() => Object.values(pointsAllocation).reduce((sum: number, val: number) => sum + val, 0), [pointsAllocation]);
    const remainingPoints = devPoints - totalPointsSpent;

    const calculateGain = (attributeValue: number, dpSpent: number): number => {
        const DP_TO_ATTRIBUTE_RATE = 1000;
        const efficiency = Math.max(0.1, 1 - Math.pow(attributeValue / 105, 3));
        return (dpSpent / DP_TO_ATTRIBUTE_RATE) * efficiency;
    };

    const handleAllocationChange = (attr: CarAttribute, value: number) => {
        const currentVal = pointsAllocation[attr];
        const diff = value - currentVal;
        if (diff > 0 && remainingPoints - diff < 0) {
            setPointsAllocation(prev => ({ ...prev, [attr]: currentVal + remainingPoints }));
        } else {
            setPointsAllocation(prev => ({ ...prev, [attr]: value }));
        }
    };
    
    const handleProceed = () => {
        let finalCar = JSON.parse(JSON.stringify(playerCarInitial)) as Car;
        const upgrades: CarDevelopmentResult['upgrades'] = [];

        CAR_ATTRIBUTES.forEach(attr => {
            if (pointsAllocation[attr] > 0) {
                const oldValue = finalCar[attr];
                const gain = calculateGain(oldValue, pointsAllocation[attr]);
                const newValue = Math.min(100, oldValue + gain);
                finalCar[attr] = newValue;
                upgrades.push({ attribute: attr, oldValue: parseFloat(oldValue.toFixed(2)), newValue: parseFloat(newValue.toFixed(2)) });
            }
        });
        
        finalCar.overallPace = Math.round(
            (finalCar.highSpeedCornering + finalCar.mediumSpeedCornering + finalCar.lowSpeedCornering + finalCar.powerSensitivity) / 4
        );

        const devResult: CarDevelopmentResult = {
            teamName: playerTeam,
            teamHexColor: playerFinance.teamHexColor,
            devFund: playerFinance.carDevelopmentBudget,
            devPoints: devPoints,
            events: ['Player-led development focus.'],
            upgrades,
            newOverallPace: finalCar.overallPace,
        };

        onProceed({ finalCar, devResult });
    };

    return (
        <div className="w-full max-w-4xl bg-gray-800 p-6 rounded-lg shadow-2xl flex flex-col items-center animate-fade-in">
            <h2 className="text-4xl font-bold mb-1 text-white tracking-widest">{season} OFF-SEASON</h2>
            <p className="text-lg text-gray-400 mb-4">Final Phase: Car Development</p>
            
            <div className="w-full bg-gray-900/50 p-6 rounded-lg mb-6">
                <div className="text-center mb-6">
                    <p className="text-gray-400">Total Development Points (DP)</p>
                    <p className="text-5xl font-bold font-mono text-yellow-400">{devPoints.toLocaleString()}</p>
                    <p className="text-gray-400 mt-2">Remaining DP: <span className="font-bold text-white">{remainingPoints.toLocaleString()}</span></p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                    {CAR_ATTRIBUTES.map(attr => {
                        const maxSpend = pointsAllocation[attr] + remainingPoints;
                        const gain = calculateGain(playerCarInitial[attr], pointsAllocation[attr]);
                        const projectedValue = playerCarInitial[attr] + gain;
                        return (
                            <div key={attr}>
                                <div className="flex justify-between items-baseline mb-1">
                                    <label className="text-md font-semibold text-gray-200">{formatAttributeName(attr)}</label>
                                    <div className="text-right">
                                        <span className="font-mono text-sm font-bold text-white">{playerCarInitial[attr].toFixed(1)}</span>
                                        <span className={`font-mono text-sm font-bold ml-1 ${getGainColor(gain)}`}>
                                           (+{gain.toFixed(1)})
                                        </span>
                                        <span className="font-mono text-sm text-gray-400"> → {projectedValue.toFixed(1)}</span>
                                    </div>
                                </div>
                                 <div className="w-full bg-gray-700 rounded-full h-1.5 mb-1">
                                    <div className={`${getStatColor(playerCarInitial[attr])} h-1.5 rounded-full`} style={{ width: `${playerCarInitial[attr]}%` }}></div>
                                </div>
                                <input 
                                    type="range" 
                                    min="0" 
                                    max={maxSpend} 
                                    value={pointsAllocation[attr]}
                                    onChange={(e) => handleAllocationChange(attr, parseInt(e.target.value, 10))}
                                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer range-lg accent-red-500" 
                                />
                                <div className="text-right text-xs text-gray-400 font-mono">
                                    {pointsAllocation[attr].toLocaleString()} DP
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <button
                onClick={handleProceed}
                className="w-full max-w-md py-4 px-8 bg-red-600 hover:bg-red-700 text-white font-bold text-xl rounded-lg transition duration-300 ease-in-out transform hover:scale-105"
            >
                Finalize Design & Launch {season + 1} Season
            </button>
        </div>
    );
};

export default CarDevelopmentScreen;

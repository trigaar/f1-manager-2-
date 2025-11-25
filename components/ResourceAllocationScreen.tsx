import React, { useState, useMemo, useEffect } from 'react';
import { TeamFinances, InitialDriver } from '../types';

interface ResourceAllocationScreenProps {
  season: number;
  onProceed: (allocations: { carDevelopmentBudget: number; driverAcquisitionFund: number; personnelInvestment: number; }) => void;
  onSelectTeam: (teamName: string) => void;
  teamFinances: TeamFinances[];
  playerTeam: string;
  roster: InitialDriver[];
}

const formatCurrency = (value: number) => {
    if (value === 0) return '$0.0M';
    const sign = value < 0 ? '-' : '';
    return `${sign}$${(Math.abs(value) / 1_000_000).toFixed(1)}M`;
}

const ResourceAllocationScreen: React.FC<ResourceAllocationScreenProps> = ({ season, onProceed, onSelectTeam, teamFinances, playerTeam, roster }) => {

    const playerTeamFinance = useMemo(() => teamFinances.find(tf => tf.teamName === playerTeam), [teamFinances, playerTeam]);
    const totalBudget = playerTeamFinance?.finalBudget || 0;
    
    const [carPct, setCarPct] = useState(70);
    const [driverPct, setDriverPct] = useState(20);
    const [personnelPct, setPersonnelPct] = useState(10);

    const currentSalaries = useMemo(() => {
        return roster
            .filter(d => d.car.teamName === playerTeam && d.status === 'Active')
            .reduce((sum, d) => sum + d.salary, 0);
    }, [roster, playerTeam]);


    const handleSliderChange = (
        type: 'car' | 'driver' | 'personnel',
        value: number
    ) => {
        const oldValue = { car: carPct, driver: driverPct, personnel: personnelPct }[type];
        const delta = value - oldValue;

        let otherPct1: number;
        let otherPct2: number;

        if (type === 'car') {
            otherPct1 = driverPct;
            otherPct2 = personnelPct;
        } else if (type === 'driver') {
            otherPct1 = carPct;
            otherPct2 = personnelPct;
        } else { // personnel
            otherPct1 = carPct;
            otherPct2 = driverPct;
        }
        
        // Don't adjust if the other sliders are already at zero and we are increasing
        if(delta > 0 && otherPct1 === 0 && otherPct2 === 0) {
            return; // Cannot increase further
        }

        const sumOfOthers = otherPct1 + otherPct2;
        let newOtherPct1 = otherPct1;
        let newOtherPct2 = otherPct2;

        if (sumOfOthers > 0) {
            newOtherPct1 = Math.max(0, otherPct1 - delta * (otherPct1 / sumOfOthers));
            newOtherPct2 = Math.max(0, otherPct2 - delta * (otherPct2 / sumOfOthers));
        } else { // Both are zero, take from the one that isn't the current type
            const nonZeroSum = carPct + driverPct + personnelPct - oldValue;
             if (type !== 'car') newOtherPct1 = Math.max(0, carPct - delta / (nonZeroSum > 0 ? 2 : 1));
             if (type !== 'driver') newOtherPct2 = Math.max(0, driverPct - delta / (nonZeroSum > 0 ? 2 : 1));
        }

        // Apply state updates
        if (type === 'car') {
            setCarPct(value);
            setDriverPct(newOtherPct1);
            setPersonnelPct(newOtherPct2);
        } else if (type === 'driver') {
            setDriverPct(value);
            setCarPct(newOtherPct1);
            setPersonnelPct(newOtherPct2);
        } else { // personnel
            setPersonnelPct(value);
            setCarPct(newOtherPct1);
            setDriverPct(newOtherPct2);
        }
    };
    
    // This effect ensures the total is always exactly 100 due to rounding
    useEffect(() => {
        const sum = Math.round(carPct) + Math.round(driverPct) + Math.round(personnelPct);
        if (sum !== 100) {
            const diff = 100 - sum;
            setCarPct(prev => prev + diff);
        }
    }, [carPct, driverPct, personnelPct]);


    const carAmount = totalBudget * (carPct / 100);
    const driverAmount = totalBudget * (driverPct / 100);
    const personnelAmount = totalBudget * (personnelPct / 100);
    const projectedSurplus = driverAmount - currentSalaries;
    
    const handleProceed = () => {
        onProceed({
            carDevelopmentBudget: carAmount,
            driverAcquisitionFund: driverAmount,
            personnelInvestment: personnelAmount,
        });
    };

    if (!playerTeamFinance) {
        return <div>Loading...</div>;
    }

    return (
        <div className="w-full max-w-4xl bg-gray-800 p-6 rounded-lg shadow-2xl flex flex-col items-center animate-fade-in">
            <h2 className="text-4xl font-bold mb-1 text-white tracking-widest">{season} OFF-SEASON</h2>
            <p className="text-lg text-gray-400 mb-4">Phase 3: Resource Allocation</p>
            
            <div className="w-full bg-gray-900/50 p-6 rounded-lg mb-6">
                <h3 className="text-2xl font-bold mb-2 text-white text-center">Your Budget Strategy for {playerTeam}</h3>
                <div className="text-center mb-6">
                    <p className="text-gray-400">Total Development Budget</p>
                    <p className="text-5xl font-bold font-mono text-green-400">{formatCurrency(totalBudget)}</p>
                </div>

                <div className="space-y-6">
                    {/* Car Development */}
                    <div>
                        <div className="flex justify-between items-baseline mb-1">
                            <label className="text-lg font-semibold text-teal-300">Car Development Fund</label>
                            <span className="font-mono text-xl font-bold text-white">{formatCurrency(carAmount)} ({Math.round(carPct)}%)</span>
                        </div>
                        <input type="range" min="0" max="100" value={carPct} onChange={(e) => handleSliderChange('car', parseInt(e.target.value, 10))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer range-lg accent-teal-500" />
                        <p className="text-xs text-gray-400 mt-1">Funds R&D for a faster, more reliable car.</p>
                    </div>

                    {/* Driver Fund */}
                    <div>
                         <div className="flex justify-between items-baseline mb-1">
                            <label className="text-lg font-semibold text-blue-300">Driver Acquisition Fund</label>
                            <span className="font-mono text-xl font-bold text-white">{formatCurrency(driverAmount)} ({Math.round(driverPct)}%)</span>
                        </div>
                        <input type="range" min="0" max="100" value={driverPct} onChange={(e) => handleSliderChange('driver', parseInt(e.target.value, 10))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer range-lg accent-blue-500" />
                        <p className="text-xs text-gray-400 mt-1">Determines your budget for driver salaries and contract negotiations.</p>
                        <div className="bg-gray-700/50 p-2 rounded-md mt-2 text-xs flex justify-between">
                            <span>Current Salary Commitments: <span className="font-bold">{formatCurrency(currentSalaries)}</span></span>
                            <span>Projected Surplus/Deficit: <span className={`font-bold ${projectedSurplus >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(projectedSurplus)}</span></span>
                        </div>
                    </div>

                    {/* Personnel Fund */}
                     <div>
                         <div className="flex justify-between items-baseline mb-1">
                            <label className="text-lg font-semibold text-purple-300">Personnel & Facilities</label>
                            <span className="font-mono text-xl font-bold text-white">{formatCurrency(personnelAmount)} ({Math.round(personnelPct)}%)</span>
                        </div>
                        <input type="range" min="0" max="100" value={personnelPct} onChange={(e) => handleSliderChange('personnel', parseInt(e.target.value, 10))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer range-lg accent-purple-500" />
                         <p className="text-xs text-gray-400 mt-1">Invest in your staff and affiliate driver's development.</p>
                    </div>
                </div>
            </div>

            <button
                onClick={handleProceed}
                className="w-full max-w-md py-4 px-8 bg-red-600 hover:bg-red-700 text-white font-bold text-xl rounded-lg transition duration-300 ease-in-out transform hover:scale-105"
            >
                Confirm Allocation
            </button>
        </div>
    );
};

export default ResourceAllocationScreen;

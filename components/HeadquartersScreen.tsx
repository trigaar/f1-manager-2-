

import React, { useState } from 'react';
import { InitialDriver, TeamPersonnel, AffiliateDriver, DriverTraitRarity } from '../types';

interface HeadquartersScreenProps {
    isOpen: boolean;
    onClose: () => void;
    personnel: TeamPersonnel;
    drivers: InitialDriver[];
    affiliate: AffiliateDriver | null;
    onContractOffer: (driverId: number, offerType: 'Lower' | 'Same' | 'Higher') => boolean;
}

const StatBar: React.FC<{ label: string; value: number; maxValue?: number; colorClass?: string }> = ({ label, value, maxValue = 100, colorClass }) => {
    const getStatColor = (val: number, max: number) => {
        const ratio = val / max;
        if (ratio >= 0.9) return 'bg-green-500';
        if (ratio >= 0.8) return 'bg-teal-400';
        if (ratio >= 0.7) return 'bg-yellow-400';
        return 'bg-red-500';
    };
    
    return (
        <div className="mb-2">
            <div className="flex justify-between mb-0.5">
                <span className="text-xs font-medium text-gray-300">{label}</span>
                <span className="text-xs font-bold text-white">{value.toFixed(0)}</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-1.5">
                <div className={`${colorClass || getStatColor(value, maxValue)} h-1.5 rounded-full`} style={{ width: `${(value / maxValue) * 100}%` }}></div>
            </div>
        </div>
    );
};

const TraitPill: React.FC<{ trait: InitialDriver['driverSkills']['trait'] }> = ({ trait }) => {
    if (!trait) return null;
    const rarityColor = {
        [DriverTraitRarity.Legendary]: 'bg-yellow-500/30 text-yellow-300 border-yellow-500',
        [DriverTraitRarity.Rare]: 'bg-blue-500/30 text-blue-300 border-blue-500',
        [DriverTraitRarity.Common]: 'bg-gray-500/30 text-gray-300 border-gray-500',
    }[trait.rarity];

    return (
        <span title={trait.description} className={`ml-2 text-xs font-semibold px-2 py-0.5 rounded-full border ${rarityColor}`}>
            {trait.name}
        </span>
    );
};


const HeadquartersScreen: React.FC<HeadquartersScreenProps> = ({ isOpen, onClose, personnel, drivers, affiliate, onContractOffer }) => {
    const [negotiationDriverId, setNegotiationDriverId] = useState<number | null>(null);

    if (!isOpen) return null;

    const handleOffer = (driverId: number, offerType: 'Lower' | 'Same' | 'Higher') => {
        onContractOffer(driverId, offerType);
        setNegotiationDriverId(null);
    };

    const renderContractStatus = (driver: InitialDriver) => {
        if (driver.contractExpiresIn > 1) {
            return <p className="text-xs text-gray-400">Contract expires in {driver.contractExpiresIn} seasons (Secure)</p>;
        }

        if (driver.negotiationStatus === 'Signed') {
            return <p className="font-bold text-green-400 text-center text-sm">✓ Contract Renewed!</p>;
        }
        if (driver.negotiationStatus === 'Declined') {
            return <p className="font-bold text-red-400 text-center text-sm">✗ Will Leave at End of Season</p>;
        }

        if (negotiationDriverId === driver.id) {
            return (
                <div className="mt-4 space-y-2">
                    <h4 className="text-sm font-bold text-center">Contract Offer</h4>
                    <button onClick={() => handleOffer(driver.id, 'Higher')} className="w-full text-sm bg-green-600 hover:bg-green-500 font-semibold py-1.5 px-2 rounded">Higher Offer (+20% Salary)</button>
                    <button onClick={() => handleOffer(driver.id, 'Same')} className="w-full text-sm bg-gray-500 hover:bg-gray-400 font-semibold py-1.5 px-2 rounded">Same Offer</button>
                    <button onClick={() => handleOffer(driver.id, 'Lower')} className="w-full text-sm bg-red-700 hover:bg-red-600 font-semibold py-1.5 px-2 rounded">Lower Offer (-20% Salary)</button>
                    <button onClick={() => setNegotiationDriverId(null)} className="w-full mt-1 text-xs text-gray-400 hover:text-white">Cancel</button>
                </div>
            );
        }

        return (
            <>
                <p className="text-xs text-yellow-400">Contract expires this season!</p>
                <button 
                  onClick={() => setNegotiationDriverId(driver.id)} 
                  disabled={!!driver.negotiationStatus}
                  className="w-full mt-4 text-sm bg-teal-600 hover:bg-teal-700 font-semibold py-2 px-3 rounded disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                    Manage Contract
                </button>
            </>
        );
    }

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4 animate-fade-in"
            onClick={onClose}
        >
            <div 
                className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto border border-gray-700"
                onClick={e => e.stopPropagation()}
            >
                <div className="sticky top-0 bg-gray-800 p-4 border-b border-gray-700 flex justify-between items-center z-10">
                    <h2 className="text-2xl font-bold text-white">Team Headquarters - {personnel.teamName}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
                </div>

                <div className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Column: Team & Facilities */}
                        <div className="lg:col-span-1 space-y-4">
                            <div className="bg-gray-900/50 p-4 rounded-lg">
                                <h3 className="text-lg font-semibold mb-2">Team Info</h3>
                                <p className="text-sm"><span className="text-gray-400">Location:</span> {personnel.hqLocation}</p>
                            </div>
                            <div className="bg-gray-900/50 p-4 rounded-lg">
                                <h3 className="text-lg font-semibold mb-2">Facilities</h3>
                                <StatBar label="Aerodynamics" value={personnel.facilities.aero} maxValue={10} />
                                <StatBar label="Chassis" value={personnel.facilities.chassis} maxValue={10} />
                                <StatBar label="Powertrain" value={personnel.facilities.powertrain} maxValue={10} />
                            </div>
                             <div className="bg-gray-900/50 p-4 rounded-lg">
                                <h3 className="text-lg font-semibold mb-2">Key Personnel</h3>
                                {personnel.teamPrincipal && <p className="text-sm"><span className="text-gray-400">Team Principal:</span> {personnel.teamPrincipal.name}</p>}
                                {personnel.headOfTechnical && <p className="text-sm"><span className="text-gray-400">Head of Technical:</span> {personnel.headOfTechnical.name}</p>}
                                <p className="text-sm"><span className="text-gray-400">Affiliate:</span> {affiliate?.name || 'None'}</p>
                            </div>
                        </div>

                        {/* Right Column: Drivers */}
                        <div className="lg:col-span-2">
                             <h3 className="text-lg font-semibold mb-2">Driver Roster</h3>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {drivers.map(driver => (
                                    <div key={driver.id} className="bg-gray-900/50 p-4 rounded-lg flex flex-col justify-between">
                                        <div>
                                            <div className="font-bold text-lg text-white flex items-center">
                                                <span>{driver.name}</span>
                                                <TraitPill trait={driver.driverSkills.trait} />
                                            </div>
                                            <p className="text-xs text-gray-400">Salary: ${(driver.salary / 1_000_000).toFixed(1)}M</p>
                                            <div className="my-3 space-y-2">
                                                <StatBar label="Morale" value={driver.morale} colorClass="bg-blue-500" />
                                                <StatBar label="Happiness" value={driver.happiness} colorClass="bg-green-500" />
                                            </div>
                                        </div>
                                        <div className="mt-4 text-center">
                                            {renderContractStatus(driver)}
                                        </div>
                                    </div>
                                ))}
                             </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HeadquartersScreen;
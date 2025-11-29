

import React, { useState } from 'react';
import { InitialDriver, TeamPersonnel, AffiliateDriver, DriverTraitRarity, HeadquartersEvent, HeadquartersEventResolution, WeekendModifier } from '../types';

interface HeadquartersScreenProps {
    isOpen: boolean;
    onClose: () => void;
    personnel: TeamPersonnel;
    drivers: InitialDriver[];
    affiliate: AffiliateDriver | null;
    onContractOffer: (driverId: number, offerType: 'Lower' | 'Same' | 'Higher') => boolean;
    event: HeadquartersEvent | null;
    pendingImpact: HeadquartersEventResolution | null;
    activeImpact: WeekendModifier | null;
    onResolveEvent: (eventId: string, choiceId: string) => void;
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


const HeadquartersScreen: React.FC<HeadquartersScreenProps> = ({ isOpen, onClose, personnel, drivers, affiliate, onContractOffer, event, pendingImpact, activeImpact, onResolveEvent }) => {
    const [negotiationDriverId, setNegotiationDriverId] = useState<number | null>(null);

    if (!isOpen) return null;

    const handleOffer = (driverId: number, offerType: 'Lower' | 'Same' | 'Higher') => {
        onContractOffer(driverId, offerType);
        setNegotiationDriverId(null);
    };

    const average = (vals: number[]) => vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    const moraleAverage = average(drivers.map(d => d.morale));
    const happinessAverage = average(drivers.map(d => d.happiness));

    const buildModifierLines = (modifier?: WeekendModifier | HeadquartersEventResolution | null) => {
        if (!modifier) return [] as string[];
        const lines: string[] = [];
        if (modifier.lapTimeModifier) lines.push(`${modifier.lapTimeModifier > 0 ? '-' : '+'}${Math.abs(modifier.lapTimeModifier).toFixed(2)}s lap pace`);
        if (modifier.qualifyingSkillDelta) lines.push(`${modifier.qualifyingSkillDelta > 0 ? '+' : ''}${modifier.qualifyingSkillDelta} quali skill`);
        if (modifier.paceDelta) lines.push(`${modifier.paceDelta > 0 ? '+' : ''}${modifier.paceDelta} race craft`);
        if (modifier.tyreLifeMultiplier) lines.push(`${Math.round((modifier.tyreLifeMultiplier - 1) * 100)}% tyre life`);
        if (modifier.tyreWearDelta) lines.push(`${modifier.tyreWearDelta > 0 ? '+' : ''}${modifier.tyreWearDelta}% tyre wear`);
        if (modifier.reliabilityDelta) lines.push(`${modifier.reliabilityDelta > 0 ? '+' : ''}${modifier.reliabilityDelta}% reliability`);
        if (modifier.dnfRiskDelta) lines.push(`${modifier.dnfRiskDelta > 0 ? '+' : ''}${modifier.dnfRiskDelta}% DNF risk`);
        if (modifier.pitStopTimeDelta) lines.push(`${modifier.pitStopTimeDelta > 0 ? '+' : ''}${modifier.pitStopTimeDelta}s pit time`);
        if (modifier.pitMistakeChanceDelta) lines.push(`${modifier.pitMistakeChanceDelta > 0 ? '+' : ''}${modifier.pitMistakeChanceDelta}% pit mistake chance`);
        if (modifier.moraleDelta) lines.push(`${modifier.moraleDelta > 0 ? '+' : ''}${modifier.moraleDelta}% morale`);
        if (modifier.reputationDelta) lines.push(`${modifier.reputationDelta > 0 ? '+' : ''}${modifier.reputationDelta} reputation`);
        if (modifier.budgetDelta) lines.push(`${modifier.budgetDelta >= 0 ? '+' : ''}$${(modifier.budgetDelta / 1_000_000).toFixed(2)}M budget`);
        if (modifier.confidenceDelta) lines.push(`${modifier.confidenceDelta > 0 ? '+' : ''}${modifier.confidenceDelta}% confidence`);
        return lines;
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
                    {(event || pendingImpact || activeImpact) && (
                        <div className="space-y-3 mb-6">
                            {event && (
                                <div className="bg-indigo-900/50 border border-indigo-600 rounded-lg p-4 shadow-lg">
                                    <p className="text-xs uppercase font-bold text-indigo-200">Headquarters Event</p>
                                    <h3 className="text-xl font-bold text-white mt-1">{event.title}</h3>
                                    <p className="text-sm text-gray-200 mb-3">{event.description}</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {event.choices.map(choice => (
                                            <div key={choice.id} className="bg-gray-900/60 rounded-md p-3 border border-gray-700">
                                                <div className="flex items-center justify-between mb-1">
                                                    <h4 className="font-semibold text-white text-sm">{choice.label}</h4>
                                                    {choice.risk && (
                                                        <span className="text-xs text-amber-300 font-semibold">{Math.round(choice.risk.probability * 100)}% risk</span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-300 mb-2">{choice.summary}</p>
                                                {choice.risk?.summary && <p className="text-xs text-amber-200">⚠ {choice.risk.summary}</p>}
                                                <button
                                                    onClick={() => onResolveEvent(event.id, choice.id)}
                                                    className="mt-2 w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded"
                                                >
                                                    Apply Choice
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {pendingImpact && (
                                <div className="bg-blue-900/40 border border-blue-700 rounded-lg p-3 text-sm text-blue-100">
                                    <p className="font-semibold">Queued for next race: {pendingImpact.title}</p>
                                    <p className="text-xs text-blue-200">{pendingImpact.summary}</p>
                                </div>
                            )}
                            {activeImpact && (
                                <div className="bg-emerald-900/40 border border-emerald-700 rounded-lg p-3 text-sm text-emerald-100">
                                    <p className="font-semibold">Active this weekend: {activeImpact.title}</p>
                                    <p className="text-xs text-emerald-200">{activeImpact.summary}</p>
                                </div>
                            )}
                        </div>
                    )}
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
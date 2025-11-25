import React, { useState, useMemo } from 'react';
import { TeamPersonnel, PersonnelChangeEvent, TeamFinances, HeadOfTechnical, TeamPrincipal, AffiliateDriver, AffiliateChangeEvent } from '../types';
import { AVAILABLE_STAFF_POOL, AFFILIATE_CANDIDATES } from '../constants';

interface PersonnelScreenProps {
  season: number;
  personnel: TeamPersonnel[];
  log: PersonnelChangeEvent[];
  affiliateLog: AffiliateChangeEvent[];
  affiliateCandidates: AffiliateDriver[];
  onProceed: (newPlayerPersonnel: TeamPersonnel) => void;
  onSelectTeam: (teamName: string) => void;
  playerTeam: string;
  teamFinances: TeamFinances[];
}

const getEventTypeColor = (type: PersonnelChangeEvent['type']) => {
    switch(type) {
        case 'POACH': return 'border-l-4 border-red-500';
        case 'HIRE': return 'border-l-4 border-green-500';
        case 'FIRE': return 'border-l-4 border-orange-500';
        default: return 'border-l-4 border-gray-600';
    }
}

const TraitPill: React.FC<{ trait: string }> = ({ trait }) => (
    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-600 text-white">{trait}</span>
);

const StaffCard: React.FC<{ person: TeamPrincipal | HeadOfTechnical, role: string, onAction?: () => void, actionLabel?: string, actionColor?: string }> = ({ person, role, onAction, actionLabel, actionColor }) => (
    <div className="bg-gray-800 p-3 rounded-md">
        <div className="flex justify-between items-start">
            <div>
                <p className="font-bold text-white">{person.name}</p>
                <p className="text-xs text-gray-400">{role}</p>
            </div>
            {onAction && actionLabel && (
                <button 
                    onClick={onAction} 
                    className={`text-xs font-semibold py-1 px-3 rounded-md transition-colors ${actionColor || 'bg-red-600 hover:bg-red-700'}`}
                >
                    {actionLabel}
                </button>
            )}
        </div>
        <div className="mt-2 flex gap-4">
             <TraitPill trait={person.trait} />
             <div className="text-xs text-gray-400">
                {('negotiation' in person) ? `NEG: ${person.negotiation} / FIN: ${person.financialAcumen} / LED: ${person.leadership}` : `R&D: ${person.rdConversion} / INN: ${person.innovation}`}
             </div>
        </div>
    </div>
);

const PersonnelScreen: React.FC<PersonnelScreenProps> = ({ season, personnel, log, onProceed, playerTeam, affiliateLog, affiliateCandidates: initialAffiliateCandidates }) => {
    
    const initialPlayerPersonnel = useMemo(() => personnel.find(p => p.teamName === playerTeam)!, [personnel, playerTeam]);
    const [playerPersonnel, setPlayerPersonnel] = useState<TeamPersonnel>(JSON.parse(JSON.stringify(initialPlayerPersonnel)));

    const [availableStaff, setAvailableStaff] = useState(() => {
        const employedTPs = new Set(personnel.map(p => p.teamPrincipal?.name).filter(Boolean));
        const employedHTs = new Set(personnel.map(p => p.headOfTechnical?.name).filter(Boolean));
        return {
            teamPrincipals: AVAILABLE_STAFF_POOL.teamPrincipals.filter(p => !employedTPs.has(p.name)),
            headsOfTechnical: AVAILABLE_STAFF_POOL.headsOfTechnical.filter(p => !employedHTs.has(p.name)),
        }
    });
    
    const [affiliateCandidates, setAffiliateCandidates] = useState(initialAffiliateCandidates);

    const handleFire = (role: 'tp' | 'ht') => {
        const currentPerson = role === 'tp' ? playerPersonnel.teamPrincipal : playerPersonnel.headOfTechnical;
        if (!currentPerson) return;

        setPlayerPersonnel(prev => ({
            ...prev,
            teamPrincipal: role === 'tp' ? (null as any) : prev.teamPrincipal,
            headOfTechnical: role === 'ht' ? (null as any) : prev.headOfTechnical,
        }));

        if (role === 'tp') {
            setAvailableStaff(prev => ({...prev, teamPrincipals: [...prev.teamPrincipals, currentPerson as TeamPrincipal]}));
        } else {
            setAvailableStaff(prev => ({...prev, headsOfTechnical: [...prev.headsOfTechnical, currentPerson as HeadOfTechnical]}));
        }
    };
    
    const handleHire = (person: TeamPrincipal | HeadOfTechnical, role: 'tp' | 'ht') => {
        setPlayerPersonnel(prev => ({
            ...prev,
            teamPrincipal: role === 'tp' ? person as TeamPrincipal : prev.teamPrincipal,
            headOfTechnical: role === 'ht' ? person as HeadOfTechnical : prev.headOfTechnical,
        }));
         if (role === 'tp') {
            setAvailableStaff(prev => ({...prev, teamPrincipals: prev.teamPrincipals.filter(p => p.name !== person.name)}));
        } else {
            setAvailableStaff(prev => ({...prev, headsOfTechnical: prev.headsOfTechnical.filter(p => p.name !== person.name)}));
        }
    };
    
    const handleSignAffiliate = (affiliate: AffiliateDriver) => {
        if (playerPersonnel.affiliateDriver) return;
        setPlayerPersonnel(prev => ({ ...prev, affiliateDriver: affiliate }));
        setAffiliateCandidates(prev => prev.filter(c => c.name !== affiliate.name));
    };

    const handleDropAffiliate = () => {
        if (!playerPersonnel.affiliateDriver) return;
        const dropped = playerPersonnel.affiliateDriver;
        setPlayerPersonnel(prev => ({ ...prev, affiliateDriver: null }));
        setAffiliateCandidates(prev => [...prev, dropped]);
    };

    return (
        <div className="w-full max-w-7xl bg-gray-800 p-6 rounded-lg shadow-2xl flex flex-col items-center animate-fade-in">
            <h2 className="text-4xl font-bold mb-1 text-white tracking-widest">{season} OFF-SEASON</h2>
            <p className="text-lg text-gray-400 mb-4">Phase 4: Personnel Management</p>

            <div className="w-full grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
                <div className="lg:col-span-3 bg-gray-900/50 p-4 rounded-lg">
                    <h3 className="text-2xl font-bold mb-4 text-white">Your Management Team</h3>
                    <div className="space-y-3 mb-6">
                        {playerPersonnel.teamPrincipal ? (
                            <StaffCard person={playerPersonnel.teamPrincipal} role="Team Principal" onAction={() => handleFire('tp')} actionLabel="Fire" />
                        ) : (
                            <div className="bg-gray-800 p-3 rounded-md text-center text-gray-500 italic">Team Principal position vacant.</div>
                        )}
                         {playerPersonnel.headOfTechnical ? (
                            <StaffCard person={playerPersonnel.headOfTechnical} role="Head of Technical" onAction={() => handleFire('ht')} actionLabel="Fire" />
                        ) : (
                            <div className="bg-gray-800 p-3 rounded-md text-center text-gray-500 italic">Head of Technical position vacant.</div>
                        )}
                    </div>
                    
                    <h3 className="text-2xl font-bold mb-4 text-white">Available Staff</h3>
                     <div className="overflow-y-auto space-y-3" style={{ maxHeight: '35vh' }}>
                        {!playerPersonnel.teamPrincipal && availableStaff.teamPrincipals.map(tp => (
                           <StaffCard key={tp.name} person={tp} role="Team Principal" onAction={() => handleHire(tp, 'tp')} actionLabel="Hire" actionColor="bg-green-600 hover:bg-green-700" />
                        ))}
                         {!playerPersonnel.headOfTechnical && availableStaff.headsOfTechnical.map(ht => (
                           <StaffCard key={ht.name} person={ht} role="Head of Technical" onAction={() => handleHire(ht, 'ht')} actionLabel="Hire" actionColor="bg-green-600 hover:bg-green-700" />
                        ))}
                     </div>
                </div>

                <div className="lg:col-span-2 bg-gray-900/50 p-4 rounded-lg flex flex-col">
                    <h3 className="text-2xl font-bold mb-4 text-white">AI Market Events</h3>
                    <div className="overflow-y-auto flex-grow space-y-3" style={{ maxHeight: '60vh' }}>
                        {log.length === 0 ? (
                            <p className="text-gray-400 text-center mt-8">The market waits for your move...</p>
                        ) : (
                            [...log].reverse().map((event, index) => (
                                <div key={index} className={`bg-gray-800 p-3 rounded-md ${getEventTypeColor(event.type)}`}>
                                    <p className="font-bold text-white">{event.team}</p>
                                    <p className="text-sm mt-1">
                                       <span className="text-gray-300">{event.newPerson}</span> {event.type === 'FIRE' ? 'has been fired from their role as' : 'is the new'} {event.role}.
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

             {/* Affiliate Program */}
            <div className="w-full bg-gray-900/50 p-4 rounded-lg mb-6">
                <h3 className="text-2xl font-bold mb-4 text-white">Affiliate Driver Program</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                         <h4 className="text-lg font-semibold text-gray-300 mb-2">Your Affiliate Driver</h4>
                         {playerPersonnel.affiliateDriver ? (
                            <div className="bg-gray-800 p-3 rounded-md">
                                <p className="font-bold text-white">{playerPersonnel.affiliateDriver.name}</p>
                                <p className="text-xs text-gray-400">Skill: {playerPersonnel.affiliateDriver.skill} | Potential: {playerPersonnel.affiliateDriver.potential}</p>
                                <button onClick={handleDropAffiliate} className="w-full mt-2 text-xs bg-red-600 hover:bg-red-700 font-semibold py-1 px-2 rounded">Drop Driver</button>
                            </div>
                         ) : (
                            <div className="bg-gray-800 p-3 rounded-md text-center text-gray-500 italic h-full flex items-center justify-center">No affiliate driver signed.</div>
                         )}
                    </div>
                    <div className="overflow-y-auto space-y-2" style={{ maxHeight: '25vh' }}>
                        <h4 className="text-lg font-semibold text-gray-300 mb-2">Available Prospects</h4>
                        {affiliateCandidates.map(c => (
                            <div key={c.name} className="bg-gray-700 p-2 rounded-md flex justify-between items-center">
                                <div>
                                    <p className="font-semibold text-sm">{c.name}</p>
                                    <p className="text-xs text-gray-400">Skill: {c.skill} | Potential: {c.potential}</p>
                                </div>
                                <button onClick={() => handleSignAffiliate(c)} disabled={!!playerPersonnel.affiliateDriver} className="text-xs bg-green-600 hover:bg-green-700 font-semibold py-1 px-3 rounded-md disabled:bg-gray-600 disabled:cursor-not-allowed">Sign</button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <button
                onClick={() => onProceed(playerPersonnel as TeamPersonnel)}
                disabled={!playerPersonnel.teamPrincipal || !playerPersonnel.headOfTechnical}
                className="w-full max-w-md py-4 px-8 bg-red-600 hover:bg-red-700 text-white font-bold text-xl rounded-lg transition duration-300 ease-in-out transform hover:scale-105 disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
                Confirm Personnel & Proceed
            </button>
        </div>
    );
};

export default PersonnelScreen;

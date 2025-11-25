import { TeamPersonnel, PersonnelChangeEvent, HeadOfTechnical, TeamPrincipal, TeamFinances } from '../types';
import { TeamDebrief } from './postSeasonService';
// FIX: Corrected import path for constants.
import { AVAILABLE_STAFF_POOL, TEAM_EXPECTATIONS } from '../constants';


export const runStaffingMarket = (
    currentPersonnel: TeamPersonnel[],
    teamDebriefs: TeamDebrief[],
    teamFinances: TeamFinances[],
    playerTeamName?: string
): { newPersonnel: TeamPersonnel[], log: PersonnelChangeEvent[] } => {
    
    let newPersonnel = JSON.parse(JSON.stringify(currentPersonnel)) as TeamPersonnel[];
    const log: PersonnelChangeEvent[] = [];
    
    // Create a dynamic pool of available staff for this off-season, filtering out anyone currently employed.
    // FIX: Add null-safe access to prevent errors if teamPrincipal or headOfTechnical is null.
    let availableTPs = [...AVAILABLE_STAFF_POOL.teamPrincipals].filter(p => !newPersonnel.some(cp => cp.teamPrincipal?.name === p.name));
    let availableHTs = [...AVAILABLE_STAFF_POOL.headsOfTechnical].filter(p => !newPersonnel.some(cp => cp.headOfTechnical?.name === p.name));
    
    const teamsToProcess = teamDebriefs.filter(t => t.teamName !== playerTeamName).sort((a,b) => b.tpr - a.tpr);

    // --- Phase 1: Firing based on underperformance ---
    teamsToProcess.forEach(teamDebrief => {
        const teamExpectation = TEAM_EXPECTATIONS[teamDebrief.teamName] || teamDebrief.position;
        const performanceDelta = teamExpectation - teamDebrief.position; // Positive is good
        
        let fireChance = 0.05;
        if (performanceDelta < -3) fireChance = 0.6;
        else if (performanceDelta < -1) fireChance = 0.3;
        
        if (Math.random() < fireChance) {
            const team = newPersonnel.find(p => p.teamName === teamDebrief.teamName)!;
            const roleToFire = Math.random() < 0.6 ? 'HT' : 'TP';

            if (roleToFire === 'HT' && team.headOfTechnical) {
                const firedPerson = team.headOfTechnical;
                availableHTs.push(firedPerson);
                (team as any).headOfTechnical = null; // Vacate position
                log.push({ type: 'FIRE', team: team.teamName, role: 'Head of Technical', oldPerson: firedPerson.name, newPerson: 'Position Vacant' });
            } else if (roleToFire === 'TP' && team.teamPrincipal) {
                const firedPerson = team.teamPrincipal;
                availableTPs.push(firedPerson);
                (team as any).teamPrincipal = null;
                log.push({ type: 'FIRE', team: team.teamName, role: 'Team Principal', oldPerson: firedPerson.name, newPerson: 'Position Vacant' });
            }
        }
    });

    // --- Phase 2: Poaching by top teams ---
    teamsToProcess.forEach(poachingTeam => {
        const poachChance = (poachingTeam.tpr - 80) / 100;
        if (Math.random() < poachChance) {
            const potentialTargets = newPersonnel
                .filter(p => p.teamName !== poachingTeam.teamName && p.teamName !== playerTeamName && p.headOfTechnical)
                .map(p => ({ personnel: p, debrief: teamDebriefs.find(d => d.teamName === p.teamName)! }))
                .filter(({ debrief }) => debrief.tpr < poachingTeam.tpr);

            if (potentialTargets.length > 0) {
                // FIX: Add null-safe access for headOfTechnical properties
                const target = potentialTargets.sort((a, b) => ((b.personnel.headOfTechnical?.innovation || 0) + (b.personnel.headOfTechnical?.rdConversion || 0)) - ((a.personnel.headOfTechnical?.innovation || 0) + (a.personnel.headOfTechnical?.rdConversion || 0)))[0];
                const poacher = newPersonnel.find(p => p.teamName === poachingTeam.teamName)!;
                
                // FIX: Add null checks to prevent errors if personnel are null.
                if (!target.personnel.headOfTechnical || !poacher.teamPrincipal) return;

                const targetHT = target.personnel.headOfTechnical;
                const poacherTP = poacher.teamPrincipal;
                const negotiationSuccess = 0.4 + (poacherTP.negotiation - 15) * 0.05 + (poachingTeam.tpr - target.debrief.tpr) * 0.01;

                if (Math.random() < negotiationSuccess) {
                    const oldPersonAtPoacher = poacher.headOfTechnical;
                    poacher.headOfTechnical = targetHT;
                    if (oldPersonAtPoacher) availableHTs.push(oldPersonAtPoacher);

                    (target.personnel as any).headOfTechnical = null;

                    log.push({ type: 'POACH', team: poachingTeam.teamName, role: 'Head of Technical', newPerson: targetHT.name, oldPerson: oldPersonAtPoacher?.name, poachedFrom: target.personnel.teamName });
                }
            }
        }
    });

    // --- Phase 3: Hiring for vacant positions ---
    teamsToProcess.forEach(teamDebrief => {
        const team = newPersonnel.find(p => p.teamName === teamDebrief.teamName)!;

        const hireForRole = (role: 'TP' | 'HT') => {
            const availablePool = role === 'TP' ? availableTPs : availableHTs;
            if (availablePool.length === 0) return;

            const bestCandidate = [...availablePool].sort((a, b) => {
                if (role === 'TP') {
                    return ((b as TeamPrincipal).leadership * 1.2 + (b as TeamPrincipal).financialAcumen) - ((a as TeamPrincipal).leadership * 1.2 + (a as TeamPrincipal).financialAcumen);
                } else {
                    return ((b as HeadOfTechnical).innovation * 1.2 + (b as HeadOfTechnical).rdConversion) - ((a as HeadOfTechnical).innovation * 1.2 + (a as HeadOfTechnical).rdConversion);
                }
            })[0];
            
            if (role === 'TP') {
                team.teamPrincipal = bestCandidate as TeamPrincipal;
                availableTPs = availableTPs.filter(p => p.name !== bestCandidate.name);
            } else {
                team.headOfTechnical = bestCandidate as HeadOfTechnical;
                availableHTs = availableHTs.filter(p => p.name !== bestCandidate.name);
            }
            log.push({ type: 'HIRE', team: team.teamName, role: role === 'TP' ? 'Team Principal' : 'Head of Technical', newPerson: bestCandidate.name });
        };
        
        if (!team.teamPrincipal) hireForRole('TP');
        if (!team.headOfTechnical) hireForRole('HT');
    });

    // --- Phase 4: Staff Training from allocated budget ---
    type NumericTeamPrincipalSkills = 'negotiation' | 'financialAcumen' | 'leadership';
    type NumericHeadOfTechnicalSkills = 'rdConversion' | 'innovation';

    newPersonnel.forEach(p => {
        if (p.teamName === playerTeamName) return;

        const finance = teamFinances.find(f => f.teamName === p.teamName);
        if (!finance || !finance.personnelInvestment) return;

        const trainingPoints = Math.floor(finance.personnelInvestment / 1_000_000);
        for (let i = 0; i < trainingPoints; i++) {
            if (Math.random() < 0.25) {
                if(Math.random() < 0.5 && p.teamPrincipal) {
                    const skills: NumericTeamPrincipalSkills[] = ['negotiation', 'financialAcumen', 'leadership'];
                    // FIX: Add null check for p.teamPrincipal before accessing properties
                    const weakestSkill = skills.sort((a,b) => p.teamPrincipal![a] - p.teamPrincipal![b])[0];
                    if (p.teamPrincipal[weakestSkill] < 20) p.teamPrincipal[weakestSkill] += 1;
                } else if (p.headOfTechnical) {
                    const skills: NumericHeadOfTechnicalSkills[] = ['rdConversion', 'innovation'];
                     // FIX: Add null check for p.headOfTechnical before accessing properties
                    const weakestSkill = skills.sort((a,b) => p.headOfTechnical![a] - p.headOfTechnical![b])[0];
                     if (p.headOfTechnical[weakestSkill] < 20) p.headOfTechnical[weakestSkill] += 1;
                }
            }
        }
    });

    return { newPersonnel, log };
};
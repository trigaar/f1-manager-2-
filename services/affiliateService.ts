
import { TeamPersonnel, AffiliateDriver, AffiliateChangeEvent, TeamFinances } from '../types';
import { TeamDebrief } from './postSeasonService';

export const runAffiliateProgression = (
    currentPersonnel: TeamPersonnel[],
    teamFinances: TeamFinances[]
): { updatedPersonnel: TeamPersonnel[], log: AffiliateChangeEvent[] } => {
    
    const updatedPersonnel = JSON.parse(JSON.stringify(currentPersonnel)) as TeamPersonnel[];
    const log: AffiliateChangeEvent[] = [];

    updatedPersonnel.forEach(team => {
        if (!team.affiliateDriver) return;

        const finance = teamFinances.find(f => f.teamName === team.teamName);
        if (!finance) return;

        const investment = finance.personnelInvestment;
        const baseGain = (team.affiliateDriver.potential - team.affiliateDriver.skill) * (0.05 + Math.random() * 0.05);
        const investmentBonus = Math.log1p(investment / 1_000_000) * 0.5;
        
        const totalGain = Math.round(baseGain + investmentBonus);
        
        if (totalGain > 0 && team.affiliateDriver.skill < team.affiliateDriver.potential) {
            const oldSkill = team.affiliateDriver.skill;
            team.affiliateDriver.skill = Math.min(team.affiliateDriver.potential, oldSkill + totalGain);
            log.push({
                type: 'PROGRESS',
                teamName: team.teamName,
                driverName: team.affiliateDriver.name,
                skillChange: team.affiliateDriver.skill - oldSkill,
                newSkill: team.affiliateDriver.skill
            });
        }
    });

    return { updatedPersonnel, log };
};

export const runAIAffiliateSignings = (
    currentPersonnel: TeamPersonnel[],
    availableCandidates: AffiliateDriver[],
    teamDebriefs: TeamDebrief[],
    playerTeamName?: string
): { finalPersonnel: TeamPersonnel[], log: AffiliateChangeEvent[], usedCandidates: string[] } => {
    
    let finalPersonnel = JSON.parse(JSON.stringify(currentPersonnel)) as TeamPersonnel[];
    const log: AffiliateChangeEvent[] = [];
    let candidates = [...availableCandidates];
    const usedCandidates: string[] = [];

    const teamsToProcess = teamDebriefs.filter(t => t.teamName !== playerTeamName);

    teamsToProcess.forEach(teamDebrief => {
        const team = finalPersonnel.find(p => p.teamName === teamDebrief.teamName)!;
        
        if (team.affiliateDriver) {
            const shouldDrop = (team.affiliateDriver.skill >= team.affiliateDriver.potential) ||
                               (team.affiliateDriver.potential < 75 && teamDebrief.tpr > 80);
            if (shouldDrop && Math.random() < 0.6) {
                const droppedDriver = team.affiliateDriver;
                log.push({ type: 'DROP', teamName: team.teamName, driverName: droppedDriver.name });
                candidates.push(droppedDriver);
                team.affiliateDriver = null;
            }
        }

        if (!team.affiliateDriver && candidates.length > 0) {
            const shouldSign = teamDebrief.tpr > 65;
            if (shouldSign && Math.random() < 0.8) {
                const isTopTeam = teamDebrief.tpr > 85;
                const bestCandidate = candidates.sort((a, b) => {
                    const scoreA = isTopTeam ? a.potential + (a.skill * 0.5) : a.skill + (a.potential * 0.5);
                    const scoreB = isTopTeam ? b.potential + (b.skill * 0.5) : b.skill + (b.potential * 0.5);
                    return scoreB - scoreA;
                })[0];

                team.affiliateDriver = bestCandidate;
                usedCandidates.push(bestCandidate.name);
                log.push({ type: 'SIGN', teamName: team.teamName, driverName: bestCandidate.name });
                candidates = candidates.filter(c => c.name !== bestCandidate.name);
            }
        }
    });

    return { finalPersonnel, log, usedCandidates };
};

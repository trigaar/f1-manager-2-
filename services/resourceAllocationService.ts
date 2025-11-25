

import { TeamFinances, TeamPersonnel, ResourceAllocationEvent } from '../types';
import { TeamDebrief } from './postSeasonService';

export const runResourceAllocation = (
    teamFinances: TeamFinances[],
    personnel: TeamPersonnel[],
    teamDebriefs: TeamDebrief[],
    playerTeamName?: string
): { updatedTeamFinances: TeamFinances[], log: ResourceAllocationEvent[] } => {
    
    const updatedTeamFinances = JSON.parse(JSON.stringify(teamFinances)) as TeamFinances[];
    const log: ResourceAllocationEvent[] = [];

    updatedTeamFinances.forEach(tf => {
        if (tf.teamName === playerTeamName) {
            log.push({
                teamName: tf.teamName,
                teamHexColor: tf.teamHexColor,
                totalBudget: tf.finalBudget,
                allocations: {
                    carDevelopment: tf.carDevelopmentBudget,
                    driverFund: tf.driverAcquisitionFund,
                    personnel: tf.personnelInvestment
                }
            });
            return;
        };

        const teamPersonnel = personnel.find(p => p.teamName === tf.teamName);
        const teamDebrief = teamDebriefs.find(d => d.teamName === tf.teamName);
        if (!teamPersonnel || !teamDebrief || !teamPersonnel.teamPrincipal) return;

        // Base allocation percentages
        let carDevPct = 0.80;
        let driverFundPct = 0.12;
        let personnelPct = 0.08;

        // Modify percentages based on TP personality
        switch(teamPersonnel.teamPrincipal.personality) {
            case 'Visionary':
                personnelPct += 0.07; // Invest in the future
                carDevPct -= 0.07;
                break;
            case 'Pragmatist':
                carDevPct += 0.10; // Focus on the car
                driverFundPct -= 0.05;
                personnelPct -= 0.05;
                break;
            case 'Ruthless Operator':
                driverFundPct += 0.10; // Build a war chest to sign stars
                carDevPct -= 0.05;
                personnelPct -= 0.05;
                break;
            case 'Loyalist':
                // Balanced, but might spend a bit more on staff to keep them
                personnelPct += 0.02;
                carDevPct -= 0.02;
                break;
        }

        // Modify based on team situation (TPR)
        const tprModifier = (teamDebrief.tpr - 75) / 100; // -0.25 to 0.25 for TPR 50-100
        if (tprModifier > 0) { // High-performing team
            driverFundPct += tprModifier * 0.2; // More likely to poach
            carDevPct -= tprModifier * 0.2;
        } else { // Low-performing team
            carDevPct -= tprModifier * 0.3; // Desperate for car performance (tprModifier is negative)
            driverFundPct += tprModifier * 0.3;
        }

        // Normalize percentages to ensure they sum to 1
        const totalPct = carDevPct + driverFundPct + personnelPct;
        carDevPct /= totalPct;
        driverFundPct /= totalPct;
        personnelPct /= totalPct;
        
        // Calculate final budget amounts
        const totalBudget = tf.finalBudget;
        tf.carDevelopmentBudget = Math.max(0, totalBudget * carDevPct);
        tf.driverAcquisitionFund = Math.max(0, totalBudget * driverFundPct);
        tf.personnelInvestment = Math.max(0, totalBudget * personnelPct);

        log.push({
            teamName: tf.teamName,
            teamHexColor: tf.teamHexColor,
            totalBudget: totalBudget,
            allocations: {
                carDevelopment: tf.carDevelopmentBudget,
                driverFund: tf.driverAcquisitionFund,
                personnel: tf.personnelInvestment
            }
        });
    });

    return { updatedTeamFinances, log };
};

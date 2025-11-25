

import { ConstructorStanding, SeasonHistoryEntry, TeamFinances, InitialDriver } from '../types';
import { FINANCIAL_CONSTANTS, CARS, BASE_SPONSORSHIP_INCOME } from '../constants';
import { TeamDebrief } from './postSeasonService';

export const calculateTeamFinances = (
    finalConstructorStandings: ConstructorStanding[],
    seasonHistory: SeasonHistoryEntry[],
    roster: InitialDriver[],
    teamDebriefs: TeamDebrief[]
): TeamFinances[] => {
    // 1. Calculate Total Prize Pool
    const variation = 1 + (Math.random() * 2 - 1) * FINANCIAL_CONSTANTS.PRIZE_POOL_VARIATION;
    const totalPrizePool = FINANCIAL_CONSTANTS.PRIZE_POOL_BASELINE * variation;

    let remainingPool = totalPrizePool;
    const teamFinances: { [teamName: string]: TeamFinances } = {};
    finalConstructorStandings.forEach(c => {
        teamFinances[c.teamName] = {
            teamName: c.teamName,
            teamHexColor: c.teamHexColor,
            prizeMoney: { total: 0, lstBonus: 0, ccbBonus: 0, performancePayout: 0 },
            sponsorshipIncome: 0,
            driverSalaries: 0,
            finalBudget: 0,
            carDevelopmentBudget: 0,
            personnelInvestment: 0,
            driverAcquisitionFund: 0,
        };
    });

    // 2. Tier 1: LST Bonus
    const lstTeamEntry = Object.values(CARS).find(car => car.isLST);
    if (lstTeamEntry) {
        const lstTeamName = lstTeamEntry.teamName;
        let bonusPercentage = FINANCIAL_CONSTANTS.LST_BONUS_PERCENTAGE;
        if (totalPrizePool > FINANCIAL_CONSTANTS.LST_BONUS_ESCALATION_THRESHOLD) {
            bonusPercentage = FINANCIAL_CONSTANTS.LST_BONUS_ESCALATION_PERCENTAGE;
        }
        const lstBonus = totalPrizePool * bonusPercentage;
        if (teamFinances[lstTeamName]) {
            teamFinances[lstTeamName].prizeMoney.lstBonus = lstBonus;
        }
        remainingPool -= lstBonus;
    }

    // 3. Tier 2: CCB Bonus
    const ccbPool = totalPrizePool * FINANCIAL_CONSTANTS.CCB_POOL_PERCENTAGE;
    remainingPool -= ccbPool;
    
    const lastTenSeasons = [
        { year: 2025, constructorStandings: finalConstructorStandings },
        ...seasonHistory
    ].slice(0, 10);

    const teamCCBPoints = new Map<string, number>();
    let totalCCBPoints = 0;

    lastTenSeasons.forEach((season, index) => {
        const seasonWeight = 10 - index; // Most recent season gets 10 points, oldest gets 1
        const topThree = season.constructorStandings.slice(0, 3);
        topThree.forEach(team => {
            const currentPoints = teamCCBPoints.get(team.teamName) || 0;
            teamCCBPoints.set(team.teamName, currentPoints + seasonWeight);
            totalCCBPoints += seasonWeight;
        });
    });

    if (totalCCBPoints > 0) {
        teamCCBPoints.forEach((points, teamName) => {
            const share = points / totalCCBPoints;
            const ccbBonus = ccbPool * share;
            if(teamFinances[teamName]) {
               teamFinances[teamName].prizeMoney.ccbBonus = ccbBonus;
            }
        });
    }

    // 4. Tier 3: Performance-Based Distribution
    finalConstructorStandings.forEach(team => {
        const position = team.position as keyof typeof FINANCIAL_CONSTANTS.TIER_3_PAYOUT_PERCENTAGES;
        const payoutPercentage = FINANCIAL_CONSTANTS.TIER_3_PAYOUT_PERCENTAGES[position] || 0;
        const performancePayout = remainingPool * payoutPercentage;
        if (teamFinances[team.teamName]) {
            teamFinances[team.teamName].prizeMoney.performancePayout = performancePayout;
        }
    });

    // 5. Final Calculation (including Sponsorships, Salaries, and Final Budget)
    Object.values(teamFinances).forEach(tf => {
        tf.prizeMoney.total = tf.prizeMoney.lstBonus + tf.prizeMoney.ccbBonus + tf.prizeMoney.performancePayout;
        
        // Calculate dynamic sponsorship income
        const baseSponsorship = BASE_SPONSORSHIP_INCOME[tf.teamName] || 50_000_000;
        const teamDebrief = teamDebriefs.find(d => d.teamName === tf.teamName);
        const tpr = teamDebrief ? teamDebrief.tpr : 75;
        // Performance modifier: +-20% based on TPR relative to a baseline of 75
        const sponsorshipModifier = (tpr - 75) / 100 * 0.4; 
        tf.sponsorshipIncome = baseSponsorship * (1 + sponsorshipModifier);
        
        const teamDrivers = roster.filter(d => d.car.teamName === tf.teamName && d.status === 'Active');
        tf.driverSalaries = teamDrivers.reduce((sum, driver) => sum + driver.salary, 0);
        
        tf.finalBudget = (tf.prizeMoney.total + tf.sponsorshipIncome) - tf.driverSalaries;
    });

    return Object.values(teamFinances).sort((a,b) => b.finalBudget - a.finalBudget);
};

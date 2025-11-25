
import { DriverStanding, ConstructorStanding, SeasonHistoryEntry, InitialDriver } from '../types';
import { TEAM_EXPECTATIONS, LEGACY_TEAMS } from '../constants';

export interface TeamDebrief extends ConstructorStanding {
    tpr: number;
    breakdown: {
        posScore: number;
        expectationScore: number;
        historyScore: number;
        legacyScore: number;
    };
    drivers?: DriverDebrief[];
}

export interface DriverDebrief extends DriverStanding {
    dsv: number;
    breakdown: {
        posScore: number;
        teammateScore: number;
        potentialScore: number;
    };
}

const getWCCPositionScore = (pos: number) => 100 - (pos - 1) * 5;
const getWDCPositionScore = (pos: number) => 100 - (pos - 1) * 2.5;

export const calculateTeamPrestige = (
    finalStandings: ConstructorStanding[],
    history: SeasonHistoryEntry[]
): TeamDebrief[] => {
    return finalStandings.map(team => {
        const pos = team.position;
        const expectedPos = TEAM_EXPECTATIONS[team.teamName] || pos;
        
        const expectationDiff = expectedPos - pos;
        const expectationScore = Math.max(-20, Math.min(20, expectationDiff * 5));

        const teamHistory = history
            .map(h => h.constructorStandings.find(s => s.teamName === team.teamName))
            .filter(Boolean) as ConstructorStanding[];
        
        let historyScore = 0;
        if(teamHistory.length > 0) {
            const lastThreeYears = teamHistory.slice(-3);
            const avgPos = lastThreeYears.reduce((sum, h) => sum + h.position, 0) / lastThreeYears.length;
            const historyDiff = avgPos - pos;
            historyScore = Math.max(-15, Math.min(15, historyDiff * 3));
        }

        const legacyScore = LEGACY_TEAMS[team.teamName] || 0;

        const posScore = getWCCPositionScore(pos);

        const tpr = (posScore * 0.5) + (expectationScore * 0.2) + (historyScore * 0.2) + (legacyScore * 0.1);

        return {
            ...team,
            tpr: Math.round(tpr),
            breakdown: {
                posScore: Math.round(posScore * 0.5),
                expectationScore: Math.round(expectationScore * 0.2),
                historyScore: Math.round(historyScore * 0.2),
                legacyScore: Math.round(legacyScore * 0.1),
            },
        };
    });
};

export const calculateDriverStockValue = (finalStandings: DriverStanding[], currentRoster: InitialDriver[]): DriverDebrief[] => {
    const teammateMap = new Map<number, InitialDriver | undefined>();
    const teamMap = new Map<string, InitialDriver[]>();
    currentRoster.forEach(d => {
        const team = teamMap.get(d.car.teamName) || [];
        team.push(d);
        teamMap.set(d.car.teamName, team);
    });
    currentRoster.forEach(d => {
        const teammates = teamMap.get(d.car.teamName) || [];
        teammateMap.set(d.id, teammates.find(t => t.id !== d.id));
    });

    return finalStandings.map(driver => {
        const initialDriverData = currentRoster.find(d => d.id === driver.driverId);
        if (!initialDriverData) {
             console.warn(`Could not find initial data for driverId: ${driver.driverId}`);
             return { ...driver, dsv: 0, breakdown: { posScore: 0, teammateScore: 0, potentialScore: 0 }};
        }

        const pos = driver.position;

        const teammate = teammateMap.get(driver.driverId);
        let teammateScore = 0;
        if (teammate) {
            const teammateStanding = finalStandings.find(s => s.driverId === teammate.id);
            if (teammateStanding) {
                const totalPoints = driver.points + teammateStanding.points;
                if(totalPoints > 0) {
                   const pointShare = driver.points / totalPoints;
                   teammateScore = (pointShare - 0.5) * 50;
                }
            }
        }
        
        let potentialScore = (initialDriverData.driverSkills.potential - 50) * 0.8;
        potentialScore -= Math.max(0, initialDriverData.age - 30) * 1.5;
        potentialScore = Math.max(0, Math.min(40, potentialScore));


        const posScore = getWDCPositionScore(pos);

        const dsv = (posScore * 0.8) + (teammateScore * 0.1) + (potentialScore * 0.1);

        return {
            ...driver,
            dsv: Math.round(dsv),
            breakdown: {
                posScore: Math.round(posScore * 0.8),
                teammateScore: Math.round(teammateScore * 0.1),
                potentialScore: Math.round(potentialScore * 0.1),
            }
        }
    });
};

export const calculateMarketVolatilityIndex = (
    driverStandings: DriverDebrief[],
    constructorStandings: ConstructorStanding[],
    currentRoster: InitialDriver[]
): number => {
    let mvi = 0;

    const expiringDrivers = currentRoster.filter(d => d.contractExpiresIn <= 1);
    mvi += expiringDrivers.length * 3;

    const topExpiringDrivers = expiringDrivers
      .map(d => driverStandings.find(s => s.driverId === d.id))
      .filter(Boolean) as DriverDebrief[];
    
    const avgDsv = topExpiringDrivers.reduce((sum, d) => sum + d.dsv, 0) / (topExpiringDrivers.length || 1);
    mvi += avgDsv / 5;

    const perfShifts = constructorStandings.reduce((sum, team) => {
        const expected = TEAM_EXPECTATIONS[team.teamName] || team.position;
        return sum + Math.abs(team.position - expected);
    }, 0);

    mvi += perfShifts * 1.5;

    return Math.min(100, Math.round(mvi * 1.5));
};

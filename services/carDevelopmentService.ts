

import { TeamFinances, TeamPersonnel, Car, CarDevelopmentResult, CarAttribute } from '../types';

const RD_CONVERSION_RATE = 1 / 25000; // 1 DP per $25k baseline
const OFF_SEASON_DP_MULTIPLIER = 1.75; // Global boost so every team gains more headroom to improve
const DP_TO_ATTRIBUTE_RATE = 1000; // Base cost for 1 point increase
const CAR_ATTRIBUTES: CarAttribute[] = ['highSpeedCornering', 'mediumSpeedCornering', 'lowSpeedCornering', 'powerSensitivity', 'reliability', 'tyreWearFactor'];


export const runCarDevelopment = (
    teamFinances: TeamFinances[],
    personnel: TeamPersonnel[],
    currentCarRatings: { [key: string]: Car },
    playerTeamName?: string
): { newCarRatings: { [key: string]: Car }, developmentLog: CarDevelopmentResult[] } => {
    
    let newCarRatings = JSON.parse(JSON.stringify(currentCarRatings)) as { [key: string]: Car };
    const developmentLog: CarDevelopmentResult[] = [];

    // Calculate grid averages for strategic DP allocation
    const gridAverages: Record<CarAttribute, number> = {
        highSpeedCornering: 0, mediumSpeedCornering: 0, lowSpeedCornering: 0, powerSensitivity: 0, reliability: 0, tyreWearFactor: 0, overallPace: 0,
    };
    const carCount = Object.values(newCarRatings).length;
    for(const attr of CAR_ATTRIBUTES) {
        gridAverages[attr] = Object.values(newCarRatings).reduce((sum, car) => sum + car[attr], 0) / carCount;
    }


    teamFinances.forEach(teamFinance => {
        if (teamFinance.teamName === playerTeamName) return;

        const teamPersonnel = personnel.find(p => p.teamName === teamFinance.teamName);
        const teamCarKey = Object.keys(newCarRatings).find(key => newCarRatings[key].teamName === teamFinance.teamName);
        if (!teamPersonnel || !teamCarKey) return;
        
        const teamCar = newCarRatings[teamCarKey];
        const result: CarDevelopmentResult = {
            teamName: teamFinance.teamName,
            teamHexColor: teamFinance.teamHexColor,
            devFund: teamFinance.carDevelopmentBudget, // Use specific car dev budget
            devPoints: 0,
            events: [],
            upgrades: [],
            newOverallPace: teamCar.overallPace
        };

        // Step 1 & 2: Apply Efficiency Modifiers to get Effective Budget
        // FIX: Add null-safe access with fallback for team principal
        const financialAcumen = teamPersonnel.teamPrincipal?.financialAcumen || 10;
        const effectiveBudget = result.devFund * (1 + (financialAcumen - 10) * 0.01);

        // Step 3: Convert Budget to Development Points
        // FIX: Add null-safe access with fallback for head of technical
        const rdConversion = teamPersonnel.headOfTechnical?.rdConversion || 15;
        const baseDP = effectiveBudget * (RD_CONVERSION_RATE * (rdConversion / 15)) * OFF_SEASON_DP_MULTIPLIER; // Scale conversion by HoT skill with grid-wide boost
        result.devPoints = Math.round(baseDP);

        // Step 4: Intelligent DP Allocation
        let weakestAttribute: CarAttribute = 'reliability';
        let biggestDeficit = 0;
        for(const attr of CAR_ATTRIBUTES) {
            const deficit = gridAverages[attr] - teamCar[attr];
            if(deficit > biggestDeficit) {
                biggestDeficit = deficit;
                weakestAttribute = attr;
            }
        }
        
        // Balanced allocation with a bonus to the weakest area
        let allocations = {
            aero: 0.45,
            chassis: 0.40,
            powertrain: 0.15,
        };
        
        if (['highSpeedCornering', 'mediumSpeedCornering'].includes(weakestAttribute)) {
            allocations.aero += 0.10;
            allocations.chassis -= 0.05;
            allocations.powertrain -= 0.05;
            result.events.push(`AI Focus: Improving weak Aerodynamics.`);
        } else if (['lowSpeedCornering', 'tyreWearFactor', 'reliability'].includes(weakestAttribute)) {
            allocations.chassis += 0.10;
            allocations.aero -= 0.05;
            allocations.powertrain -= 0.05;
            result.events.push(`AI Focus: Improving weak Chassis/Reliability.`);
        } else { // powerSensitivity
             allocations.powertrain += 0.10;
             allocations.aero -= 0.05;
             allocations.chassis -= 0.05;
             result.events.push(`AI Focus: Improving weak Powertrain.`);
        }

        let aeroDP = result.devPoints * allocations.aero;
        let chassisDP = result.devPoints * allocations.chassis;
        let powertrainDP = result.devPoints * allocations.powertrain;

        // Step 5: Stochastic R&D Events
        // FIX: Add null-safe access with fallback for head of technical
        const innovation = teamPersonnel.headOfTechnical?.innovation || 15;
        if (Math.random() < (innovation - 10) * 0.03) { // 3% chance per point above 10
            if(Math.random() < 0.6) { // Positive event
                aeroDP *= 1.15; // Wind Tunnel Breakthrough
                result.events.push("R&D: Wind Tunnel Breakthrough! (+15% Aero DP)");
            } else { // Negative event
                aeroDP *= 0.80; // Wind Tunnel Correlation Issues
                result.events.push("R&D: Correlation Issues! (-20% Aero DP)");
            }
        }

        // Step 6: Convert final DP to car performance updates with diminishing returns
        const addUpgrade = (attr: CarAttribute, dpSpent: number) => {
             const oldValue = teamCar[attr];
             // Diminishing returns formula: efficiency drops as the attribute approaches a soft cap.
             const efficiency = Math.max(0.1, 1 - Math.pow(oldValue / 105, 3));
             const value = (dpSpent / DP_TO_ATTRIBUTE_RATE) * efficiency;

             const newValue = Math.min(100, parseFloat((oldValue + value).toFixed(2)));
             teamCar[attr] = newValue;
             result.upgrades.push({ attribute: attr, oldValue, newValue });
        }
        
        addUpgrade('highSpeedCornering', aeroDP * 0.6);
        addUpgrade('mediumSpeedCornering', aeroDP * 0.4);
        
        addUpgrade('lowSpeedCornering', chassisDP * 0.5);
        addUpgrade('tyreWearFactor', chassisDP * 0.3);
        addUpgrade('reliability', chassisDP * 0.2);

        addUpgrade('powerSensitivity', powertrainDP);
        
        // Recalculate overall pace
        teamCar.overallPace = Math.round(
            (teamCar.highSpeedCornering + teamCar.mediumSpeedCornering + teamCar.lowSpeedCornering + teamCar.powerSensitivity) / 4
        );
        result.newOverallPace = teamCar.overallPace;

        developmentLog.push(result);
    });

    developmentLog.sort((a,b) => b.newOverallPace - a.newOverallPace);

    return { newCarRatings, developmentLog };
};
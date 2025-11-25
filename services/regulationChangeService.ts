
import { TeamFinances, TeamPersonnel, Car, RegulationEvent, CarAttribute } from '../types';
import { CARS } from '../constants';

// Define a baseline car for the new regulations
const BASE_REGULATION_CAR: Omit<Car, 'teamName' | 'isLST'> = {
    overallPace: 78,
    highSpeedCornering: 78,
    mediumSpeedCornering: 78,
    lowSpeedCornering: 78,
    powerSensitivity: 78,
    reliability: 85, // Regulations often focus on reliability initially
    tyreWearFactor: 80,
};

const ATTRIBUTES_TO_DEVELOP: CarAttribute[] = ['highSpeedCornering', 'mediumSpeedCornering', 'lowSpeedCornering', 'powerSensitivity'];

export const runRegulationChange = (
    teamFinances: TeamFinances[],
    personnel: TeamPersonnel[]
): { newBaseCarRatings: { [key: string]: Car }, regulationLog: RegulationEvent[] } => {
    
    const newBaseCarRatings: { [key: string]: Car } = {};
    const regulationLog: RegulationEvent[] = [];

    const avgFinance = teamFinances.reduce((sum, tf) => sum + tf.prizeMoney.total, 0) / teamFinances.length || 1;

    teamFinances.forEach(tf => {
        const teamPersonnel = personnel.find(p => p.teamName === tf.teamName);
        if (!teamPersonnel || !teamPersonnel.teamPrincipal || !teamPersonnel.headOfTechnical) return;

        // 1. Calculate Adaptation Score
        const financeFactor = (tf.prizeMoney.total / avgFinance) * 30; // Weight: 30
        const personnelFactor = (
            teamPersonnel.teamPrincipal.leadership + 
            teamPersonnel.headOfTechnical.innovation + 
            teamPersonnel.headOfTechnical.rdConversion
        ) / 60 * 50; // Weight: 50
        const randomFactor = (Math.random() * 40) - 20; // Weight: 20, provides +/- 20 points of variance

        const adaptationScore = Math.max(0, Math.min(100, financeFactor + personnelFactor + randomFactor));

        // 2. Generate new car based on score
        const teamKey = Object.keys(CARS).find(k => CARS[k].teamName === tf.teamName)!;
        const oldCar = CARS[teamKey];

        const newCar: Car = {
            teamName: tf.teamName,
            isLST: oldCar ? oldCar.isLST : false,
            ...BASE_REGULATION_CAR
        };
        
        const performanceGain = (adaptationScore - 50) * 0.25; // Each point from 50 is worth 0.25 car points

        ATTRIBUTES_TO_DEVELOP.forEach(attr => {
            newCar[attr] = Math.max(60, Math.min(99, Math.round(BASE_REGULATION_CAR[attr] + performanceGain + (Math.random() * 4 - 2))));
        });
        
        newCar.overallPace = Math.round(ATTRIBUTES_TO_DEVELOP.reduce((sum, attr) => sum + newCar[attr], 0) / ATTRIBUTES_TO_DEVELOP.length);

        // 3. Create Log Entry
        let summary = '';
        if (adaptationScore > 85) summary = "Nailed the new regulations!";
        else if (adaptationScore > 65) summary = "A strong interpretation of the new rules.";
        else if (adaptationScore > 40) summary = "A solid, if unspectacular, start.";
        else if (adaptationScore > 20) summary = "Struggled to adapt to the new concept.";
        else summary = "Completely missed the mark on the new regulations.";

        if(teamKey) {
          newBaseCarRatings[teamKey] = newCar;
        }
        
        regulationLog.push({
            teamName: tf.teamName,
            teamHexColor: tf.teamHexColor,
            adaptationScore: Math.round(adaptationScore),
            summary,
            newBaseCar: newCar,
        });
    });

    regulationLog.sort((a,b) => b.newBaseCar.overallPace - a.newBaseCar.overallPace);

    return { newBaseCarRatings, regulationLog };
}

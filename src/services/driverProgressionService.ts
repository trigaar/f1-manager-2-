
import { InitialDriver, DriverProgressionEvent, DriverSkillChange, DriverSkills, DriverDebrief, TeamDebrief } from '../types';

// FIX: Exclude 'trait' and 'reputation' from the list of skills to progress to prevent type errors in calculations.
const SKILLS_TO_PROGRESS: (keyof Omit<DriverSkills, 'overall' | 'aggressionIndex' | 'incidentProneness' | 'loyalty' | 'potential' | 'reputation' | 'trait'>)[] = [
    'qualifyingPace', 'raceCraft', 'tyreManagement', 'consistency', 'wetWeatherSkill'
];

// Key age points and their corresponding progression/regression modifiers.
const AGE_MODIFIERS: { [age: number]: number } = {
    20: 1.2,  // Peak growth
    24: 0.9,  // Strong growth
    28: 0.6,  // Prime
    32: 0.0,  // Plateau
    36: -0.6, // Gentle decline
    40: -1.2  // Decline
};

// Returns a modifier based on age using linear interpolation for smoother progression.
const getAgeModifier = (age: number): number => {
    const sortedAges = Object.keys(AGE_MODIFIERS).map(Number).sort((a, b) => a - b);
    
    if (age <= sortedAges[0]) return AGE_MODIFIERS[sortedAges[0]];
    if (age >= sortedAges[sortedAges.length - 1]) return AGE_MODIFIERS[sortedAges[sortedAges.length - 1]];

    for (let i = 0; i < sortedAges.length - 1; i++) {
        const lowerAge = sortedAges[i];
        const upperAge = sortedAges[i+1];
        if (age >= lowerAge && age <= upperAge) {
            const lowerMod = AGE_MODIFIERS[lowerAge];
            const upperMod = AGE_MODIFIERS[upperAge];
            const ageRange = upperAge - lowerAge;
            const progressInRange = (age - lowerAge) / ageRange;
            return lowerMod + progressInRange * (upperMod - lowerMod);
        }
    }
    
    return 0; // Fallback
};

// Returns a base change value based on performance (now using DSV).
const getPerformanceFactor = (dsv: number): number => {
    // A DSV of 70 is considered a neutral/solid season.
    // The factor scales, so an 80 DSV is +1, 90 is +2, 60 is -1 etc.
    return (dsv - 70) / 10;
};


export const runDriverProgression = (
    currentRoster: InitialDriver[],
    driverDebriefs: DriverDebrief[],
    teamDebriefs: TeamDebrief[]
): { newRoster: InitialDriver[], log: DriverProgressionEvent[] } => {
    const newRoster = JSON.parse(JSON.stringify(currentRoster)) as InitialDriver[];
    const log: DriverProgressionEvent[] = [];
    
    const driverDebriefMap = new Map(driverDebriefs.map(d => [d.driverId, d]));

    newRoster.forEach(driver => {
        if (driver.status === 'Retired') return;

        let finalChangeFactor = 0;
        const driverDebrief = driverDebriefMap.get(driver.id);
        const dsv = driverDebrief ? driverDebrief.dsv : 60; // Default to a slightly below-average DSV if not found

        // Use average rating just for display as requested by the user.
        let averageRating = 0;
        if (driver.seasonRaceRatings && driver.seasonRaceRatings.length > 0) {
            averageRating = driver.seasonRaceRatings.reduce((a, b) => a + b, 0) / driver.seasonRaceRatings.length;
        }

        if (driver.status === 'Active') {
            const ageModifier = getAgeModifier(driver.age);
            let performanceFactor = getPerformanceFactor(dsv);
            const potentialModifier = (1 + (driver.driverSkills.potential - 85) / 50);

            // --- NEW: Contextual Performance Logic for Young Drivers ---
            const isYoungDriver = driver.age < 26;
            if (isYoungDriver) {
                const teamDebrief = teamDebriefs.find(t => t.teamName === driver.car.teamName);
                const teamTpr = teamDebrief ? teamDebrief.tpr : 75;

                const isTopTeam = teamTpr > 85;
                const isSmallTeam = teamTpr < 75;
                const didWell = dsv > 82;
                const didPoorly = dsv < 68;

                let contextualPerformanceModifier = 1.0;

                if (isTopTeam && didWell) { // Young driver in top team does well -> massive gains
                    contextualPerformanceModifier = 1.5;
                } else if (isSmallTeam && didWell) { // Young driver in small team does well -> huge gains
                    contextualPerformanceModifier = 1.7;
                } else if (isTopTeam && didPoorly) { // Young driver in top team does poorly -> more negative effect
                    contextualPerformanceModifier = 2.0;
                } else if (isSmallTeam && !didWell && !didPoorly) { // Young driver is average in small team -> less negative effect
                    contextualPerformanceModifier = 0.8;
                }
                
                performanceFactor *= contextualPerformanceModifier;
            }
            // --- END NEW Logic ---

            if (ageModifier > 0) { // Growth phase
                finalChangeFactor = performanceFactor * ageModifier * potentialModifier;
            } else {
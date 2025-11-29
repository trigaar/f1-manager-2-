import { InitialDriver, Track, TeamPersonnel, RaceState, PracticeResult, PracticeGrade } from '../types';
import { calculateCarLinkImpact } from './carLinkService';

const getGradeAndModifier = (score: number): { grade: PracticeGrade; modifier: number } => {
    if (score >= 90) return { grade: 'A', modifier: -0.25 };
    if (score >= 80) return { grade: 'B', modifier: -0.10 };
    if (score >= 70) return { grade: 'C', modifier: 0.00 };
    if (score >= 60) return { grade: 'D', modifier: 0.15 };
    if (score >= 50) return { grade: 'E', modifier: 0.30 };
    return { grade: 'F', modifier: 0.50 };
};

const SUMMARIES = {
    A: [
        "A flawless session. The driver is happy with the balance and the team has a clear tyre picture.",
        "Completed the full run plan. The car feels connected and lap times look competitive.",
        "Excellent data collection. The car is in the perfect window for qualifying."
    ],
    B: [
        "A productive session. Most of the run plan was completed and the car balance is strong.",
        "Good progress made on setup. The team has a solid understanding of the tyres for the race.",
        "The driver feels confident in the car, despite some minor balance adjustments needed."
    ],
    C: [
        "A standard session with mixed results. The team gathered useful data but some questions remain.",
        "The run plan was mostly completed, but the driver is still searching for the ideal setup.",
        "Decent pace shown, but the team needs to analyze the data to unlock more performance."
    ],
    D: [
        "A difficult session. The driver is unhappy with the car's balance and consistency is an issue.",
        "Track time was limited due to setup changes taking longer than expected.",
        "The team is on the back foot and will need to make some educated guesses for qualifying."
    ],
    E: [
        "A very troubled session. Lost significant track time due to a recurring reliability issue.",
        "The driver is fighting the car, reporting a lack of grip and predictability.",
        "The team is going into qualifying blind after weather interruptions ruined the run plan."
    ],
    F: [
        "A disastrous session. A crash resulted in major damage and a huge loss of track time.",
        "A major reliability failure meant the car was stuck in the garage for almost the entire session.",
        "The weekend is compromised. The team has almost no data and the driver's confidence is shaken."
    ]
};

export const runPracticeSession = (
    roster: InitialDriver[],
    track: Track,
    personnel: TeamPersonnel[],
    weather: RaceState['weather']
): PracticeResult[] => {
    const results: PracticeResult[] = [];

    roster.forEach(driver => {
        const teamPersonnel = personnel.find(p => p.teamName === driver.car.teamName)!;
        let score = 100;
        const messages: string[] = [];

        // 1. Base Score from Team & Driver Skill
        const setupPotential = (teamPersonnel.headOfTechnical.innovation + teamPersonnel.headOfTechnical.rdConversion) * 1.5; // max 60
        const driverFeedback = (driver.driverSkills.consistency + driver.driverSkills.raceCraft) / 2 * 0.4; // max 40
        score = setupPotential + driverFeedback;

        const carLinkImpact = calculateCarLinkImpact(driver, { session: 'practice' });
        score += (driver.carLink.compatibility - 60) * 0.25;
        score += carLinkImpact.readiness * 8;
        score -= carLinkImpact.adaptationDrag * 45;
        if (driver.carLink.compatibility < 60) {
            messages.push("Driver still feels disconnected from the current chassis balance.");
        } else if (driver.carLink.compatibility > 80 && carLinkImpact.readiness > 0.6) {
            messages.push("Driver gels with the car quickly—setup feedback is sharp.");
        }

        // 2. Negative Events
        // Reliability Issue
        const reliabilityChance = (100 - driver.car.reliability) / 100 * 0.2; // Max 20% chance of an issue
        if (Math.random() < reliabilityChance) {
            score -= 35;
            messages.push("Lost track time due to a minor reliability issue.");
        }

        // Crash/Damage
        const crashChance = (driver.driverSkills.incidentProneness / 100 * 0.05) + (track.riskTier * 0.02); // Max ~11%
        if (Math.random() < crashChance) {
            score -= 50;
            messages.push("A driver error led to a spin and minor damage, compromising the run plan.");
        }

        // Weather Interruption (if practice is wet but quali/race expected to be dry)
        const isWetPractice = weather === 'Light Rain' || weather === 'Heavy Rain';
        if (isWetPractice && track.wetSessionProbability < 0.5) {
            score -= 15;
            messages.push("Wet conditions rendered most of the dry-setup data irrelevant.");
        }
        
        // Poor Balance (more likely for lower-rated teams)
        if (Math.random() > (setupPotential / 60)) {
            score -= 10;
            messages.push("The driver is struggling to find a comfortable balance with the car.");
        }

        score = Math.max(0, score);
        const { grade, modifier } = getGradeAndModifier(score);
        
        // Pick a summary message
        let summary = SUMMARIES[grade][Math.floor(Math.random() * SUMMARIES[grade].length)];
        if (messages.length > 0 && grade > 'C') { // Override positive summary if a negative event happened
           summary = messages[0];
        }


        results.push({
            driverId: driver.id,
            driverName: driver.name,
            grade,
            summary,
            qualifyingTimeModifier: modifier,
        });
    });

    return results;
};

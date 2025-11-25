
import { Track, Strategy, TyreCompound, InitialDriver, TeamPersonnel, Car } from '../types';
import { TYRE_LIFE } from '../constants';

/**
 * Calculates the expected life of each tyre compound for a specific driver, car, and track combination.
 * @returns An object with the adjusted lap count for each tyre compound.
 */
const calculateAdjustedLaps = (track: Track, driver: InitialDriver, car: Car): Record<TyreCompound, number> => {
    const trackModifier = 1 + (3 - track.tyreStress) * 0.1;
    const driverModifier = 1 + (driver.driverSkills.tyreManagement - 85) / 100 * 0.5;
    const carModifier = 1 + (car.tyreWearFactor - 85) / 100 * 0.5;

    return {
        [TyreCompound.Soft]: Math.floor(TYRE_LIFE.Soft * trackModifier * driverModifier * carModifier),
        [TyreCompound.Medium]: Math.floor(TYRE_LIFE.Medium * trackModifier * driverModifier * carModifier),
        [TyreCompound.Hard]: Math.floor(TYRE_LIFE.Hard * trackModifier * driverModifier * carModifier),
        [TyreCompound.Intermediate]: TYRE_LIFE.Intermediate, // Wet tyres are less affected by these factors
        [TyreCompound.Wet]: TYRE_LIFE.Wet,
    };
};

/**
 * Generates a plan for a 1-stop strategy.
 * This strategy focuses on preserving track position (the "overcut").
 */
const generateOneStopPlan = (track: Track, adjustedLaps: Record<TyreCompound, number>, qualifyingPosition: number): Strategy => {
    // Aggressive S->H for front-runners wanting a great start.
    if (qualifyingPosition <= 3 && Math.random() < 0.4) {
        const pitLap = Math.round(adjustedLaps.Soft * 0.9 + (Math.random() - 0.5) * 3);
        return {
            startingTyre: TyreCompound.Soft,
            pitStops: [{ lap: pitLap, tyre: TyreCompound.Hard }]
        };
    }
    
    // Standard M->H for most others.
    const pitLap = Math.round(adjustedLaps.Medium * 0.95 + (Math.random() - 0.5) * 4);
    return {
        startingTyre: TyreCompound.Medium,
        pitStops: [{ lap: pitLap, tyre: TyreCompound.Hard }]
    };
};

/**
 * Generates a plan for a 2-stop strategy.
 * This is the standard, balanced approach for most races.
 */
const generateTwoStopPlan = (track: Track, adjustedLaps: Record<TyreCompound, number>, qualifyingPosition: number): Strategy => {
    // All-out attack S->M->S for drivers out of position
    if (qualifyingPosition > 12 && Math.random() < 0.6) {
        const firstStint = Math.round(adjustedLaps.Soft * 0.9 + (Math.random() - 0.5) * 3);
        const secondStint = Math.round(adjustedLaps.Medium * 0.9 + (Math.random() - 0.5) * 4);
        return {
            startingTyre: TyreCompound.Soft,
            pitStops: [
                { lap: firstStint, tyre: TyreCompound.Medium },
                { lap: firstStint + secondStint, tyre: TyreCompound.Soft }
            ]
        };
    }
    
    // Standard M->H->M (or M->H->S for a final attack)
    const firstStint = Math.round(adjustedLaps.Medium * 0.9 + (Math.random() - 0.5) * 4);
    const secondStint = Math.round(adjustedLaps.Hard * 0.9 + (Math.random() - 0.5) * 4);
    return {
        startingTyre: TyreCompound.Medium,
        pitStops: [
            { lap: firstStint, tyre: TyreCompound.Hard },
            { lap: firstStint + secondStint, tyre: Math.random() < 0.6 ? TyreCompound.Soft : TyreCompound.Medium }
        ]
    };
};


export const generateLocalStrategy = (track: Track, driver: InitialDriver, personnel: TeamPersonnel, qualifyingPosition: number): Strategy & { driverId: number } => {
    
    // 1. Foundational Calculations
    const strategyRating = ((personnel.teamPrincipal!.leadership + personnel.teamPrincipal!.financialAcumen + personnel.headOfTechnical!.innovation) / 60) * 100;
    const adjustedLaps = calculateAdjustedLaps(track, driver, driver.car);
    const { laps } = track;

    // 2. Score each potential strategy based on context
    const scores = {
        oneStop: 0,
        twoStop: 100, // The 2-stop is the baseline standard for most tracks.
    };

    // --- Scoring "The 1-Stop Strategy" ---
    const oneStopViableLapCount = adjustedLaps.Medium + adjustedLaps.Hard;
    if (oneStopViableLapCount < laps * 1.05) {
        scores.oneStop = -999; // Effectively impossible if tyre life doesn't cover race distance + margin.
    } else {
        scores.oneStop = 90;
        scores.oneStop += (track.overtakingDifficulty - 3) * 15; // Huge bonus on tracks where track position is king.
        scores.oneStop -= (track.tyreStress - 3) * 15; // Huge penalty on high-degradation tracks.
        if (['Circuit de Monaco', 'Hungaroring', 'Circuit Zandvoort', 'Autodromo Enzo e Dino Ferrari', 'Marina Bay Street Circuit'].includes(track.name)) {
            scores.oneStop += 25; // Bonus for classic 1-stop circuits.
        }
    }

    // --- Scoring "The 2-Stop Strategy (Standard Attack)" ---
    scores.twoStop += (track.tyreStress - 3) * 10; // Better on higher degradation tracks.
    scores.twoStop -= (track.overtakingDifficulty - 3) * 10; // Less attractive if overtaking is hard, due to traffic risk.
    if (['Silverstone Circuit', 'Bahrain International Circuit', 'Circuit de Barcelona-Catalunya', 'Suzuka International Racing Course', 'Circuit of the Americas'].includes(track.name)) {
        scores.twoStop += 15; // Bonus for classic 2-stop circuits.
    }
    
    // 3. Inject Variability (The "Chaos Factor")
    // Lower-rated teams have more variance in their decisions, sometimes making a surprisingly good or bad call.
    const chaosFactor = (100 - strategyRating) / 100;
    Object.keys(scores).forEach((key: 'oneStop' | 'twoStop') => {
        scores[key] += (Math.random() - 0.5) * 30 * chaosFactor;
    });

    // 4. Select the highest-scoring strategy
    const chosenStrategyType = Object.keys(scores).reduce((a, b) => scores[a as 'oneStop' | 'twoStop'] > scores[b as 'oneStop' | 'twoStop'] ? a : b);

    // 5. Generate the detailed pit stop plan based on the chosen strategy type
    let strategy: Strategy;
    switch (chosenStrategyType) {
        case 'oneStop':
            strategy = generateOneStopPlan(track, adjustedLaps, qualifyingPosition);
            break;
        case 'twoStop':
        default:
            strategy = generateTwoStopPlan(track, adjustedLaps, qualifyingPosition);
            break;
    }
    
    // 6. Final Sanitization
    // Ensure pit stops are scheduled within a realistic race window.
    strategy.pitStops.forEach(p => {
        p.lap = Math.max(5, Math.min(laps - 3, p.lap));
    });
    
    // Ensure pit stops are chronologically ordered and have a minimum gap.
    strategy.pitStops.sort((a,b) => a.lap - b.lap);
    for (let i = 1; i < strategy.pitStops.length; i++) {
        const minLap = strategy.pitStops[i-1].lap + 8; // At least 8 laps between stops.
        if (strategy.pitStops[i].lap < minLap) {
            strategy.pitStops[i].lap = minLap + Math.floor(Math.random() * 3);
        }
    }

    return { driverId: driver.id, ...strategy };
};

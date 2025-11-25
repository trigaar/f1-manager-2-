
import { InitialDriver, Track, Car, QualifyingResult, RaceState, RaceHistory, PracticeResult } from '../types';

const SCALING_FACTOR = 0.050; // 0.050 seconds per FPS point difference from 100

const calculateTSM = (car: Car, track: Track): number => {
    let tsm = 0;
    const calculatePrimaryModifier = (): number => {
        switch (track.primaryCharacteristic) {
            case 'High-Speed Aero': return (car.highSpeedCornering - 85) / 5;
            case 'Max Downforce / Low-Speed': return (car.lowSpeedCornering - 85) / 5;
            case 'Max Downforce / Med-Speed': return (car.mediumSpeedCornering - 85) / 5;
            case 'Power Sensitive': return (car.powerSensitivity - 90) / 4;
            case 'Power & Traction': return ((car.lowSpeedCornering - 85) / 10) + ((car.powerSensitivity - 90) / 8);
            case 'High-Speed Flow': return ((car.highSpeedCornering - 85) / 7) + ((car.mediumSpeedCornering - 85) / 7);
            default: return 0;
        }
    };
    tsm = calculatePrimaryModifier();
    if (track.secondaryCharacteristic) {
        switch (track.secondaryCharacteristic) {
            case 'High-Speed Aero': tsm += 0.5 * ((car.highSpeedCornering - 85) / 5); break;
            case 'Low-Speed Technical': tsm += 0.5 * ((car.lowSpeedCornering - 85) / 5); break;
        }
    }
    return tsm;
};

const calculateDriverLap = (driver: InitialDriver, track: Track, weather: RaceState['weather'], raceHistory: RaceHistory, practiceModifier: number): number => {
    // 1. Base Performance Score (BPS) & Track Specific Modifier (TSM)
    let qPace = driver.driverSkills.qualifyingPace;
    if (driver.driverSkills.trait?.id === 'MR_SATURDAY') qPace = Math.min(100, qPace + 5);
    const bps = (driver.car.overallPace * 0.5) + (qPace * 0.5);
    const tsm = calculateTSM(driver.car, track);
    const taps = bps + tsm; // Total Adjusted Pace Score

    let baseLapTime = track.baseLapTime;
    
    // Track Specialist Bonus
    const trackWinners = raceHistory[track.name] || [];
    if (trackWinners.some(w => w.winnerId === driver.id)) {
        baseLapTime -= 0.15;
    }

    const isWet = weather === 'Light Rain' || weather === 'Heavy Rain';

    // 2. Weather Effects
    let weatherModifier = 0;
    if (isWet) {
        // Apply a general slowdown for wet track
        baseLapTime *= 1.1; // 10% slower base time in wet
        // Driver skill helps claw back time
        let wetSkill = driver.driverSkills.wetWeatherSkill;
        if (driver.driverSkills.trait?.id === 'RAIN_MASTER') wetSkill = Math.min(100, wetSkill + 5);
        weatherModifier = (wetSkill - 90) * 0.2;
    }

    // 3. Driver Form & Peak Laps
    let formModifier = 0;
    const formRoll = Math.random();
    if (formRoll < 0.05) { // 5% chance of a "mega lap"
        formModifier = -0.3 * (1 + (driver.driverSkills.qualifyingPace - 90) / 100); // Gain up to 0.6s
    } else if (formRoll < 0.1) { // 5% chance of an "off day" mistake
        formModifier = 0.25 * (1 + (100 - driver.driverSkills.consistency) / 100); // Lose up to 0.5s
    } else { // 90% chance of a normal lap
        const consistencyRange = (100 - driver.driverSkills.consistency) / 20; // e.g., 90 cons -> +/- 0.25s
        formModifier = (Math.random() * 2 - 1) * consistencyRange;
    }

    // 4. Final Calculation
    const fps = taps + weatherModifier; // Note: formModifier is applied directly to time
    const simulatedLapTime = baseLapTime + ((100 - fps) * SCALING_FACTOR) + formModifier + practiceModifier;

    return parseFloat(simulatedLapTime.toFixed(3));
};

export const runQ1 = (drivers: InitialDriver[], track: Track, weather: RaceState['weather'], raceHistory: RaceHistory, practiceResults: PracticeResult[]): { results: QualifyingResult[], q2Drivers: InitialDriver[] } => {
    const sessionResults: Map<number, number> = new Map();
    const practiceModifierMap = new Map(practiceResults.map(p => [p.driverId, p.qualifyingTimeModifier]));

    drivers.forEach(driver => {
        const modifier = practiceModifierMap.get(driver.id) || 0;
        const lap1 = calculateDriverLap(driver, track, weather, raceHistory, modifier);
        const lap2 = calculateDriverLap(driver, track, weather, raceHistory, modifier) - 0.075; // Track evolution
        const lap3 = calculateDriverLap(driver, track, weather, raceHistory, modifier) - 0.150; // Final run evolution
        sessionResults.set(driver.id, Math.min(lap1, lap2, lap3));
    });

    const q1Sorted = [...drivers].sort((a, b) => sessionResults.get(a.id)! - sessionResults.get(b.id)!);
    
    const numToAdvance = 15;
    const q1EliminatedDrivers = q1Sorted.slice(numToAdvance);
    const q2DriverIds = new Set(q1Sorted.slice(0, numToAdvance).map(d => d.id));

    const results: QualifyingResult[] = q1Sorted.map((driver, index) => {
        let finalPosition = 0;
        let eliminatedIn: 'Q1' | 'Q2' | null = null;
        if (!q2DriverIds.has(driver.id)) {
            const elimIndex = q1EliminatedDrivers.findIndex(d => d.id === driver.id);
            finalPosition = numToAdvance + 1 + elimIndex;
            eliminatedIn = 'Q1';
        }
        return {
            driverId: driver.id,
            driverName: driver.name,
            q1Time: sessionResults.get(driver.id)!,
            q2Time: null,
            q3Time: null,
            finalPosition,
            eliminatedIn,
        };
    });

    const q2Drivers = q1Sorted.slice(0, numToAdvance);
    return { results, q2Drivers };
};

export const runQ2 = (
    q2Drivers: InitialDriver[], 
    existingResults: QualifyingResult[], 
    track: Track, 
    weather: RaceState['weather'],
    raceHistory: RaceHistory,
    practiceResults: PracticeResult[]
): { results: QualifyingResult[], q3Drivers: InitialDriver[] } => {
    const sessionResults: Map<number, number> = new Map();
    const practiceModifierMap = new Map(practiceResults.map(p => [p.driverId, p.qualifyingTimeModifier]));

    q2Drivers.forEach(driver => {
        const modifier = practiceModifierMap.get(driver.id) || 0;
        const lap1 = calculateDriverLap(driver, track, weather, raceHistory, modifier);
        const lap2 = calculateDriverLap(driver, track, weather, raceHistory, modifier) - 0.075;
        const lap3 = calculateDriverLap(driver, track, weather, raceHistory, modifier) - 0.150;
        sessionResults.set(driver.id, Math.min(lap1, lap2, lap3));
    });

    const q2Sorted = [...q2Drivers].sort((a, b) => sessionResults.get(a.id)! - sessionResults.get(b.id)!);

    let updatedResults = existingResults.map(res => {
        const q2Time = sessionResults.get(res.driverId);
        return q2Time ? { ...res, q2Time } : res;
    });

    const numToAdvance = 10;
    const q3DriverIds = new Set(q2Sorted.slice(0, numToAdvance).map(d => d.id));
    const q2EliminatedDrivers = q2Sorted.slice(numToAdvance);

    updatedResults.forEach(res => {
        if (!q3DriverIds.has(res.driverId) && res.eliminatedIn === null) {
            const elimIndex = q2EliminatedDrivers.findIndex(d => d.id === res.driverId);
            if (elimIndex !== -1) {
                res.eliminatedIn = 'Q2';
                res.finalPosition = numToAdvance + 1 + elimIndex;
            }
        }
    });

    const q3Drivers = q2Sorted.slice(0, numToAdvance);
    return { results: updatedResults, q3Drivers };
};


export const runQ3 = (
    q3Drivers: InitialDriver[], 
    existingResults: QualifyingResult[], 
    track: Track, 
    weather: RaceState['weather'],
    raceHistory: RaceHistory,
    practiceResults: PracticeResult[]
): QualifyingResult[] => {
    const sessionResults: Map<number, number> = new Map();
    const practiceModifierMap = new Map(practiceResults.map(p => [p.driverId, p.qualifyingTimeModifier]));

    q3Drivers.forEach(driver => {
        const modifier = practiceModifierMap.get(driver.id) || 0;
        const lap1 = calculateDriverLap(driver, track, weather, raceHistory, modifier);
        const lap2 = calculateDriverLap(driver, track, weather, raceHistory, modifier) - 0.075;
        const lap3 = calculateDriverLap(driver, track, weather, raceHistory, modifier) - 0.150;
        sessionResults.set(driver.id, Math.min(lap1, lap2, lap3));
    });

    const q3Sorted = [...q3Drivers].sort((a, b) => sessionResults.get(a.id)! - sessionResults.get(b.id)!);

    const finalResults = existingResults.map(res => {
        const q3Time = sessionResults.get(res.driverId);
        return q3Time ? { ...res, q3Time } : res;
    });

    q3Sorted.forEach((driver, index) => {
        const result = finalResults.find(r => r.driverId === driver.id)!;
        result.finalPosition = index + 1; // 1st to 10th
    });

    return finalResults.sort((a, b) => a.finalPosition - b.finalPosition);
};

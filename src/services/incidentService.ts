import { Driver, Track, RaceState, RaceFlag, LapEvent, TyreCompound } from '../types';

interface IncidentResult {
    updatedDrivers: Driver[];
    newFlag: RaceFlag;
    events: LapEvent[];
}

// --- CONFIGURABLE PROBABILITIES ---
const BASE_TRACK_LIMIT_PROBABILITY = 0.016; // Chance per driver per lap to get a track limits warning.
const RELIABILITY_FAILURE_FACTOR = 1 / 2500; // Base chance factor for a mechanical DNF. (100 - reliability) is multiplied by this.
const BASE_INCIDENT_PROBABILITY_FACTOR = 0.007; // Base chance factor for a driver mistake. (incidentProneness) is multiplied by this.


export const simulateKeyMomentIncidents = (
    drivers: Driver[],
    track: Track,
    weather: RaceState['weather']
): { updatedDrivers: Driver[]; lapEvents: LapEvent[]; flagTriggers: RaceFlag[] } => {
    let updatedDrivers = drivers.map(d => ({ ...d }));
    const lapEvents: LapEvent[] = [];
    const flagTriggers: RaceFlag[] = [];
    let involvedDriverIds = new Set<number>();

    const activeDrivers = updatedDrivers.filter(d => d.raceStatus === 'Racing');

    // More aggressive event probability on restarts
    if (Math.random() < 0.8) {
        const eventType = Math.random();
        
        // 1. Multi-Car Incident (15% chance)
        if (eventType < 0.15 && activeDrivers.length > 4) {
            const numInvolved = 2 + Math.floor(Math.random() * 3); // 2-4 cars involved
            const midPackDrivers = activeDrivers.filter(d => d.position > 4 && d.position < activeDrivers.length - 4);
            const starter = midPackDrivers[Math.floor(Math.random() * midPackDrivers.length)];
            if(starter) {
                involvedDriverIds.add(starter.id);
                const incidentReport: string[] = [starter.name];

                for(let i=0; i < numInvolved -1; i++) {
                    const nearbyDriver = activeDrivers.find(d => !involvedDriverIds.has(d.id) && Math.abs(d.position - starter.position) < 4);
                    if(nearbyDriver) {
                        involvedDriverIds.add(nearbyDriver.id);
                        incidentReport.push(nearbyDriver.name);
                    }
                }
                
                lapEvents.push({ type: 'MULTI_CRASH', driverName: 'Race Control', data: { involved: incidentReport.join(', ') } });
                
                involvedDriverIds.forEach(id => {
                    const driver = updatedDrivers.find(d => d.id === id)!;
                    if (Math.random() < 0.3) { // 30% chance of DNF, 70% of damage
                        driver.raceStatus = 'Crashed';
                        driver.retirementLap = 1;
                        driver.retirementReason = 'Crash';
                    } else {
                        driver.raceStatus = 'Damaged';
                        driver.isDamaged = true;
                    }
                });
                flagTriggers.push(RaceFlag.Red);
            }
        }
        // 2. Overtakes & Mistakes (65% chance)
        else if (eventType < 0.80) {
            activeDrivers.forEach(driver => {
                const roll = Math.random();
                let skillFactor = driver.driverSkills.raceCraft / 100 - 0.5; // -0.5 to 0.5
                // FIX: Apply trait bonus for 'Rocket Start'
                if (driver.driverSkills.trait?.id === 'ROCKET_START') skillFactor += 0.2; // Significant start bonus

                if (roll + skillFactor > 0.9) { // Great start
                    const positionsGained = 1 + Math.floor(Math.random() * 3);
                    driver.position -= positionsGained;
                    lapEvents.push({type: 'LAP_EVENT', driverName: driver.name, data: {message: `gets a brilliant start, gaining ${positionsGained} places!`}});
                } else if (roll - skillFactor < 0.1) { // Poor start
                    const positionsLost = 1 + Math.floor(Math.random() * 3);
                    driver.position += positionsLost;
                    lapEvents.push({type: 'LAP_EVENT', driverName: driver.name, data: {message: `has a poor start, losing ${positionsLost} places!`}});
                }
            });
             // Re-sort based on new positions
            updatedDrivers.sort((a,b) => a.position - b.position).forEach((d, i) => d.position = i + 1);
        }
    }
    
    return { updatedDrivers, lapEvents, flagTriggers };
};


export const simulateLapIncidents = (
    drivers: Driver[],
    track: Track,
    weather: RaceState['weather'],
    trackCondition: RaceState['trackCondition'],
    currentLap: number,
): { updatedDrivers: Driver[]; lapEvents: LapEvent[]; flagTriggers: RaceFlag[] } => {
    const updatedDrivers = [...drivers];
    const lapEvents: LapEvent[] = [];
    const flagTriggers: RaceFlag[] = [];
    let crashCountThisLap = 0;
    
    const isWet = weather === 'Light Rain' || weather === 'Heavy Rain' || weather === 'Extreme Rain';

    updatedDrivers.forEach(driver => {
        if (driver.raceStatus !== 'Racing' && driver.raceStatus !== 'Damaged') return;
        
        // --- Track Limits ---
        if (Math.random() < BASE_TRACK_LIMIT_PROBABILITY && driver.raceStatus === 'Racing') {
            driver.trackLimitWarnings = (driver.trackLimitWarnings || 0) + 1;
            if (driver.trackLimitWarnings === 3) {
                driver.penalties.push({ type: 'Time', duration: 5, served: false, reason: "exceeding track limits" });
                lapEvents.push({ type: 'TIME_PENALTY', driverName: driver.name, data: { duration: 5, reason: "exceeding track limits" } });
                driver.trackLimitWarnings = 0; // Reset after penalty
            } else {
                lapEvents.push({ type: 'TRACK_LIMIT_WARNING', driverName: driver.name, data: { count: driver.trackLimitWarnings } });
            }
        }

        // --- Minor Events & Team Radio ---
        if (Math.random() < 0.08) { // 8% chance per lap for a minor event
            const mistakeChance = 0.6 - (driver.driverSkills.consistency / 200);
            if (Math.random() < mistakeChance) {
                const mistakeType = Math.random() < 0.5 ? 'LOCK_UP' : 'WIDE_MOMENT';
                lapEvents.push({ type: mistakeType, driverName: driver.name });
            } else {
                 const radioMessages = [
                    `is told to 'push now, push now!'.`,
                    `reports 'The tyres are starting to go off'.`,
                    `is reminded about track limits at turn ${Math.floor(Math.random()*10) + 1}.`,
                    `is told 'Keep it clean, we're looking good.'`,
                    `asks about the weather forecast.`
                ];
                const message = radioMessages[Math.floor(Math.random() * radioMessages.length)];
                lapEvents.push({ type: 'TEAM_RADIO', driverName: driver.name, data: { message } });
            }
        }

        // --- Mechanical Failures ---
        if (Math.random() < (100 - driver.car.reliability) * RELIABILITY_FAILURE_FACTOR) {
            const failureSeverity = Math.random();
            if (failureSeverity < 0.6) { // Catastrophic failure
                driver.raceStatus = 'DNF';
                driver.retirementLap = currentLap;
                driver.retirementReason = 'Mechanical';
                lapEvents.push({ type: 'DNF', driverName: driver.name, data: { reason: 'Mechanical Failure' } });
                crashCountThisLap++; 
            } else { // Chance to repair
                driver.raceStatus = 'Limping';
                driver.isDamaged = true; // Set damage flag for repair
                lapEvents.push({ type: 'MECHANICAL_ISSUE', driverName: driver.name, data: { message: 'is crawling back to the pits!' }});
            }
            return;
        }

        // --- Driver Mistakes ---
        const currentTyre = driver.currentTyres.compound;
        const isSlick = currentTyre === TyreCompound.Soft || currentTyre === TyreCompound.Medium || currentTyre === TyreCompound.Hard;
        
        let incidentChance = (driver.driverSkills.incidentProneness / 100) * BASE_INCIDENT_PROBABILITY_FACTOR;
        // FIX: Apply trait modifiers for incident chance
        if (driver.driverSkills.trait?.id === 'MR_CONSISTENT') incidentChance *= 0.5; // 50% less likely to have incident
        if (driver.driverSkills.trait?.id === 'ERROR_PRONE') incidentChance *= 1.5; // 50% more likely

        if (driver.currentTyres.wear > 65) {
            incidentChance *= (1 + Math.pow((driver.currentTyres.wear - 65) / 10, 2));
        }
        if (isWet && isSlick) {
            incidentChance *= (weather === 'Extreme Rain' ? 75 : weather === 'Heavy Rain' ? 25 : 15);
        } else if (weather === 'Extreme Rain') {
            incidentChance *= 5;
        }

        if (trackCondition.waterLevel > 30) {
            incidentChance *= (1 + trackCondition.waterLevel / 40);
        }
        
        if (Math.random() < incidentChance) {
            const severity = Math.random();
            // Penalty chance reduced by 80%. Redistributed to Spin.
            if (severity < 0.66) { // 66% chance of a Spin (was 50%)
                driver.totalRaceTime += 5 + Math.random() * 5;
                lapEvents.push({ type: 'SPIN', driverName: driver.name });
                if (Math.random() < track.virtualSafetyCarProbability) flagTriggers.push(RaceFlag.VirtualSafetyCar);
            } else if (severity < 0.70) { // 4% chance of collision -> penalty (was 20%)
                driver.penalties.push({ type: 'Time', duration: 5, served: false, reason: "causing a collision" });
                lapEvents.push({ type: 'TIME_PENALTY', driverName: driver.name, data: { duration: 5, reason: "causing a collision" } });
                flagTriggers.push(RaceFlag.Yellow);
            } else if (severity < 0.85) { // 15% chance of Damage
                driver.raceStatus = 'Damaged';
                driver.isDamaged = true;
                lapEvents.push({ type: 'DAMAGE', driverName: driver.name, data: { message: 'has picked up some damage!' }});
                flagTriggers.push(RaceFlag.Yellow);
            } else { // 15% chance of a Crash
                driver.raceStatus = 'Crashed';
                driver.retirementLap = currentLap;
                driver.retirementReason = 'Crash';
                lapEvents.push({ type: 'CRASH', driverName: driver.name });
                crashCountThisLap++;
                const redFlagChance = 0.30 + (track.riskTier * 0.05);
                if (Math.random() < redFlagChance) {
                    flagTriggers.push(RaceFlag.Red);
                }
            }
        }
    });

    if (crashCountThisLap > 0 && !flagTriggers.includes(RaceFlag.Red)) {
        if (crashCountThisLap > 1) {
            flagTriggers.push(RaceFlag.Red);
        } else if (Math.random() < track.safetyCarProbability) {
            flagTriggers.push(RaceFlag.SafetyCar);
        } else {
            flagTriggers.push(RaceFlag.Yellow);
        }
    }
    
    return { updatedDrivers, lapEvents, flagTriggers };
};
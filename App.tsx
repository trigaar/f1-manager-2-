

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { RaceState, Driver, Track, GamePhase, TyreCompound, LapEvent, RaceFlag, InitialDriver, QualifyingResult, OffSeasonPhase, TeamFinances, TeamPersonnel, PersonnelChangeEvent, DriverMarketEvent, Car, CarDevelopmentResult, DriverStanding, RegulationEvent, RookieDriver, Tyre, DriverProgressionEvent, RaceHistory, LapEventType, ResourceAllocationEvent, PracticeResult, AiRaceSummary, AiSeasonReview, UpcomingRaceQuote, TeamDebrief, DriverDebrief, PlayerCarDev, AffiliateDriver, AffiliateChangeEvent, ConstructorStanding, ShortlistDriver, HeadquartersEvent, HeadquartersEventEffect, HeadquartersEventResolution, WeekendModifier, Strategy } from './types';
import { FULL_SEASON_TRACKS, SHORT_SEASON_TRACKS, INITIAL_DRIVERS, TYRE_LIFE, INITIAL_PERSONNEL, CARS, TEAM_COLORS, ROOKIE_POOL, TYRE_PROPERTIES, TIRE_BLANKET_TEMP, AFFILIATE_CANDIDATES } from './constants';
import { pickRandomHeadquartersEvent } from './constants/headquartersEvents';
import { generateLocalStrategy } from './services/strategyService';
import { runQ1, runQ2, runQ3 } from './services/qualifyingService';
import { simulateKeyMomentIncidents, simulateLapIncidents } from './services/incidentService';
import { calculateTeamFinances } from './services/financialService';
import { runStaffingMarket } from './services/personnelService';
import { runDriverMarket, resolveContractOffer, getTeamTier, generatePlayerShortlist } from './services/driverMarketService';
import { runCarDevelopment } from './services/carDevelopmentService';
import { runRegulationChange } from './services/regulationChangeService';
import { generateMasterForecast, generateTeamForecasts } from './services/weatherService';
import { useStandings } from './hooks/useStandings';
import { useConstructorStandings } from './hooks/useConstructorStandings';
import { useSeasonHistory } from './hooks/useSeasonHistory';
import { useRaceHistory } from './hooks/useRaceHistory';
import { calculateTeamPrestige, calculateDriverStockValue, calculateMarketVolatilityIndex } from './services/postSeasonService';
import { runDriverProgression } from './services/driverProgressionService';
import { runResourceAllocation } from './services/resourceAllocationService';
import { runPracticeSession } from './services/practiceService';
import { generateAiRaceSummary } from './services/aiSummaryService';
import { generateAiSeasonReview } from './services/aiSeasonReviewService';
import { generateAiDriverPreview } from './services/aiDriverPreviewService';
import { runAffiliateProgression, runAIAffiliateSignings } from './services/affiliateService';
import { buildInitialRaceState, calculateNextSeasonTracks, createNewRookies, updateRosterForNewSeason } from './services/seasonResetService';
import { calculateCarLinkImpact } from './services/carLinkService';
import { rollPreRaceEventForTeam } from './services/preRaceEventService';
import { applyLoadedGameState, GameSaveState, generateSaveCode, getCurrentGameState, loadFromSaveCode, SaveStateSetters } from './services/saveSystem';
import { computeSafeLapTime, safeClampNumber } from './utils/lapUtils';
import SetupScreen from './components/SetupScreen';
import Leaderboard from './components/Leaderboard';
import RaceControlPanel from './components/RaceControlPanel';
import TrackDisplay from './components/TrackDisplay';
import AiSummaryScreen from './components/AiSummaryScreen';
import RaceFinishScreen from './components/RaceFinishScreen';
import AiSeasonReviewScreen from './components/AiSeasonReviewScreen';
import PracticeScreen from './components/PracticeScreen';
import QualifyingScreen from './components/QualifyingScreen';
import DebriefScreen from './components/DebriefScreen';
import DriverProgressionScreen from './components/DriverProgressionScreen';
import FinancialsScreen from './components/FinancialsScreen';
import ResourceAllocationScreen from './components/ResourceAllocationScreen';
import PersonnelScreen from './components/PersonnelScreen';
import DriverMarketScreen from './components/DriverMarketScreen';
import RegulationChangeScreen from './components/RegulationChangeScreen';
import CarDevelopmentScreen from './components/CarDevelopmentScreen';
import DriverMarketSummaryScreen from './components/DriverMarketSummaryScreen';
import EventLog from './components/EventLog';
import TeamDetailModal from './components/TeamDetailModal';
import HistoryScreen from './components/HistoryScreen';
import GarageScreen from './components/GarageScreen';
import HeadquartersScreen from './components/HeadquartersScreen';
import CommentaryBox from './components/CommentaryBox';
import TeamSelectionScreen from './components/TeamSelectionScreen';
import HowToPlayModal from './components/HowToPlayModal';

type QualifyingStage = 'Q1' | 'Q2' | 'Q3' | 'FINISHED';

const sortDrivers = (a: Driver, b: Driver) => {
    const aIsOut = a.raceStatus === 'Crashed' || a.raceStatus === 'DNF';
    const bIsOut = b.raceStatus === 'Crashed' || b.raceStatus === 'DNF';

    if (aIsOut && !bIsOut) return 1;
    if (!aIsOut && bIsOut) return -1;
    
    if (aIsOut && bIsOut) {
        return (b.retirementLap || 0) - (a.retirementLap || 0);
    }

    return a.totalRaceTime - b.totalRaceTime;
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const chooseOptimalWetTyre = (
    driver: Driver, 
    raceState: RaceState, 
    newWaterLevel: number,
    teamForecast: RaceState['weather'][],
    trackIsDrying: boolean
): TyreCompound => {
    const waterLevel = raceState.trackCondition.waterLevel;
    const driverSkillFactor = (driver.driverSkills.wetWeatherSkill - 85) * 0.5;
    const randomFactor = (Math.random() - 0.5) * 10;
    const wetTyreThreshold = 55 + driverSkillFactor + randomFactor;

    if (waterLevel < 15 && (newWaterLevel < waterLevel) && trackIsDrying) {
        const remainingLaps = raceState.totalLaps - raceState.lap;
        const availableSlicks = [TyreCompound.Soft, TyreCompound.Medium, TyreCompound.Hard].filter(c => !driver.compoundsUsed.includes(c));
        
        if (remainingLaps < TYRE_LIFE.Soft + 2 && availableSlicks.includes(TyreCompound.Soft)) {
            return TyreCompound.Soft;
        }

        const preferredSlick = availableSlicks.includes(TyreCompound.Medium) ? TyreCompound.Medium : (availableSlicks.length > 0 ? availableSlicks[0] : TyreCompound.Medium);
        return preferredSlick;
    }

    const idealTyre = (waterLevel > wetTyreThreshold || (raceState.lap > 0 && teamForecast[raceState.lap - 1] === 'Heavy Rain')) ? TyreCompound.Wet : TyreCompound.Intermediate;
    const alternativeTyre = (idealTyre === TyreCompound.Wet) ? TyreCompound.Intermediate : TyreCompound.Wet;

    if (!driver.compoundsUsed.includes(idealTyre)) {
        return idealTyre;
    }
    
    if (!driver.compoundsUsed.includes(alternativeTyre)) {
        return alternativeTyre;
    }

    return idealTyre;
};

const chooseOptimalDryTyre = (
    driver: Driver, 
    raceState: RaceState, 
    isMandatoryStop: boolean
): TyreCompound => {
    const allSlicks: TyreCompound[] = [TyreCompound.Soft, TyreCompound.Medium, TyreCompound.Hard];
    const availableSlicks = allSlicks.filter(c => !driver.compoundsUsed.includes(c));
    const plannedTyre = driver.strategy.pitStops[driver.pitStops]?.tyre || TyreCompound.Hard;

    if (isMandatoryStop) {
        if (availableSlicks.length > 0) {
            if (availableSlicks.includes(plannedTyre)) return plannedTyre;
            if (availableSlicks.includes(TyreCompound.Medium)) return TyreCompound.Medium;
            if (availableSlicks.includes(TyreCompound.Hard)) return TyreCompound.Hard;
            return TyreCompound.Soft;
        }
        return plannedTyre;
    }

    if (availableSlicks.includes(plannedTyre)) {
        return plannedTyre;
    }

    if (availableSlicks.length > 0) {
        const remainingLaps = raceState.totalLaps - raceState.lap;
        const tyreLifeMedium = TYRE_LIFE[TyreCompound.Medium];

        if (remainingLaps < tyreLifeMedium + 5 && availableSlicks.includes(TyreCompound.Medium)) return TyreCompound.Medium;
        if (availableSlicks.includes(TyreCompound.Hard)) return TyreCompound.Hard;
        if (availableSlicks.includes(TyreCompound.Medium)) return TyreCompound.Medium;
        if (availableSlicks.includes(TyreCompound.Soft)) return TyreCompound.Soft;
    }

    return plannedTyre;
};

const determineNextTyreForPitStop = (
    driver: Driver, 
    raceState: RaceState, 
    newWaterLevel: number,
    teamForecast: RaceState['weather'][],
    isWet: boolean,
    rainIsComing: boolean,
    trackIsDrying: boolean
): TyreCompound => {
    const isSlickOnlyRace = !driver.hasUsedWetTyre;
    const slickCompoundsUsed = new Set(driver.compoundsUsed.filter(c => c !== TyreCompound.Intermediate && c !== TyreCompound.Wet));
    const hasFulfilledTyreRule = !isSlickOnlyRace || slickCompoundsUsed.size >= 2;
    const isMandatoryStop = raceState.lap >= raceState.totalLaps - 2 && !hasFulfilledTyreRule;
    
    if (raceState.weather === 'Extreme Rain' || teamForecast.slice(raceState.lap, raceState.lap + 2).some(w => w === 'Extreme Rain')) {
        return TyreCompound.Wet;
    }

    if (isWet || rainIsComing) {
        return chooseOptimalWetTyre(driver, raceState, newWaterLevel, teamForecast, trackIsDrying);
    } else {
        return chooseOptimalDryTyre(driver, raceState, isMandatoryStop);
    }
};

const getTyreAdvantage = (attackerTyres: Tyre, defenderTyres: Tyre): number => {
    const getGripFromTemp = (tyre: Tyre) => {
        const [min, max] = TYRE_PROPERTIES[tyre.compound].idealTempRange;
        if (tyre.temperature > min && tyre.temperature < max) return 1.0;
        if (tyre.temperature < min) return 1.0 - (min - tyre.temperature) * 0.02;
        return 1.0 - (tyre.temperature - max) * 0.015;
    };
    
    const compoundPerformance = { [TyreCompound.Soft]: 1.0, [TyreCompound.Medium]: 0.7, [TyreCompound.Hard]: 0.5, [TyreCompound.Intermediate]: 0.3, [TyreCompound.Wet]: 0.1 };
    
    const attackerTempGrip = getGripFromTemp(attackerTyres);
    const defenderTempGrip = getGripFromTemp(defenderTyres);
    
    const attackerPerf = compoundPerformance[attackerTyres.compound] * attackerTempGrip * (1 - (attackerTyres.wear / 150));
    const defenderPerf = compoundPerformance[defenderTyres.compound] * defenderTempGrip * (1 - (defenderTyres.wear / 150));
    
    return (attackerPerf - defenderPerf) * 0.2;
};

const calculateRaceTSM = (car: Car, track: Track): number => {
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

const clampNumber = (value: number, fallback: number, min?: number, max?: number): number => {
    if (!Number.isFinite(value)) return fallback;
    if (min !== undefined && value < min) return min;
    if (max !== undefined && value > max) return max;
    return value;
};

const sanitizeStrategy = (strategy: Strategy | undefined, track: Track, fallbackTyre: TyreCompound): Strategy => {
    const safeStrategy = strategy || { startingTyre: fallbackTyre, pitStops: [] };

    const startingTyre = safeStrategy.startingTyre || fallbackTyre;
    const pitStops = Array.isArray(safeStrategy.pitStops) ? safeStrategy.pitStops : [];

    const sanitizedStops = pitStops
        .map(stop => ({
            lap: clampNumber(stop?.lap, Math.floor(track.laps / 2), 1, Math.max(1, track.laps - 1)),
            tyre: stop?.tyre || fallbackTyre,
        }))
        .sort((a, b) => a.lap - b.lap);

    for (let i = 1; i < sanitizedStops.length; i++) {
        const minLap = sanitizedStops[i - 1].lap + 2;
        if (sanitizedStops[i].lap < minLap) {
            sanitizedStops[i].lap = minLap;
        }
    }

    return { startingTyre, pitStops: sanitizedStops };
};

const sanitizeTrackState = (track: Track): Track => {
    return {
        ...track,
        baseLapTime: clampNumber(track.baseLapTime, 90, 60, 140),
        pitLaneTimeLoss: clampNumber(track.pitLaneTimeLoss, 20, 12, 40),
        laps: Math.max(10, track.laps || 50),
        tyreStress: clampNumber(track.tyreStress, 3, 1, 6),
        brakeWear: clampNumber(track.brakeWear, 3, 1, 6),
        powerSensitivity: clampNumber(track.powerSensitivity, 3, 1, 6),
        safetyCarProbability: clampNumber(track.safetyCarProbability, 0.5, 0, 1),
        virtualSafetyCarProbability: clampNumber(track.virtualSafetyCarProbability, 0.5, 0, 1),
    };
};

const sanitizeDriverState = (driver: Driver, baseLapRef: number, track: Track): Driver => {
    const fallbackTyre = driver.currentTyres?.compound || TyreCompound.Medium;
    const sanitizedStrategy = sanitizeStrategy(driver.strategy, track, fallbackTyre);
    const rawSkills = driver.driverSkills || ({} as Driver['driverSkills']);
    const safeDriverSkills = {
        overall: clampNumber(rawSkills.overall ?? 80, 80, 1, 100),
        qualifyingPace: clampNumber(rawSkills.qualifyingPace ?? 80, 80, 1, 100),
        raceCraft: clampNumber(rawSkills.raceCraft ?? 80, 80, 1, 100),
        tyreManagement: clampNumber(rawSkills.tyreManagement ?? 80, 80, 1, 100),
        consistency: clampNumber(rawSkills.consistency ?? 80, 80, 1, 100),
        wetWeatherSkill: clampNumber(rawSkills.wetWeatherSkill ?? 80, 80, 1, 100),
        aggressionIndex: clampNumber(rawSkills.aggressionIndex ?? 50, 50, 1, 100),
        incidentProneness: clampNumber(rawSkills.incidentProneness ?? 15, 15, 1, 100),
        loyalty: clampNumber(rawSkills.loyalty ?? 50, 50, 1, 100),
        potential: clampNumber(rawSkills.potential ?? 80, 80, 1, 100),
        reputation: clampNumber(rawSkills.reputation ?? 50, 50, 1, 100),
        specialties: Array.isArray(rawSkills.specialties) ? rawSkills.specialties : [],
        trait: rawSkills.trait,
    } as Driver['driverSkills'];

    const rawCar = driver.car || ({} as Driver['car']);
    const safeCar: Car = {
        teamName: rawCar.teamName || 'Unknown',
        overallPace: clampNumber(rawCar.overallPace ?? 80, 80, 40, 120),
        highSpeedCornering: clampNumber(rawCar.highSpeedCornering ?? 80, 80, 40, 120),
        mediumSpeedCornering: clampNumber(rawCar.mediumSpeedCornering ?? 80, 80, 40, 120),
        lowSpeedCornering: clampNumber(rawCar.lowSpeedCornering ?? 80, 80, 40, 120),
        powerSensitivity: clampNumber(rawCar.powerSensitivity ?? 80, 80, 40, 120),
        reliability: clampNumber(rawCar.reliability ?? 80, 80, 1, 100),
        tyreWearFactor: clampNumber(rawCar.tyreWearFactor ?? 80, 80, 40, 120),
        isLST: rawCar.isLST ?? false,
    };

    const rawCarLink = driver.carLink || ({} as Driver['carLink']);
    const safeCarLink = {
        compatibility: clampNumber(rawCarLink.compatibility ?? 50, 50, 0, 100),
        adaptation: clampNumber(rawCarLink.adaptation ?? 50, 50, 0, 100),
        notes: rawCarLink.notes,
    } as Driver['carLink'];
    const tyre = driver.currentTyres || {
        compound: fallbackTyre,
        wear: 0,
        age: 0,
        temperature: TIRE_BLANKET_TEMP,
        condition: 'Cold' as const,
    };

    const safeTemperature = clampNumber(tyre.temperature, TIRE_BLANKET_TEMP, track.tyreStress > 4 ? 60 : 40, 150);
    const safeWear = clampNumber(tyre.wear, 0, 0, 100);
    const safeForm = Number.isFinite(driver.form) ? driver.form : 0;

    return {
        ...driver,
        driverSkills: safeDriverSkills,
        car: safeCar,
        carLink: safeCarLink,
        form: safeForm,
        position: Math.max(1, driver.position || 1),
        startingPosition: Math.max(1, driver.startingPosition || 1),
        totalRaceTime: clampNumber(driver.totalRaceTime ?? 0, 0, 0, Number.MAX_SAFE_INTEGER),
        gapToLeader: clampNumber(driver.gapToLeader ?? 0, 0, 0, Number.MAX_SAFE_INTEGER),
        lapTime: clampNumber(driver.lapTime ?? baseLapRef, baseLapRef, 40, Number.MAX_SAFE_INTEGER),
        fuelLoad: clampNumber(driver.fuelLoad ?? 105, 105, 0, 120),
        pitStops: clampNumber(driver.pitStops ?? 0, 0, 0, 20),
        pittedThisLap: !!driver.pittedThisLap,
        pittedUnderSCThisPeriod: !!driver.pittedUnderSCThisPeriod,
        hasUsedWetTyre: !!driver.hasUsedWetTyre,
        paceMode: driver.paceMode || 'Standard',
        ersCharge: clampNumber(driver.ersCharge ?? 100, 100, 0, 100),
        currentTyres: {
            ...tyre,
            wear: safeWear,
            age: clampNumber(tyre.age ?? 0, 0, 0, 200),
            temperature: safeTemperature,
            condition: tyre.condition || 'Cold',
        },
        penalties: driver.penalties || [],
        compoundsUsed: driver.compoundsUsed?.length ? driver.compoundsUsed : [fallbackTyre],
        strategy: sanitizedStrategy,
        raceStatus: driver.raceStatus || 'Racing',
        battle: driver.battle || null,
    };
};

const buildFallbackLapTime = (driver: Driver, baseLapRef: number, track: Track): number => {
    const paceAnchor = clampNumber(driver.driverSkills?.overall ?? 80, 80, 40, 120);
    const carAnchor = clampNumber(driver.car?.overallPace ?? 75, 75, 40, 120);
    const tyreWear = clampNumber(driver.currentTyres?.wear ?? 0, 0, 0, 100);

    const driverDelta = (100 - paceAnchor) * 0.045;
    const carDelta = (100 - carAnchor) * 0.025;
    const tyreDrag = tyreWear * 0.03;
    const trackStretch = clampNumber(track.tyreStress ?? 3, 3, 1, 6) * 0.4;
    const randomness = (Math.random() - 0.5) * 2.5;

    const estimated = baseLapRef + driverDelta + carDelta + tyreDrag + trackStretch + randomness;
    return clampNumber(estimated, baseLapRef, 40, 400);
};

const sanitizeLapTiming = (driver: Driver, baseLapRef: number, track: Track): Driver => {
    const rawLapTime = Number.isFinite(driver.lapTime) && driver.lapTime > 0 ? driver.lapTime : buildFallbackLapTime(driver, baseLapRef, track);
    const safeLapTime = clampNumber(rawLapTime, baseLapRef, 40, 400);
    const safeTotalTime = clampNumber(driver.totalRaceTime ?? safeLapTime, safeLapTime, 0, Number.MAX_SAFE_INTEGER);
    const safeGap = Number.isFinite(driver.gapToLeader) && driver.gapToLeader >= 0 ? driver.gapToLeader : 0;

    return {
        ...driver,
        lapTime: safeLapTime,
        totalRaceTime: safeTotalTime,
        gapToLeader: safeGap,
    };
};


const calculateNextStates = (
    prevDrivers: Driver[],
    prevRaceState: RaceState,
    personnel: TeamPersonnel[],
    fastestLap: { driverName: string; time: number } | null,
    addLog: (message: string) => void,
    setFastestLap: React.Dispatch<React.SetStateAction<{ driverName: string; time: number } | null>>,
    formatEventMessage: (event: LapEvent) => string,
    raceHistory: RaceHistory
): { nextDrivers: Driver[], nextRaceState: RaceState, lapEvents: LapEvent[] } => {
    let nextDrivers = JSON.parse(JSON.stringify(prevDrivers)) as Driver[];
    let nextRaceState = { ...prevRaceState };
    let lapEvents: LapEvent[] = [];
    let flagTriggers: RaceFlag[] = [];

    // Guardrails for any corrupt state that might have slipped through between sessions
    const safeTrack = sanitizeTrackState(nextRaceState.track);
    const safeWeather = nextRaceState.weather || 'Sunny';

    nextRaceState = {
        ...nextRaceState,
        track: safeTrack,
        weather: safeWeather,
        flag: nextRaceState.flag || RaceFlag.Green,
        airTemp: clampNumber(nextRaceState.airTemp, 25, -10, 60),
        trackTemp: clampNumber(nextRaceState.trackTemp, 40, -10, 80),
        trackCondition: {
            waterLevel: clampNumber(nextRaceState.trackCondition?.waterLevel ?? 0, 0, 0, 100),
            gripLevel: clampNumber(nextRaceState.trackCondition?.gripLevel ?? 100, 100, 0, 100),
        },
        masterWeatherForecast: nextRaceState.masterWeatherForecast?.length ? nextRaceState.masterWeatherForecast : Array.from({
            length: safeTrack.laps
        }, () => safeWeather),
        teamWeatherForecasts: nextRaceState.teamWeatherForecasts || {},
    };

    const baseLapReference = safeTrack.baseLapTime;
    nextDrivers = nextDrivers.map(driver => sanitizeDriverState(driver, baseLapReference, safeTrack));

    // Cached maps keep lookups predictable during the lap loop
    const personnelMap = new Map(personnel.map(p => [p.teamName, p]));

    if (nextRaceState.isRestarting) {
        addLog("The grid is reformed for a standing restart. All time gaps have been nullified.");
        
        const isWetRestart = nextRaceState.trackCondition.waterLevel > 5 || nextRaceState.weather.includes('Rain');

        nextDrivers.filter(d => d.raceStatus !== 'Crashed' && d.raceStatus !== 'DNF').forEach(driver => {
            const remainingLaps = nextRaceState.totalLaps - nextRaceState.lap;
            
            let targetTyre: TyreCompound;

            if (isWetRestart) {
                if (nextRaceState.weather === 'Heavy Rain' || nextRaceState.weather === 'Extreme Rain' || nextRaceState.trackCondition.waterLevel > 40) {
                    targetTyre = TyreCompound.Wet;
                } else {
                    targetTyre = TyreCompound.Intermediate;
                }
            } else {
                if (remainingLaps <= TYRE_LIFE.Soft + 2) {
                    targetTyre = TyreCompound.Soft;
                } else if (remainingLaps <= TYRE_LIFE.Medium + 4) {
                    targetTyre = TyreCompound.Medium;
                } else {
                    targetTyre = TyreCompound.Hard;
                }

                const usedSlicks = new Set(driver.compoundsUsed.filter(c => c !== TyreCompound.Intermediate && c !== TyreCompound.Wet));
                const ruleMet = usedSlicks.size >= 2 || driver.hasUsedWetTyre;

                if (!ruleMet && usedSlicks.has(targetTyre)) {
                    const availableNewSlicks = [TyreCompound.Soft, TyreCompound.Medium, TyreCompound.Hard].filter(c => !usedSlicks.has(c));
                    
                    if (availableNewSlicks.length > 0) {
                        if (remainingLaps <= TYRE_LIFE.Soft + 2 && availableNewSlicks.includes(TyreCompound.Soft)) {
                            targetTyre = TyreCompound.Soft;
                        } else if (remainingLaps <= TYRE_LIFE.Medium + 4 && availableNewSlicks.includes(TyreCompound.Medium)) {
                            targetTyre = TyreCompound.Medium;
                        } else if (availableNewSlicks.includes(TyreCompound.Hard)) {
                            targetTyre = TyreCompound.Hard;
                        } else if (availableNewSlicks.includes(TyreCompound.Medium)) {
                            targetTyre = TyreCompound.Medium;
                        } else {
                            targetTyre = TyreCompound.Soft;
                        }
                    }
                }
            }
            
            if (driver.currentTyres.compound !== targetTyre) {
                driver.currentTyres = { compound: targetTyre, wear: 0, age: 0, temperature: TIRE_BLANKET_TEMP, condition: 'Cold' };
                lapEvents.push({ type: 'LAP_EVENT', driverName: driver.name, data: { message: `switches to a fresh set of ${targetTyre} tyres under the Red Flag.` } });
                
                if (!driver.compoundsUsed.includes(targetTyre)) {
                    driver.compoundsUsed.push(targetTyre);
                }
                const isSlick = [TyreCompound.Soft, TyreCompound.Medium, TyreCompound.Hard].includes(targetTyre);
                if (!isSlick) {
                    driver.hasUsedWetTyre = true;
                }
            }
        });

        const sortedRacing = nextDrivers.filter(d => d.raceStatus !== 'Crashed' && d.raceStatus !== 'DNF').sort((a,b) => a.totalRaceTime - b.totalRaceTime);
        const leaderTime = sortedRacing.length > 0 ? sortedRacing[0].totalRaceTime : 0;
        
        sortedRacing.forEach((d, i) => {
            d.position = i + 1;
            d.totalRaceTime = leaderTime + (i * 0.2);
            d.gapToLeader = i * 0.2;
            d.pittedUnderSCThisPeriod = false;
        });
        
        nextDrivers.sort(sortDrivers);
        nextRaceState.isRestarting = false;
    }

    const newWeather = nextRaceState.masterWeatherForecast[nextRaceState.lap - 1] || nextRaceState.weather;
    if(newWeather !== nextRaceState.weather) {
       lapEvents.push({ type: 'WEATHER_CHANGE', driverName: 'Race Control', data: { newWeather }});
       if (newWeather === 'Extreme Rain') {
           lapEvents.push({ type: 'EMERGENCY_WEATHER', driverName: 'Race Control' });
       }
    }
    let newWaterLevel = nextRaceState.trackCondition.waterLevel;
    if (newWeather === 'Heavy Rain') newWaterLevel = Math.min(100, newWaterLevel + 10);
    else if (newWeather === 'Extreme Rain') newWaterLevel = Math.min(100, newWaterLevel + 25);
    else if (newWeather === 'Light Rain') newWaterLevel = Math.min(100, newWaterLevel + 4);
    else newWaterLevel = Math.max(0, newWaterLevel - 5);
    nextRaceState.weather = newWeather;
    nextRaceState.trackCondition = { waterLevel: newWaterLevel, gripLevel: 100 - newWaterLevel };

    const isWet = newWeather === 'Light Rain' || newWeather === 'Heavy Rain' || newWeather === 'Extreme Rain';
    for (const driver of nextDrivers) {
        driver.pittedThisLap = false;
        if (driver.raceStatus === 'Crashed' || driver.raceStatus === 'DNF' || nextRaceState.flag === RaceFlag.Red) {
            continue;
        }
        
        const driverForm = Number.isFinite(driver.form) ? driver.form : 0;

        let lapPerformanceModifier = (1 - driver.driverSkills.consistency / 110) * (Math.random() - 0.5) * 2.4; // -1 to 1 range, scaled by consistency
        lapPerformanceModifier += (driverForm / 8); // Form has a stronger effect
        if (driver.driverSkills.trait?.id === 'CLUTCH_PERFORMER' && nextRaceState.lap > nextRaceState.totalLaps - 10) {
            lapPerformanceModifier -= 0.1; // Small boost in final laps
        }

        if (driver.gripAdvantage && driver.gripAdvantage.forLaps > 0) {
            driver.gripAdvantage.forLaps--;
        }
        if (driver.gripAdvantage && driver.gripAdvantage.forLaps <= 0) {
            driver.gripAdvantage = null;
        }

        const teamForecast = nextRaceState.teamWeatherForecasts[driver.car.teamName] || nextRaceState.masterWeatherForecast;
        const currentTyre = driver.currentTyres.compound;
        const wasOnSlicks = currentTyre === TyreCompound.Soft || currentTyre === TyreCompound.Medium || currentTyre === TyreCompound.Hard;
        const teamPersonnel = personnelMap.get(driver.car.teamName);
        const strategyRating = teamPersonnel ? (((teamPersonnel.teamPrincipal?.leadership || 15) + (teamPersonnel.headOfTechnical?.innovation || 15)) / 40) * 100 : 75;
        const lapsToLookAhead = strategyRating > 90 ? 2 : 1;
        const predictedWeatherInWindow = teamForecast.slice(nextRaceState.lap, nextRaceState.lap + lapsToLookAhead);
        const rainIsComing = predictedWeatherInWindow.some(w => w === 'Light Rain' || w === 'Heavy Rain');
        const trackIsDrying = predictedWeatherInWindow.every(w => w === 'Sunny' || w === 'Cloudy');

        let ersRegen = 15;
        if (driver.paceMode === 'Conserving') ersRegen += 10;
        if (nextRaceState.flag === RaceFlag.SafetyCar) ersRegen = 25;
        driver.ersCharge = Math.min(100, driver.ersCharge + ersRegen);

        const pitDecisionLap = driver.strategy.pitStops[driver.pitStops]?.lap;
        const canAttemptOvercut = driver.battle && driver.battle.forLaps > 2 && driver.driverSkills.tyreManagement > 92 && driver.currentTyres.wear < 60;
        const isNearPitWindowForOvercut = pitDecisionLap && Math.abs(nextRaceState.lap - pitDecisionLap) <= 2;
        let isAttemptingOvercut = false;
        if (canAttemptOvercut && isNearPitWindowForOvercut && Math.random() < 0.4) {
            isAttemptingOvercut = true;
            lapEvents.push({ type: 'TEAM_RADIO', driverName: driver.name, data: { message: `is told 'Stay out, stay out, we're going for the overcut!'` } });
        }

        if (driver.raceStatus === 'In Pits' || (driver.pittingForTyre && !driver.pittedThisLap)) driver.paceMode = 'Pushing';
        else if (driver.pittedThisLap) driver.paceMode = 'Pushing';
        else if (driver.battle && driver.battle.forLaps > 1 && driver.currentTyres.wear < 90) driver.paceMode = 'Pushing';
        else if (isAttemptingOvercut) driver.paceMode = 'Standard';
        else if (driver.currentTyres.wear > 80 && driver.strategy.pitStops.length > driver.pitStops) driver.paceMode = 'Conserving';
        else driver.paceMode = 'Standard';

        let needsToPitForWeather = (isWet && wasOnSlicks) || (!isWet && !wasOnSlicks && newWaterLevel < 5) || (rainIsComing && wasOnSlicks) || (trackIsDrying && !wasOnSlicks && nextRaceState.trackCondition.waterLevel < 10);
        
        if (newWeather === 'Extreme Rain' && currentTyre !== TyreCompound.Wet) {
            needsToPitForWeather = true;
            lapEvents.push({ type: 'TEAM_RADIO', driverName: driver.name, data: { message: `is told 'BOX BOX BOX, a monsoon is hitting us!'` } });
        }
        else if (newWeather === 'Heavy Rain' && currentTyre === TyreCompound.Intermediate) {
            if (teamPersonnel && teamPersonnel.teamPrincipal && teamPersonnel.headOfTechnical) {
                const waterLevelFactor = nextRaceState.trackCondition.waterLevel / 100;
                let pitChance = 0.2 + (waterLevelFactor * 0.7) + ((strategyRating - 75) / 100 * 0.2);
                if (Math.random() < pitChance) {
                    needsToPitForWeather = true;
                    lapEvents.push({ type: 'TEAM_RADIO', driverName: driver.name, data: { message: `is told 'Box now for Wets, the rain is too heavy!'` } });
                }
            }
        }

        if (nextRaceState.flag === RaceFlag.SafetyCar && !driver.pittedUnderSCThisPeriod && driver.raceStatus === 'Racing') {
            const remainingLaps = nextRaceState.totalLaps - nextRaceState.lap;
            const slickCompoundsUsed = new Set(driver.compoundsUsed.filter(c => c !== TyreCompound.Intermediate && c !== TyreCompound.Wet));
            const isSlickOnlyRace = !driver.hasUsedWetTyre;
            const hasFulfilledTyreRule = !isSlickOnlyRace || slickCompoundsUsed.size >= 2;

            const mustPitForWeather = (isWet && wasOnSlicks) || (!isWet && !wasOnSlicks && newWaterLevel < 5);
            const mustPitForWear = driver.currentTyres.wear > 85 || driver.currentTyres.condition === 'Blistering';
            
            let tyreLifeMultiplier = 1.6 - (driver.driverSkills.tyreManagement / 100);
            if (driver.driverSkills.trait?.id === 'TYRE_WHISPERER') tyreLifeMultiplier += 0.2;
            const adjustedTyreLife = TYRE_LIFE[driver.currentTyres.compound] * tyreLifeMultiplier;
            const lapsLeftOnTyre = adjustedTyreLife * (1 - driver.currentTyres.wear / 100);
            const cannotMakeEnd = lapsLeftOnTyre < remainingLaps + 2;

            const isStrategicallyPoorTyre = (driver.currentTyres.compound === TyreCompound.Soft && remainingLaps > TYRE_LIFE.Soft + 5) || 
                                             (driver.currentTyres.compound === TyreCompound.Medium && remainingLaps > TYRE_LIFE.Medium + 5);

            const needsCompoundForStint = !hasFulfilledTyreRule && cannotMakeEnd;

            const shouldConsiderPitting = mustPitForWeather || mustPitForWear || (cannotMakeEnd && (driver.pitStops < driver.strategy.pitStops.length)) || isStrategicallyPoorTyre || needsCompoundForStint;

            if (shouldConsiderPitting) {
                const position = driver.position;
                let scPitChance = 0.0;
                if (position > 12) scPitChance = 0.95;
                else if (position > 4) scPitChance = 0.75;
                else if (position > 1) scPitChance = 0.40;
                else scPitChance = 0.15;
                
                const tyreSkillModifier = (85 - driver.driverSkills.tyreManagement) * 0.005;
                scPitChance += tyreSkillModifier;

                if(mustPitForWear) scPitChance += 0.5;

                if (Math.random() < scPitChance) {
                    driver.raceStatus = 'In Pits';
                    driver.pittedUnderSCThisPeriod = true;
                    lapEvents.push({ type: 'PIT_ENTRY', driverName: driver.name, data: { message: 'takes a tactical stop under the SC!'}});
                    driver.pittingForTyre = determineNextTyreForPitStop(driver, nextRaceState, newWaterLevel, teamForecast, isWet, rainIsComing, trackIsDrying);
                }
            }
        }
        
        if (driver.raceStatus === 'Limping') {
            driver.lapTime = nextRaceState.track.baseLapTime + 45;
            driver.raceStatus = 'In Pits';
        } else if (driver.raceStatus === 'In Pits') {
            driver.pittedThisLap = true;
            driver.lapTime = nextRaceState.track.baseLapTime + nextRaceState.track.pitLaneTimeLoss;
            if (driver.hqModifiers?.pitStopTimeDelta) {
                driver.lapTime -= driver.hqModifiers.pitStopTimeDelta;
            }
            const unservedTimePenalties = driver.penalties.filter(p => p.type === 'Time' && !p.served);
            if (unservedTimePenalties.length > 0) {
                const totalPenaltyToServe = unservedTimePenalties.reduce((sum, p) => sum + p.duration, 0);
                driver.lapTime += totalPenaltyToServe;
                unservedTimePenalties.forEach(p => p.served = true);
                lapEvents.push({ type: 'LAP_EVENT', driverName: driver.name, data: { message: `serves ${totalPenaltyToServe}s of penalties.` } });
            }
            if (driver.isDamaged) {
                driver.lapTime += 25;
                const repairSuccess = Math.random() < driver.car.reliability / 100;
                if (!repairSuccess) {
                    driver.raceStatus = 'DNF';
                    driver.retirementLap = nextRaceState.lap;
                    driver.retirementReason = 'Damage';
                    lapEvents.push({type: 'REPAIR_FAILURE', driverName: driver.name});
                    continue;
                }
                driver.isDamaged = false;
                lapEvents.push({type: 'REPAIR_SUCCESS', driverName: driver.name});
            } else {
                const pitCrewRating = (teamPersonnel?.facilities.chassis || 5) * 5 + (teamPersonnel?.teamPrincipal?.leadership || 10) * 2.5; // Max 75
                const pitRoll = Math.random();
                const fastStopChance = Math.max(0, (pitCrewRating - 50) / 100 * 0.4); // max ~10%
                const baseMistakeDelta = driver.hqModifiers?.pitMistakeChanceDelta ? driver.hqModifiers.pitMistakeChanceDelta / 100 : 0;
                const disastrousStopChance = Math.max(0, (60 - pitCrewRating) / 100 * 0.2) + baseMistakeDelta; // max ~10%
                
                if (pitRoll < fastStopChance) {
                    driver.lapTime -= 0.8;
                    lapEvents.push({type: 'FAST_PIT_STOP', driverName: driver.name});
                } else if (pitRoll < fastStopChance + disastrousStopChance) {
                    driver.lapTime += 6;
                    lapEvents.push({type: 'DISASTROUS_PIT_STOP', driverName: driver.name});
                } else if (pitRoll < fastStopChance + disastrousStopChance + 0.15 + baseMistakeDelta) { // 15% base chance of a slow stop
                    driver.lapTime += 3;
                    lapEvents.push({type: 'SLOW_PIT_STOP', driverName: driver.name});
                }

                const speedingChance = 0.01 + ((driver.driverSkills.aggressionIndex - 75) / 100 * 0.01) + ((100 - driver.driverSkills.consistency) / 100 * 0.01);
                if (Math.random() < speedingChance) {
                    const penaltyDuration = Math.random() < 0.8 ? 5 : 10;
                    const reason = "speeding in the pit lane";
                    driver.penalties.push({ type: 'Time', duration: penaltyDuration, served: false, reason });
                    lapEvents.push({ type: 'TIME_PENALTY', driverName: driver.name, data: { duration: penaltyDuration, reason } });
                }
            }

            let nextTyre = driver.pittingForTyre || driver.strategy.pitStops[driver.pitStops]?.tyre || TyreCompound.Hard;
            
            const strategyErrorChance = (80 - strategyRating) / 100 * 0.15;
            if (Math.random() < strategyErrorChance) {
                const wasOptimal = nextTyre;
                if (wasOptimal === TyreCompound.Intermediate && teamForecast[nextRaceState.lap - 1] !== 'Heavy Rain') {
                    nextTyre = TyreCompound.Wet;
                } else if (wasOptimal === TyreCompound.Wet && newWaterLevel < 50) {
                    nextTyre = TyreCompound.Intermediate;
                } else if (wasOptimal === TyreCompound.Medium) {
                    nextTyre = TyreCompound.Soft;
                }
                if (wasOptimal !== nextTyre) {
                    lapEvents.push({ type: 'STRATEGY_ERROR', driverName: driver.name, data: { message: `gets the wrong tyres! They wanted ${wasOptimal} but got ${nextTyre}!` } });
                }
            }
            
            driver.currentTyres = { compound: nextTyre, wear: 0, age: 0, temperature: TIRE_BLANKET_TEMP, condition: 'Cold' };

            const isNowWetTyre = nextTyre === TyreCompound.Intermediate || nextTyre === TyreCompound.Wet;
            const isNowSlickTyre = !isNowWetTyre;
            const upcomingWeather = nextRaceState.masterWeatherForecast.slice(nextRaceState.lap, nextRaceState.lap + 2);
            const trackWasDamp = prevRaceState.trackCondition.waterLevel > 5;

            if (wasOnSlicks && isNowWetTyre && upcomingWeather.some(w => w.includes('Rain'))) {
                const bonus = 0.15 + (strategyRating - 75) * 0.005;
                driver.gripAdvantage = { forLaps: 3, bonus };
                lapEvents.push({ type: 'BRILLIANT_STRATEGY', driverName: driver.name, data: { message: `nails the strategy, pitting for ${nextTyre}s just as the rain arrives!` } });
            }

            if (!wasOnSlicks && isNowSlickTyre && trackWasDamp && upcomingWeather.every(w => !w.includes('Rain'))) {
                const bonus = 0.15 + (strategyRating - 75) * 0.005;
                driver.gripAdvantage = { forLaps: 3, bonus };
                lapEvents.push({ type: 'BRILLIANT_STRATEGY', driverName: driver.name, data: { message: `makes a brave call to slicks and it pays off as the track dries!` } });
            }

            driver.pittingForTyre = undefined;
            driver.raceStatus = 'Racing';
            driver.pitStops += 1;

            if (!driver.compoundsUsed.includes(nextTyre)) {
                driver.compoundsUsed.push(nextTyre);
            }
            const isNextTyreWetType = nextTyre === TyreCompound.Intermediate || nextTyre === TyreCompound.Wet;
            if (isNextTyreWetType) {
                driver.hasUsedWetTyre = true;
            }
            
            lapEvents.push({ type: 'PIT_EXIT', driverName: driver.name, data: { tyre: nextTyre } });
        } else {
            const specialties = driver.driverSkills.specialties || [];
            const normalizedSpecialties = specialties.map(s => s.toLowerCase());
            const carLinkImpact = calculateCarLinkImpact(driver, { lapNumber: nextRaceState.lap, session: 'race' });

            let baseLapTime = nextRaceState.track.baseLapTime + (newWaterLevel / 10);

            if (!Number.isFinite(baseLapTime)) {
                const driverPaceAnchor = clampNumber(driver.driverSkills.overall ?? 80, 80, 40, 120);
                const individuality = (Math.random() - 0.5) * 1.5;
                baseLapTime = Math.max(
                    70,
                    (nextRaceState.track.baseLapTime || baseLapReference) + ((100 - driverPaceAnchor) * 0.04) + individuality,
                );
            }

            if (driver.hqModifiers?.lapTimeModifier) {
                baseLapTime -= driver.hqModifiers.lapTimeModifier;
            }

            if (driver.gripAdvantage) {
                baseLapTime -= driver.gripAdvantage.bonus;
            }

            const trackWinners = raceHistory[nextRaceState.track.name] || [];
            if (trackWinners.some(w => w.winnerId === driver.id)) {
                baseLapTime -= 0.15;
            }

            baseLapTime -= carLinkImpact.synergyBonus;
            baseLapTime += carLinkImpact.adaptationDrag;

            const raceTSM = calculateRaceTSM(driver.car, nextRaceState.track);
            baseLapTime -= raceTSM;

            const tyreProps = TYRE_PROPERTIES[driver.currentTyres.compound];
            const [idealMin, idealMax] = tyreProps.idealTempRange;

            let heatInput = 0;
            if (driver.paceMode === 'Pushing') heatInput += 8;
            else if (driver.paceMode === 'Standard') heatInput += 5;
            else heatInput += 2;
            if (driver.battle) heatInput += 2;
            heatInput += nextRaceState.track.tyreStress;
            heatInput *= tyreProps.heatGenerationFactor;
            let heatManagementMultiplier = 1 - (driver.driverSkills.tyreManagement - 85) / 140;
            if (driver.driverSkills.trait?.id === 'TYRE_WHISPERER') heatManagementMultiplier -= 0.2;
            if (normalizedSpecialties.some(s => s.includes('heat'))) heatManagementMultiplier -= 0.05;
            heatInput *= heatManagementMultiplier;

            const heatDissipation = (5 + (1 - (driver.battle ? 1 : 0)) * 2) * tyreProps.heatDissipationFactor;

            driver.currentTyres.temperature += (heatInput - heatDissipation);
            driver.currentTyres.temperature = Math.max(nextRaceState.airTemp, Math.min(150, driver.currentTyres.temperature));

            if (driver.currentTyres.temperature < idealMin) driver.currentTyres.condition = 'Cold';
            else if (driver.currentTyres.temperature > idealMax) driver.currentTyres.condition = 'Hot';
            else driver.currentTyres.condition = 'Optimal';

            if (driver.currentTyres.condition === 'Cold' && driver.paceMode === 'Pushing' && Math.random() < 0.15) {
                driver.currentTyres.condition = 'Graining';
            }
            if (driver.currentTyres.condition === 'Hot' && driver.currentTyres.age > 5 && Math.random() < 0.1) {
                 driver.currentTyres.condition = 'Blistering';
            }
            
            let tyrePenalty = 0;
            if (driver.currentTyres.condition === 'Cold') {
                tyrePenalty += (idealMin - driver.currentTyres.temperature) * 0.08;
            } else if (driver.currentTyres.condition === 'Hot') {
                tyrePenalty += (driver.currentTyres.temperature - idealMax) * 0.06;
            } else if (driver.currentTyres.condition === 'Graining') {
                tyrePenalty += 1.5;
            } else if (driver.currentTyres.condition === 'Blistering') {
                tyrePenalty += 2.5;
            }
            let wearPenalty = (driver.currentTyres.wear / 100) * 1.5;
            if (driver.currentTyres.wear > 70) wearPenalty += Math.pow((driver.currentTyres.wear - 70) / 10, 2) * 0.15;
            baseLapTime += tyrePenalty + wearPenalty;

            if (driver.paceMode === 'Pushing') baseLapTime -= 0.3;
            if (driver.paceMode === 'Conserving') baseLapTime += 0.4;

            if (isWet) {
                if (wasOnSlicks) baseLapTime += (newWeather === 'Extreme Rain' ? 60 : newWeather === 'Heavy Rain' ? 45 : 25);
                else if (currentTyre === TyreCompound.Intermediate && (newWeather === 'Heavy Rain' || newWeather === 'Extreme Rain')) baseLapTime += newWeather === 'Extreme Rain' ? 25 : 15;
                else if (currentTyre === TyreCompound.Wet && newWeather === 'Light Rain') baseLapTime += 6;
            } else if (!wasOnSlicks) baseLapTime += 12;
            baseLapTime += driver.fuelLoad * 0.03;
            const paceEdge = (driver.driverSkills.overall - 80) * 0.016;
            const qualiSharpness = Math.max(0, driver.driverSkills.qualifyingPace - 80) * 0.009;
            const focusDrag = (100 - driver.driverSkills.consistency) * 0.013;

            let specialtyLapBonus = 0;
            if (normalizedSpecialties.some(s => s.includes('qual'))) specialtyLapBonus += 0.08;
            if (normalizedSpecialties.some(s => s.includes('race')) || normalizedSpecialties.some(s => s.includes('pace'))) specialtyLapBonus += 0.05;
            if (normalizedSpecialties.some(s => s.includes('wet'))) specialtyLapBonus += isWet ? 0.12 : 0.02;
            if (normalizedSpecialties.some(s => s.includes('night'))) specialtyLapBonus += (newWeather === 'Light Rain' || newWeather === 'Heavy Rain') ? 0.04 : 0.02;

            baseLapTime -= paceEdge + qualiSharpness;
            baseLapTime -= specialtyLapBonus;
            baseLapTime += focusDrag;

            let wetWeatherEffect = (1.1 + (100 - driver.driverSkills.wetWeatherSkill) / 100 * 0.3);
            if (driver.driverSkills.trait?.id === 'RAIN_MASTER') wetWeatherEffect -= 0.1;
            if (isWet) baseLapTime *= wetWeatherEffect;
            if (newWeather === 'Extreme Rain') baseLapTime *= 1.15;
            if (nextRaceState.flag === RaceFlag.SafetyCar) baseLapTime *= 1.5;
            if (nextRaceState.flag === RaceFlag.VirtualSafetyCar) baseLapTime *= 1.3;
            if (driver.raceStatus === 'Damaged') baseLapTime *= 1.05;
            let raceCraftPenalty = (100 - driver.driverSkills.raceCraft) * 0.026;
            if (normalizedSpecialties.some(s => s.includes('defens')) || normalizedSpecialties.some(s => s.includes('racecraft'))) {
                raceCraftPenalty *= 0.8;
            }
            baseLapTime += raceCraftPenalty + lapPerformanceModifier;

            try {
                const flagMultiplier = nextRaceState.flag === RaceFlag.SafetyCar ? 1.5
                    : nextRaceState.flag === RaceFlag.VirtualSafetyCar ? 1.3 : 1.0;
                const weatherMultiplier = (newWeather === 'Extreme Rain') ? 1.15 : 1.0;
                const modifiers = {
                    weatherMultiplier,
                    flagMultiplier,
                    raceCraftPenalty,
                    lapPerformanceModifier,
                    baseLapReference,
                };
                const rawBaseLapTime = baseLapTime;
                console.debug('[LAPTIME DEBUG] before computeSafeLapTime', { driver: driver.name, rawBaseLapTime, modifiers });
                const safeLapTime = computeSafeLapTime(rawBaseLapTime, modifiers);
                console.debug('[LAPTIME DEBUG] computed safeLapTime', { driver: driver.name, safeLapTime });
                driver.lapTime = safeLapTime;
            } catch (err) {
                console.error('Lap time computation failed, using fallback lap time', err);
                driver.lapTime = buildFallbackLapTime(driver, baseLapReference, safeTrack);
            }

            if (driver.raceStatus === 'Racing' && nextRaceState.flag === RaceFlag.Green && (!fastestLap || driver.lapTime < fastestLap.time)) {
                setFastestLap({ driverName: driver.name, time: driver.lapTime });
                lapEvents.push({ type: 'FASTEST_LAP', driverName: driver.name, data: { time: driver.lapTime }});
            }
        }

        const lapTimeApplied = Number.isFinite(driver.lapTime) && driver.lapTime > 0
            ? safeClampNumber(driver.lapTime, baseLapReference, 40, 400)
            : buildFallbackLapTime(driver, baseLapReference, safeTrack);

        const startingTotalTime = Number.isFinite(driver.totalRaceTime)
            ? driver.totalRaceTime
            : lapTimeApplied;

        driver.lapTime = lapTimeApplied;
        driver.totalRaceTime = safeClampNumber(startingTotalTime + lapTimeApplied, lapTimeApplied, 0, Number.MAX_SAFE_INTEGER);
        let fuelConsumption = 1.8;
        if (driver.paceMode === 'Pushing') fuelConsumption *= 1.1;
        if (driver.paceMode === 'Conserving') fuelConsumption *= 0.85;
        driver.fuelLoad = Math.max(0, driver.fuelLoad - fuelConsumption);

        const trackStressModifier = 0.7 + (nextRaceState.track.tyreStress / 5) * 0.6;
        const baseDeg = (100 / (TYRE_LIFE[driver.currentTyres.compound] || 30)) * trackStressModifier;
        let driverTyreMultiplier = Math.max(0.55, 1.8 - (driver.driverSkills.tyreManagement / 90));
        if (driver.driverSkills.trait?.id === 'TYRE_WHISPERER') driverTyreMultiplier -= 0.4;
        if (normalizedSpecialties.some(s => s.includes('tyre') || s.includes('stint'))) driverTyreMultiplier -= 0.1;
        const carTyreMultiplier = 1.3 - (driver.car.tyreWearFactor / 100);
        let degradation = baseDeg * driverTyreMultiplier * carTyreMultiplier;
        if (driver.paceMode === 'Pushing') degradation *= 1.2;
        if (driver.paceMode === 'Conserving') degradation *= 0.7;
        if (!isWet && wasOnSlicks === false) degradation *= 3.5;
        if (isWet) degradation *= 0.7;

        if (driver.hqModifiers?.tyreDegMultiplier) degradation *= driver.hqModifiers.tyreDegMultiplier;

        if (driver.currentTyres.condition === 'Hot' || driver.currentTyres.condition === 'Blistering') degradation *= 1.5;
        if (driver.currentTyres.condition === 'Cold' || driver.currentTyres.condition === 'Graining') degradation *= 1.3;

        driver.currentTyres.wear = Math.min(100, driver.currentTyres.wear + degradation);
        driver.currentTyres.age += 1;
        
        const remainingLaps = nextRaceState.totalLaps - nextRaceState.lap;
        let shouldPitThisLap = false;
        let pitReasonMessage = '';

        if (remainingLaps > 0) {
            if (driver.raceStatus === 'Damaged') {
                shouldPitThisLap = true;
                pitReasonMessage = 'is pitting for repairs!';
            } else if (needsToPitForWeather) {
                shouldPitThisLap = true;
                pitReasonMessage = 'is pitting for the correct weather tyres!';
            } else {
                const isSlickOnlyRace = !driver.hasUsedWetTyre;
                const slickCompoundsUsed = new Set(driver.compoundsUsed.filter(c => c !== TyreCompound.Intermediate && c !== TyreCompound.Wet));
                const hasFulfilledTyreRule = !isSlickOnlyRace || slickCompoundsUsed.size >= 2;
                if (!hasFulfilledTyreRule && remainingLaps <= 2) {
                    shouldPitThisLap = true;
                    pitReasonMessage = 'makes their mandatory final stop!';
                }
            }
        }
        
        if (!shouldPitThisLap && remainingLaps > 1) {
            const areTyresCritical = driver.currentTyres.wear > 95 || driver.currentTyres.condition === 'Blistering';
            const isPlannedPitLap = driver.strategy.pitStops[driver.pitStops]?.lap <= nextRaceState.lap && !isAttemptingOvercut;
            const shouldAttemptUndercut = driver.battle && driver.battle.forLaps > 2 && nextRaceState.track.overtakingDifficulty > 3 && Math.random() < 0.4;
            
            const needsStrategicStop = areTyresCritical || isPlannedPitLap || shouldAttemptUndercut;

            if (needsStrategicStop) {
                let tyreLifeMultiplier = Math.max(0.7, 1.8 - (driver.driverSkills.tyreManagement / 90));
                if (driver.driverSkills.trait?.id === 'TYRE_WHISPERER') tyreLifeMultiplier += 0.2;
                const adjustedTyreLife = TYRE_LIFE[driver.currentTyres.compound] * tyreLifeMultiplier;
                const lapsLeftOnTyre = adjustedTyreLife * (1 - driver.currentTyres.wear / 100);
                
                if (lapsLeftOnTyre >= remainingLaps + 2 && remainingLaps < 10) {
                    shouldPitThisLap = false;
                } else if (areTyresCritical) {
                    const positionFactor = Math.max(0, (10 - driver.position) / 10) * 0.3;
                    const consistencyFactor = ((driver.driverSkills.consistency - 80) / 100) * 0.4;
                    const gambleChance = 0.2 + positionFactor + consistencyFactor;

                    if (Math.random() < gambleChance) {
                        shouldPitThisLap = false;
                        lapEvents.push({ type: 'TEAM_RADIO', driverName: driver.name, data: { message: `is told 'Stay out, bring it home, these tyres have to last!'` } });
                    } else {
                        shouldPitThisLap = true;
                        pitReasonMessage = 'is forced to pit with worn tyres!';
                        if (driver.currentTyres.condition === 'Blistering') pitReasonMessage = 'is forced to pit with blistering tyres!';
                    }
                } else {
                    shouldPitThisLap = true;
                    if (shouldAttemptUndercut) pitReasonMessage = 'goes for the undercut!';
                }
            }
        }

        if (driver.raceStatus !== 'In Pits' && !driver.pittedThisLap && shouldPitThisLap) {
            driver.raceStatus = 'In Pits';
            
            driver.pittingForTyre = determineNextTyreForPitStop(
                driver, nextRaceState, newWaterLevel, teamForecast,
                isWet, rainIsComing, trackIsDrying
            );

            lapEvents.push({ type: 'PIT_ENTRY', driverName: driver.name, data: { message: pitReasonMessage } });
        }
    }

    let incidentData = simulateLapIncidents(nextDrivers, nextRaceState.track, newWeather, nextRaceState.trackCondition, nextRaceState.lap);
    nextDrivers = incidentData.updatedDrivers;
    lapEvents.push(...incidentData.lapEvents);
    flagTriggers.push(...incidentData.flagTriggers);

     if (nextRaceState.flag === RaceFlag.Green) {
        nextDrivers.sort((a,b) => a.totalRaceTime - b.totalRaceTime);
        for (let i = 1; i < nextDrivers.length; i++) {
            const defender = nextDrivers[i - 1];
            const attacker = nextDrivers[i];
            if (attacker.raceStatus === 'Racing' && defender.raceStatus === 'Racing') {
                const timeDiff = attacker.totalRaceTime - defender.totalRaceTime;
                if (timeDiff < 1.2) {
                    let attackingProwess = 0;
                    let defensiveSkill = 0;
                    
                    attackingProwess += attacker.driverSkills.raceCraft * 1.4;
                    if (attacker.driverSkills.trait?.id === 'THE_OVERTAKER') attackingProwess += 10;
                    attackingProwess += (attacker.driverSkills.aggressionIndex - 75) * 0.3;
                    attackingProwess += (attacker.car.overallPace - 85) * 0.5;
                    if (attacker.paceMode === 'Pushing') attackingProwess += 8;
                    if (attacker.paceMode === 'Conserving') attackingProwess -= 5;

                    defensiveSkill += defender.driverSkills.raceCraft * 1.2;
                    if (defender.driverSkills.trait?.id === 'THE_WALL') defensiveSkill += 10;
                    defensiveSkill += (defender.driverSkills.consistency - 85) * 0.45;
                    defensiveSkill += (defender.car.overallPace - 85) * 0.5;
                    if (defender.paceMode === 'Conserving') defensiveSkill -= 8;
                    
                    const tyreAdvantage = getTyreAdvantage(attacker.currentTyres, defender.currentTyres) * 100;
                    attackingProwess += tyreAdvantage;
                    
                    if (timeDiff < 1.0) {
                        let drsBonus = nextRaceState.track.drsEffectiveness * 4;
                        if (i > 1) {
                            const carInFrontOfDefender = nextDrivers[i - 2];
                            if (carInFrontOfDefender.raceStatus === 'Racing' && (defender.totalRaceTime - carInFrontOfDefender.totalRaceTime) < 1.0) {
                                drsBonus *= 0.4;
                            }
                        }
                        attackingProwess += drsBonus;
                    }
                    
                    let attackerUsedERS = false;
                    let defenderUsedERS = false;
                    const ersAttackChance = 0.28 + ((attackingProwess - defensiveSkill) / 80) + (attacker.driverSkills.aggressionIndex / 250);
                    if (attacker.ersCharge >= 20 && Math.random() < ersAttackChance) {
                        attackingProwess += 15;
                        attackerUsedERS = true;
                    }
                    
                    if (defender.ersCharge >= 15 && attackerUsedERS) {
                        const defendSuccessChance = 0.5 + (defender.driverSkills.raceCraft / 250);
                        if (Math.random() < defendSuccessChance) {
                            defensiveSkill += 12;
                            defenderUsedERS = true;
                        }
                    }
                    
                    const baseChance = 0.45 - (nextRaceState.track.overtakingDifficulty * 0.1);
                    const skillDelta = attackingProwess - defensiveSkill;
                    let finalOvertakeChance = baseChance + (skillDelta / 100) * 0.5;

                    if (nextRaceState.track.overtakingDifficulty >= 4) {
                        finalOvertakeChance *= 0.7;
                    }
                    
                    if (Math.random() < finalOvertakeChance) {
                        if (attackerUsedERS) attacker.ersCharge -= 20;
                        if (defenderUsedERS) defender.ersCharge -= 15;
                        [nextDrivers[i], nextDrivers[i - 1]] = [defender, attacker];
                        lapEvents.push({ type: 'OVERTAKE', driverName: attacker.name, data: { target: defender.name, position: defender.position } });
                        attacker.battle = null;
                    } else {
                        if (timeDiff < 0.5) {
                            if (attacker.battle && attacker.battle.withDriverName === defender.name) {
                                attacker.battle.forLaps++;
                            } else {
                                attacker.battle = { withDriverName: defender.name, forLaps: 1 };
                            }
                            
                            if (attacker.battle.forLaps >= 2) {
                                let attackerMistakeChance = (100 - attacker.driverSkills.consistency) * 0.002 + (attacker.driverSkills.aggressionIndex > 90 ? 0.05 : 0);
                                if (attacker.driverSkills.trait?.id === 'ERROR_PRONE') attackerMistakeChance *= 1.5;
                                if (attacker.driverSkills.trait?.id === 'MR_CONSISTENT') attackerMistakeChance *= 0.5;

                                let defenderMistakeChance = (100 - defender.driverSkills.consistency) * 0.002;
                                if (defender.driverSkills.trait?.id === 'ERROR_PRONE') defenderMistakeChance *= 1.5;
                                if (defender.driverSkills.trait?.id === 'MR_CONSISTENT') defenderMistakeChance *= 0.5;

                                if (Math.random() < attackerMistakeChance) {
                                    attacker.totalRaceTime += 0.8;
                                    attacker.battle = null;
                                    lapEvents.push({ type: 'WIDE_MOMENT', driverName: attacker.name });
                                } else if (Math.random() < defenderMistakeChance) {
                                    defender.totalRaceTime += 0.8;
                                    lapEvents.push({ type: 'LOCK_UP', driverName: defender.name });
                                } else {
                                    lapEvents.push({ type: 'BATTLE', driverName: attacker.name, data: { target: defender.name, position: defender.position } });
                                }
                            }
                        }
                    }
                } else {
                    attacker.battle = null;
                }
            }
        }
    }
    
    if (nextRaceState.flag === RaceFlag.SafetyCar && nextRaceState.flagLaps === 1) {
        addLog(`Safety Car is in this lap. Lapped cars are now permitted to overtake.`);
    }
    
    if (nextRaceState.flagLaps > 0) {
        nextRaceState.flagLaps -= 1;
    }

    if (nextRaceState.flagLaps === 0 && nextRaceState.flag !== RaceFlag.Green) {
         if (nextRaceState.flag === RaceFlag.Red) {
            addLog(`Track is clear. The cars will reform for a restart.`);
            nextRaceState.isRestarting = true;
            nextRaceState.flag = RaceFlag.Green;
         } else {
            addLog(`${nextRaceState.flag} period ending. We are back to Green Flag racing!`);
            nextRaceState.flag = RaceFlag.Green;
            nextDrivers.forEach(d => { d.pittedUnderSCThisPeriod = false; });
         }
    }

    if (nextRaceState.flag === RaceFlag.Green) {
         if (flagTriggers.includes(RaceFlag.Red) && nextRaceState.lap < nextRaceState.totalLaps - 5) {
            nextRaceState.flag = RaceFlag.Red;
            nextRaceState.flagLaps = 2;
            lapEvents.unshift({ type: 'RED_FLAG', driverName: 'Race Control' });
        } else if (flagTriggers.includes(RaceFlag.SafetyCar)) {
            nextRaceState.flag = RaceFlag.SafetyCar;
            nextRaceState.flagLaps = 3;
            lapEvents.unshift({ type: 'SAFETY_CAR', driverName: 'Race Control' });
        } else if (flagTriggers.includes(RaceFlag.VirtualSafetyCar)) {
            nextRaceState.flag = RaceFlag.VirtualSafetyCar;
            nextRaceState.flagLaps = 2;
            lapEvents.unshift({ type: 'VSC', driverName: 'Race Control' });
        } else if (flagTriggers.includes(RaceFlag.Yellow)) {
            nextRaceState.flag = RaceFlag.Yellow;
            nextRaceState.flagLaps = 1;
            lapEvents.unshift({ type: 'YELLOW_FLAG', driverName: 'Race Control' });
        }
    }
    
    nextDrivers = nextDrivers.map(driver => sanitizeLapTiming(driver, baseLapReference, safeTrack));

    nextDrivers.sort(sortDrivers);
    const leaderTime = nextDrivers.find(d => d.raceStatus !== 'Crashed' && d.raceStatus !== 'DNF')?.totalRaceTime || 0;
    nextDrivers.forEach((driver, i) => {
        driver.position = i + 1;
        if (driver.raceStatus !== 'Crashed' && driver.raceStatus !== 'DNF') driver.gapToLeader = driver.totalRaceTime - leaderTime;
    });

    const displayDelay = (lapEvents.length * 400 > 1500) ? 1500 / lapEvents.length : 400;
    lapEvents.forEach((event, index) => setTimeout(() => addLog(formatEventMessage(event)), index * displayDelay));

    return { nextDrivers, nextRaceState: { ...nextRaceState, lap: nextRaceState.lap + 1 }, lapEvents };
};


const App: React.FC = () => {
  const [gamePhase, setGamePhase] = useState<GamePhase>(GamePhase.TEAM_SELECTION);
  const [offSeasonPhase, setOffSeasonPhase] = useState<OffSeasonPhase>('DEBRIEF');
  const [season, setSeason] = useState<number>(2025);
  const [currentRaceIndex, setCurrentRaceIndex] = useState<number>(0);
  
  const [playerTeam, setPlayerTeam] = useState<string | null>(null);

  const [roster, setRoster] = useState<InitialDriver[]>(INITIAL_DRIVERS);
  const [personnel, setPersonnel] = useState<TeamPersonnel[]>(INITIAL_PERSONNEL);
  const [carRatings, setCarRatings] = useState<{[key: string]: Car}>(CARS);
  const [rookiePool, setRookiePool] = useState<RookieDriver[]>(ROOKIE_POOL);
  const [affiliateCandidates, setAffiliateCandidates] = useState<AffiliateDriver[]>(AFFILIATE_CANDIDATES);
  const [seasonLength, setSeasonLength] = useState<'full' | 'short'>('full');
  const [seasonTracks, setSeasonTracks] = useState<Track[]>(FULL_SEASON_TRACKS);

  const [raceState, setRaceState] = useState<RaceState>({
    lap: 0,
    totalLaps: FULL_SEASON_TRACKS[0].laps,
    track: FULL_SEASON_TRACKS[0],
    weather: 'Sunny',
    flag: RaceFlag.Green,
    flagLaps: 0,
    isRestarting: false,
    trackCondition: { waterLevel: 0, gripLevel: 100 },
    masterWeatherForecast: [],
    teamWeatherForecasts: {},
    airTemp: 25,
    trackTemp: 40,
  });
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [practiceResults, setPracticeResults] = useState<PracticeResult[]>([]);
  const [qualifyingResults, setQualifyingResults] = useState<QualifyingResult[]>([]);
  const [qualifyingStage, setQualifyingStage] = useState<QualifyingStage>('Q1');
  const [q2Drivers, setQ2Drivers] = useState<InitialDriver[]>([]);
  const [q3Drivers, setQ3Drivers] = useState<InitialDriver[]>([]);
  const [log, setLog] = useState<string[]>(['Welcome! Please select a team to begin your management career.']);
  const [fastestLap, setFastestLap] = useState<{ driverName: string; time: number } | null>(null);
  const [simSpeed, setSimSpeed] = useState<number>(1);
  const [commentaryHighlight, setCommentaryHighlight] = useState<string | null>(null);
  const [raceLapEvents, setRaceLapEvents] = useState<LapEvent[]>([]);
  const [aiSummary, setAiSummary] = useState<AiRaceSummary | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState<boolean>(false);
  const [aiSeasonReview, setAiSeasonReview] = useState<AiSeasonReview | null>(null);
  const [isGeneratingSeasonReview, setIsGeneratingSeasonReview] = useState<boolean>(false);
  const [upcomingRaceQuote, setUpcomingRaceQuote] = useState<UpcomingRaceQuote | null>(null);
  
  const [teamFinances, setTeamFinances] = useState<TeamFinances[]>([]);
  const [teamDebriefs, setTeamDebriefs] = useState<TeamDebrief[]>([]);
  const [driverDebriefs, setDriverDebriefs] = useState<DriverDebrief[]>([]);
  const [playerShortlist, setPlayerShortlist] = useState<ShortlistDriver[]>([]);
  const [driverProgressionLog, setDriverProgressionLog] = useState<DriverProgressionEvent[]>([]);
  const [resourceAllocationLog, setResourceAllocationLog] = useState<ResourceAllocationEvent[]>([]);
  const [mvi, setMvi] = useState<number>(0);
  const [staffingLog, setStaffingLog] = useState<PersonnelChangeEvent[]>([]);
  const [affiliateLog, setAffiliateLog] = useState<AffiliateChangeEvent[]>([]);
  const [driverMarketLog, setDriverMarketLog] = useState<DriverMarketEvent[]>([]);
  const [regulationChangeLog, setRegulationChangeLog] = useState<RegulationEvent[]>([]);
  const [devResults, setDevResults] = useState<CarDevelopmentResult[]>([]);
  
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [showHistoryScreen, setShowHistoryScreen] = useState<boolean>(false);
  const [showGarageScreen, setShowGarageScreen] = useState<boolean>(false);
  const [showHqScreen, setShowHqScreen] = useState<boolean>(false);
  const [showHowToPlay, setShowHowToPlay] = useState<boolean>(false);
  const [showSaveModal, setShowSaveModal] = useState<boolean>(false);
  const [showLoadModal, setShowLoadModal] = useState<boolean>(false);
  const [saveCodeValue, setSaveCodeValue] = useState<string>('');
  const [saveStatusMessage, setSaveStatusMessage] = useState<string | null>(null);
  const [loadCodeValue, setLoadCodeValue] = useState<string>('');
  const [loadStatusMessage, setLoadStatusMessage] = useState<string | null>(null);
  const [hqEvent, setHqEvent] = useState<HeadquartersEvent | null>(null);
  const [hqEventRaceKey, setHqEventRaceKey] = useState<string | null>(null);
  const [pendingHqImpact, setPendingHqImpact] = useState<HeadquartersEventResolution | null>(null);
  const [activeHqModifiers, setActiveHqModifiers] = useState<HeadquartersEventResolution | null>(null);
  const [weekendModifiers, setWeekendModifiers] = useState<WeekendModifier[]>([]);

  const mergeHqEffects = useCallback((base: HeadquartersEventEffect, extra: HeadquartersEventEffect): HeadquartersEventEffect => ({
    lapTimeModifier: (base.lapTimeModifier || 0) + (extra.lapTimeModifier || 0),
    qualifyingSkillDelta: (base.qualifyingSkillDelta || 0) + (extra.qualifyingSkillDelta || 0),
    paceDelta: (base.paceDelta || 0) + (extra.paceDelta || 0),
    reliabilityDelta: (base.reliabilityDelta || 0) + (extra.reliabilityDelta || 0),
    tyreLifeMultiplier: (base.tyreLifeMultiplier || 1) * (extra.tyreLifeMultiplier || 1),
    tyreWearDelta: (base.tyreWearDelta || 0) + (extra.tyreWearDelta || 0),
    tyreDegMultiplier: (base.tyreDegMultiplier || 1) * (extra.tyreDegMultiplier || 1),
    dnfRiskDelta: (base.dnfRiskDelta || 0) + (extra.dnfRiskDelta || 0),
    pitStopTimeDelta: (base.pitStopTimeDelta || 0) + (extra.pitStopTimeDelta || 0),
    pitMistakeChanceDelta: (base.pitMistakeChanceDelta || 0) + (extra.pitMistakeChanceDelta || 0),
    moraleDelta: (base.moraleDelta || 0) + (extra.moraleDelta || 0),
    reputationDelta: (base.reputationDelta || 0) + (extra.reputationDelta || 0),
    budgetDelta: (base.budgetDelta || 0) + (extra.budgetDelta || 0),
    engineWearDelta: (base.engineWearDelta || 0) + (extra.engineWearDelta || 0),
    confidenceDelta: (base.confidenceDelta || 0) + (extra.confidenceDelta || 0),
  }), []);

  const raceWeekendKey = useMemo(() => `${season}-${currentRaceIndex}`, [season, currentRaceIndex]);

  const clearHeadquartersState = useCallback(() => {
    setActiveHqModifiers(null);
    setPendingHqImpact(null);
    setHqEvent(null);
    setHqEventRaceKey(null);
    setWeekendModifiers([]);
  }, []);

  useEffect(() => {
    setPendingHqImpact(prev => (prev && prev.raceKey && prev.raceKey !== raceWeekendKey ? null : prev));
    setActiveHqModifiers(prev => (prev && prev.raceKey && prev.raceKey !== raceWeekendKey ? null : prev));
    setWeekendModifiers(prev => prev.filter(mod => !mod.raceKey || mod.raceKey === raceWeekendKey));
    setHqEvent(prev => (prev && hqEventRaceKey && hqEventRaceKey !== raceWeekendKey ? null : prev));
    setHqEventRaceKey(prev => (prev && prev !== raceWeekendKey ? null : prev));
  }, [hqEventRaceKey, raceWeekendKey]);

  const weekendModifierMap = useMemo(() => {
    const byTeam = new Map<string, WeekendModifier[]>();

    if (activeHqModifiers && (!activeHqModifiers.raceKey || activeHqModifiers.raceKey === raceWeekendKey)) {
      byTeam.set(activeHqModifiers.teamName, [activeHqModifiers]);
    }

    weekendModifiers
      .filter(mod => !mod.raceKey || mod.raceKey === raceWeekendKey)
      .forEach(mod => {
        const existing = byTeam.get(mod.teamName) || [];
        existing.push(mod);
        byTeam.set(mod.teamName, existing);
      });

    const combined = new Map<string, WeekendModifier>();

    byTeam.forEach((mods, teamName) => {
      const aggregatedEffect = mods.reduce(
        (acc, mod) => mergeHqEffects(acc, mod),
        {} as HeadquartersEventEffect,
      );

      combined.set(teamName, {
        ...aggregatedEffect,
        id: `weekend-${mods.map(m => m.id).join('-')}`,
        title: mods.map(m => m.title).filter(Boolean).join(' & ') || mods[0].title,
        summary: mods.map(m => m.summary).filter(Boolean).join(' | ') || mods[0].summary,
        teamName,
        raceKey: raceWeekendKey,
      } as WeekendModifier);
    });

    return combined;
  }, [activeHqModifiers, mergeHqEffects, weekendModifiers, raceWeekendKey]);

  const combineWeekendModifiers = useCallback((teamName: string, modifierOverride?: WeekendModifier[]) => {
    if (modifierOverride) {
      if (!modifierOverride.length) return null;

      const aggregatedEffect = modifierOverride.reduce(
        (acc, mod) => mergeHqEffects(acc, mod),
        {} as HeadquartersEventEffect,
      );

      return {
        ...aggregatedEffect,
        id: `weekend-${modifierOverride.map(m => m.id).join('-')}`,
        title: modifierOverride.map(m => m.title).filter(Boolean).join(' & ') || modifierOverride[0].title,
        summary: modifierOverride.map(m => m.summary).filter(Boolean).join(' | ') || modifierOverride[0].summary,
        teamName,
      } as WeekendModifier;
    }

    return weekendModifierMap.get(teamName) || null;
  }, [mergeHqEffects, weekendModifierMap]);

  const applyWeekendModifiersToDriver = useCallback((driver: InitialDriver, modifierOverride?: WeekendModifier[]): InitialDriver => {
    const modifier = combineWeekendModifiers(driver.car.teamName, modifierOverride);
    if (!modifier) return driver;

    const tyreLifeMultiplier = modifier.tyreLifeMultiplier ?? 1;
    const adjustedCar: Car = {
      ...driver.car,
      overallPace: clamp(driver.car.overallPace + (modifier.paceDelta || 0), 60, 110),
      reliability: clamp(driver.car.reliability + (modifier.reliabilityDelta || 0) - (modifier.engineWearDelta || 0), 1, 100),
      tyreWearFactor: clamp(driver.car.tyreWearFactor * tyreLifeMultiplier + (modifier.tyreWearDelta || 0), 50, 120),
    };

    const adjustedSkills = {
      ...driver.driverSkills,
      qualifyingPace: clamp(driver.driverSkills.qualifyingPace + (modifier.qualifyingSkillDelta || 0), 1, 100),
      raceCraft: clamp(driver.driverSkills.raceCraft + ((modifier.qualifyingSkillDelta || 0) / 2), 1, 100),
      tyreManagement: clamp(driver.driverSkills.tyreManagement * tyreLifeMultiplier + (modifier.tyreWearDelta || 0), 1, 100),
      consistency: clamp(driver.driverSkills.consistency + (modifier.confidenceDelta || 0), 1, 100),
      incidentProneness: clamp(driver.driverSkills.incidentProneness + ((modifier.dnfRiskDelta || 0) / 2), 1, 100),
    };

    return {
      ...driver,
      car: adjustedCar,
      driverSkills: adjustedSkills,
      morale: clamp(driver.morale + (modifier.moraleDelta || 0), 0, 100),
      happiness: clamp(driver.happiness + (modifier.confidenceDelta || 0), 0, 100),
      hqModifiers: modifier,
    };
  }, [combineWeekendModifiers]);

  const activeRoster = useMemo(() => roster.filter(d => d.status === 'Active').map(d => applyWeekendModifiersToDriver(d)), [roster, applyWeekendModifiersToDriver]);

  const { standings, awardPoints, resetStandings, hydrateStandings } = useStandings(activeRoster);
  const { standings: constructorStandings, awardConstructorPoints, resetConstructorStandings, hydrateConstructorStandings } = useConstructorStandings(activeRoster);
  const { history: seasonHistory, archiveSeason, clearHistory, hydrateSeasonHistory } = useSeasonHistory();
  const { history: raceHistory, recordWinner, clearRaceHistory, hydrateRaceHistory } = useRaceHistory();
  const raceIntervalRef = useRef<number | null>(null);
  const highlightTimeoutRef = useRef<number | null>(null);
  const driversRef = useRef<Driver[]>(drivers);
  const raceStateRef = useRef<RaceState>(raceState);
  const personnelRef = useRef<TeamPersonnel[]>(personnel);
  const fastestLapRef = useRef<{ driverName: string; time: number } | null>(fastestLap);

  useEffect(() => {
    driversRef.current = drivers;
  }, [drivers]);

  useEffect(() => {
    raceStateRef.current = raceState;
  }, [raceState]);

  useEffect(() => {
    personnelRef.current = personnel;
  }, [personnel]);

  useEffect(() => {
    fastestLapRef.current = fastestLap;
  }, [fastestLap]);

  const buildSaveSnapshot = useCallback((): GameSaveState => ({
    version: 1,
    gamePhase,
    offSeasonPhase,
    season,
    currentRaceIndex,
    playerTeam,
    seasonLength,
    seasonTracks,
    raceState,
    drivers,
    roster,
    personnel,
    carRatings,
    rookiePool,
    affiliateCandidates,
    practiceResults,
    qualifyingResults,
    qualifyingStage,
    q2Drivers,
    q3Drivers,
    log,
    fastestLap,
    simSpeed,
    commentaryHighlight,
    raceLapEvents,
    aiSummary,
    isGeneratingSummary,
    aiSeasonReview,
    isGeneratingSeasonReview,
    upcomingRaceQuote,
    teamFinances,
    teamDebriefs,
    driverDebriefs,
    playerShortlist,
    driverProgressionLog,
    resourceAllocationLog,
    mvi,
    staffingLog,
    affiliateLog,
    driverMarketLog,
    regulationChangeLog,
    devResults,
    selectedTeam,
    showHistoryScreen,
    showGarageScreen,
    showHqScreen,
    showHowToPlay,
    hqEvent,
    hqEventRaceKey,
    pendingHqImpact,
    activeHqModifiers,
    weekendModifiers,
    standings,
    constructorStandings,
    raceHistory,
    seasonHistory,
  }), [
    gamePhase,
    offSeasonPhase,
    season,
    currentRaceIndex,
    playerTeam,
    seasonLength,
    seasonTracks,
    raceState,
    drivers,
    roster,
    personnel,
    carRatings,
    rookiePool,
    affiliateCandidates,
    practiceResults,
    qualifyingResults,
    qualifyingStage,
    q2Drivers,
    q3Drivers,
    log,
    fastestLap,
    simSpeed,
    commentaryHighlight,
    raceLapEvents,
    aiSummary,
    isGeneratingSummary,
    aiSeasonReview,
    isGeneratingSeasonReview,
    upcomingRaceQuote,
    teamFinances,
    teamDebriefs,
    driverDebriefs,
    playerShortlist,
    driverProgressionLog,
    resourceAllocationLog,
    mvi,
    staffingLog,
    affiliateLog,
    driverMarketLog,
    regulationChangeLog,
    devResults,
    selectedTeam,
    showHistoryScreen,
    showGarageScreen,
    showHqScreen,
    showHowToPlay,
    hqEvent,
    hqEventRaceKey,
    pendingHqImpact,
    activeHqModifiers,
    weekendModifiers,
    standings,
    constructorStandings,
    raceHistory,
    seasonHistory,
  ]);

  const saveSystemSetters = useMemo<SaveStateSetters>(() => ({
    setGamePhase,
    setOffSeasonPhase,
    setSeason,
    setCurrentRaceIndex,
    setPlayerTeam,
    setSeasonLength,
    setSeasonTracks,
    setRaceState,
    setDrivers,
    setRoster,
    setPersonnel,
    setCarRatings,
    setRookiePool,
    setAffiliateCandidates,
    setPracticeResults,
    setQualifyingResults,
    setQualifyingStage,
    setQ2Drivers,
    setQ3Drivers,
    setLog,
    setFastestLap,
    setSimSpeed,
    setCommentaryHighlight,
    setRaceLapEvents,
    setAiSummary,
    setIsGeneratingSummary,
    setAiSeasonReview,
    setIsGeneratingSeasonReview,
    setUpcomingRaceQuote,
    setTeamFinances,
    setTeamDebriefs,
    setDriverDebriefs,
    setPlayerShortlist,
    setDriverProgressionLog,
    setResourceAllocationLog,
    setMvi,
    setStaffingLog,
    setAffiliateLog,
    setDriverMarketLog,
    setRegulationChangeLog,
    setDevResults,
    setSelectedTeam,
    setShowHistoryScreen,
    setShowGarageScreen,
    setShowHqScreen,
    setShowHowToPlay,
    setHqEvent,
    setHqEventRaceKey,
    setPendingHqImpact,
    setActiveHqModifiers,
    setWeekendModifiers,
    hydrateStandings,
    hydrateConstructorStandings,
    hydrateRaceHistory,
    hydrateSeasonHistory,
  }), [
    hydrateStandings,
    hydrateConstructorStandings,
    hydrateRaceHistory,
    hydrateSeasonHistory,
  ]);

  const handleSelectTeam = (teamName: string) => setSelectedTeam(teamName);
  const handleCloseModal = () => setSelectedTeam(null);

  const handleGenerateSave = useCallback(() => {
    const snapshot = getCurrentGameState(buildSaveSnapshot());
    const code = generateSaveCode(snapshot);
    setSaveCodeValue(code);
    setSaveStatusMessage('Copy this code and keep it somewhere safe.');
    setShowSaveModal(true);
  }, [buildSaveSnapshot]);

  const handleCopySaveCode = useCallback(async () => {
    if (!saveCodeValue) return;
    try {
      await navigator.clipboard.writeText(saveCodeValue);
      setSaveStatusMessage('Save code copied to clipboard.');
    } catch (error) {
      console.error('Clipboard copy failed', error);
      setSaveStatusMessage('Copy failed. Please copy the code manually.');
    }
  }, [saveCodeValue]);

  const handleLoadFromCode = useCallback(() => {
    const result = loadFromSaveCode(loadCodeValue, saveSystemSetters);
    setLoadStatusMessage(result.message);
    if (result.success) {
      if (raceIntervalRef.current) {
        clearInterval(raceIntervalRef.current);
        raceIntervalRef.current = null;
      }
      setShowLoadModal(false);
      setLoadCodeValue('');
    }
  }, [loadCodeValue, saveSystemSetters]);
  
  const selectedTeamData = useMemo(() => {
    if (!selectedTeam) return null;
    const teamCar = Object.values(carRatings).find((c: Car) => c.teamName === selectedTeam);
    const teamDrivers = roster.filter(d => d.car.teamName === selectedTeam && d.status === 'Active');
    const teamPersonnelData = personnel.find(p => p.teamName === selectedTeam);

    if (!teamCar || teamDrivers.length === 0 || !teamPersonnelData) {
        const liveDriver = drivers.find(d => d.car.teamName === selectedTeam);
        if (liveDriver) {
            const liveTeamPersonnel = personnel.find(p => p.teamName === liveDriver.car.teamName);
            const liveTeamDrivers = drivers.filter(d => d.car.teamName === liveDriver.car.teamName && d.raceStatus !== 'Crashed' && d.raceStatus !== 'DNF');
             if (liveTeamPersonnel) {
                const enrichedLiveDrivers = liveTeamDrivers.map(liveD => {
                    const rosterData = roster.find(r => r.id === liveD.id);
                    return { ...rosterData, ...liveD };
                });
                return { drivers: enrichedLiveDrivers, car: liveDriver.car, personnel: liveTeamPersonnel };
            }
        }
        return null;
    }
    return { drivers: teamDrivers, car: teamCar, personnel: teamPersonnelData };
  }, [selectedTeam, carRatings, roster, personnel, drivers]);


  const formatEventMessage = useCallback((event: LapEvent): string => {
      switch (event.type) {
          case 'OVERTAKE': return `${event.driverName} sweeps past ${event.data.target} to take P${event.data.position}!`;
          case 'PIT_ENTRY': return `${event.driverName} ${event.data?.message || 'dives into the pit lane.'}`;
          case 'PIT_EXIT': return `${event.driverName} rejoins the race on a fresh set of ${event.data.tyre} tyres.`;
          case 'CRASH': return `DISASTER! ${event.driverName} is in the barrier and out of the race!`;
          case 'DNF': return `It's all over for ${event.driverName} due to a ${event.data.reason}.`;
          case 'SPIN': return `${event.driverName} has a spin and loses a chunk of time!`;
          case 'WEATHER_CHANGE': return `The weather is changing! Now ${event.data.newWeather}.`;
          case 'EMERGENCY_WEATHER': return `EMERGENCY: Conditions are too dangerous! Race Control has declared Extreme Rain!`;
          case 'RED_FLAG': return `RED FLAG! The race is suspended!`;
          case 'SAFETY_CAR': return `Safety Car deployed due to an on-track incident!`;
          case 'VSC': return `Virtual Safety Car deployed.`;
          case 'YELLOW_FLAG': return `Yellow flags are waving on track.`;
          case 'SLOW_PIT_STOP': return `A slow stop for ${event.driverName}! That's cost them valuable time.`;
          case 'FAST_PIT_STOP': return `A lightning stop for ${event.driverName}! They're back out in a flash!`;
          case 'DISASTROUS_PIT_STOP': return `DISASTER IN THE PITS for ${event.driverName}! A huge delay!`;
          case 'STRATEGY_ERROR': return `A questionable call from the pit wall for ${event.driverName}. ${event.data.message || ''}`;
          case 'MECHANICAL_ISSUE': return `Looks like ${event.driverName} has a problem, they're losing pace! ${event.data.message || ''}`;
          case 'FASTEST_LAP': return `New fastest lap from ${event.driverName}: ${event.data.time.toFixed(3)}!`;
          case 'BATTLE': return `${event.driverName} is all over the back of ${event.data.target} for P${event.data.position}! This is a great battle!`;
          case 'DAMAGE': return `${event.driverName} has suffered damage after contact! They'll need to pit.`;
          case 'LAP_EVENT': return `${event.driverName} ${event.data.message}`;
          case 'REPAIR_SUCCESS': return `Incredible work in the pits! ${event.driverName} rejoins the race after successful repairs!`;
          case 'REPAIR_FAILURE': return `The team can't fix the car. ${event.driverName} is forced to retire in the pits.`;
          case 'MULTI_CRASH': return `MULTI-CAR PILE-UP! ${event.data.involved} are involved!`;
          case 'LOCK_UP': return `${event.driverName} locks up into the corner!`;
          case 'WIDE_MOMENT': return `${event.driverName} runs wide, losing a bit of time!`;
          case 'TEAM_RADIO': return `[Team Radio] ${event.driverName} ${event.data.message}`;
          case 'TIME_PENALTY': return `PENALTY: ${event.driverName} gets a ${event.data.duration}-second time penalty for ${event.data.reason}.`;
          case 'TRACK_LIMIT_WARNING': return `Warning for ${event.driverName} for track limits (${event.data.count}/3).`;
          case 'BRILLIANT_STRATEGY': return `BRILLIANT STRATEGY! ${event.driverName} ${event.data.message}`;
          case 'QUALIFYING_HEROICS': return `${event.driverName} is holding on brilliantly after a mega qualifying performance to start P${event.data.position}!`;
          default: return 'An unknown event occurred.';
      }
  }, []);

  const addLog = useCallback((message: string) => {
    let prefix = '[Pre-Race]';
    if(gamePhase === GamePhase.PRACTICE) prefix = '[Practice]';
    if(gamePhase === GamePhase.QUALIFYING) prefix = '[Qualifying]';
    if(gamePhase === GamePhase.RACING && raceState.lap > 0) prefix = `[Lap ${raceState.lap}/${raceState.totalLaps}]`;
    if(gamePhase === GamePhase.POST_SEASON) prefix = `[Off-Season]`;
    setLog(prev => [`${prefix} ${message}`, ...prev.slice(0, 49)]);
  }, [raceState.lap, raceState.totalLaps, gamePhase]);

  useEffect(() => {
    if (!playerTeam) return;
    if (hqEventRaceKey === raceWeekendKey) return;

    setHqEventRaceKey(raceWeekendKey);
    setHqEvent(Math.random() < 0.25 ? pickRandomHeadquartersEvent() : null);
  }, [playerTeam, raceWeekendKey, hqEventRaceKey]);

  const handleResolveHeadquartersEvent = useCallback((eventId: string, choiceId: string) => {
    if (!hqEvent || hqEvent.id !== eventId || !playerTeam) return;
    const selectedChoice = hqEvent.choices.find(c => c.id === choiceId);
    if (!selectedChoice) return;

    let combinedEffect = { ...selectedChoice.effect } as HeadquartersEventEffect;
    let riskTriggered = false;
    if (selectedChoice.risk && Math.random() < selectedChoice.risk.probability) {
      combinedEffect = mergeHqEffects(combinedEffect, selectedChoice.risk.effect);
      riskTriggered = true;
    }

    const resolution: HeadquartersEventResolution = {
      ...combinedEffect,
      id: hqEvent.id,
      title: hqEvent.title,
      summary: selectedChoice.summary,
      teamName: playerTeam,
      raceKey: raceWeekendKey,
      choiceId: selectedChoice.id,
      riskTriggered,
    };

    if (combinedEffect.budgetDelta) {
      setTeamFinances(prev => prev.map(tf => tf.teamName === playerTeam ? {
        ...tf,
        finalBudget: tf.finalBudget + combinedEffect.budgetDelta!,
        carDevelopmentBudget: tf.carDevelopmentBudget + combinedEffect.budgetDelta!,
      } : tf));
    }

    setPendingHqImpact(resolution);
    setHqEvent(null);
    const riskNote = riskTriggered && selectedChoice.risk?.summary ? ` (${selectedChoice.risk.summary})` : '';
    addLog(`[HQ] ${hqEvent.title}: ${selectedChoice.label} chosen. ${selectedChoice.summary}${riskNote}. Impact queued for the next race.`);
  }, [hqEvent, mergeHqEffects, playerTeam, addLog, raceWeekendKey]);

  const handleSetPlayerTeam = (teamName: string) => {
    // Clear any team-specific weekend or HQ state before switching control so
    // the new club does not inherit pending effects from the previous team.
    clearHeadquartersState();

    setPlayerTeam(teamName);
    addLog(`You have taken control of ${teamName}. Good luck!`);
    addLog(`The initial ${season} season will be simulated based on default settings. Your management decisions will begin in the off-season.`);
    setGamePhase(GamePhase.SETUP);
  };
  
  const handleSetSeasonLength = (length: 'full' | 'short') => {
      setSeasonLength(length);
      const nextTracks = length === 'short' ? SHORT_SEASON_TRACKS : FULL_SEASON_TRACKS;
      setSeasonTracks(nextTracks);
      setCurrentRaceIndex(0);
      setRaceState(prev => ({
        ...prev,
        track: nextTracks[0],
        totalLaps: nextTracks[0].laps,
        lap: 0,
      }));
  };

  const handleStartPracticeWeekend = (track: Track) => {
    addLog(`Practice session is starting at ${track.name}.`);

    const teams = Array.from(new Set(roster.filter(d => d.status === 'Active').map(d => d.car.teamName)));
    const weekendRolls: WeekendModifier[] = [];
    teams.forEach(teamName => {
      if (Math.random() < 0.01) {
        const teamDrivers = roster.filter(d => d.car.teamName === teamName && d.status === 'Active');
        const teamPersonnel = personnel.find(p => p.teamName === teamName);
        const outcome = rollPreRaceEventForTeam(teamName, teamDrivers, teamPersonnel);
        weekendRolls.push({ ...outcome.modifier, raceKey: raceWeekendKey });
        if (outcome.budgetDelta) {
          setTeamFinances(prev => prev.map(tf => tf.teamName === teamName ? {
            ...tf,
            finalBudget: tf.finalBudget + outcome.budgetDelta!,
            carDevelopmentBudget: tf.carDevelopmentBudget + outcome.budgetDelta!,
          } : tf));
        }
        addLog(`[Wildcard] ${outcome.log}`);
      }
    });
    setWeekendModifiers(weekendRolls);

    if (pendingHqImpact && playerTeam && pendingHqImpact.teamName === playerTeam) {
      if (!pendingHqImpact.raceKey || pendingHqImpact.raceKey === raceWeekendKey) {
        setActiveHqModifiers(pendingHqImpact);
        setPendingHqImpact(null);
        addLog(`[HQ] ${pendingHqImpact.title} effect active for this weekend.`);
      } else {
        setPendingHqImpact(null);
      }
    }

    setRoster(prev => prev.map(d => ({ ...d, form: Math.round(d.form * 0.9) })));
    
    const masterForecast = generateMasterForecast(track);
    const initialWeather = masterForecast[0];
    const isWet = initialWeather.includes('Rain');
    
    const airTemp = 18 + Math.floor(Math.random() * 15);
    const trackTemp = airTemp + 10 + Math.floor(Math.random() * 10);

    addLog(`Weather forecast: ${initialWeather} with a ${track.wetSessionProbability * 100}% chance of rain.`);
    
    if (track.technicalDirective) {
        addLog(`Technical Directive issued for ${track.name} regarding wing flexibility.`);
        let tempCarRatings = JSON.parse(JSON.stringify(carRatings)) as { [key: string]: Car };
        if (track.technicalDirective === 'WingFlexV1' && tempCarRatings['RedBull']) {
            tempCarRatings['RedBull'].highSpeedCornering -= 2;
            tempCarRatings['RedBull'].overallPace -=1;
            addLog(`Red Bull's high-speed performance may be impacted.`);
        }
         if (track.technicalDirective === 'WingFlexV2' && tempCarRatings['RedBull']) {
            tempCarRatings['RedBull'].highSpeedCornering -= 1;
            tempCarRatings['RedBull'].mediumSpeedCornering -=1;
            addLog(`Red Bull's performance further adjusted due to stricter wing tests.`);
        }
        setCarRatings(tempCarRatings);
    }
    
    const practiceWeatherForSim = Math.random() < track.wetSessionProbability ? 'Light Rain' : 'Sunny';
    const practiceRoster = roster.filter(d => d.status === 'Active').map(d => applyWeekendModifiersToDriver(d, weekendRolls));
    const practiceSessionResults = runPracticeSession(practiceRoster, track, personnel, practiceWeatherForSim);
    setPracticeResults(practiceSessionResults);

    setRaceState(prev => ({ 
        ...prev, 
        track: track, 
        totalLaps: track.laps, 
        weather: initialWeather, 
        trackCondition: { waterLevel: isWet ? 20 : 0, gripLevel: isWet ? 80 : 100 },
        masterWeatherForecast: masterForecast,
        airTemp,
        trackTemp,
    }));
    setGamePhase(GamePhase.PRACTICE);
    addLog(`Practice complete. Review the results before starting qualifying.`);
  };

  const handleProceedToQualifying = () => {
    addLog(`Qualifying session starting at ${raceState.track.name}.`);
    
    const rosterWithForm = activeRoster.map(d => ({
        ...d,
        driverSkills: {
            ...d.driverSkills,
            qualifyingPace: Math.max(1, Math.min(100, d.driverSkills.qualifyingPace + d.form)),
            raceCraft: Math.max(1, Math.min(100, d.driverSkills.raceCraft + d.form)),
            consistency: Math.max(1, Math.min(100, d.driverSkills.consistency + d.form)),
        }
    }));
    
    const { results, q2Drivers: nextQ2Drivers } = runQ1(rosterWithForm, raceState.track, raceState.weather, raceHistory, practiceResults);
    setQualifyingResults(results);
    setQ2Drivers(nextQ2Drivers.map(d => activeRoster.find(rosterD => rosterD.id === d.id)!));
    setGamePhase(GamePhase.QUALIFYING);
    setQualifyingStage('Q1');
    addLog(`Q1 results are in! The bottom ${rosterWithForm.length - 15} have been eliminated.`);
  }

  const handleProceedQualifying = () => {
     const rosterWithForm = activeRoster.map(d => ({
        ...d,
        driverSkills: {
            ...d.driverSkills,
            qualifyingPace: Math.max(1, Math.min(100, d.driverSkills.qualifyingPace + d.form))
        }
    }));

    if (qualifyingStage === 'Q1') {
        addLog(`Q2 is underway...`);
        const q2DriversWithForm = q2Drivers.map(d => rosterWithForm.find(r => r.id === d.id)!);
        const { results, q3Drivers: nextQ3Drivers } = runQ2(q2DriversWithForm, qualifyingResults, raceState.track, raceState.weather, raceHistory, practiceResults);
        setQualifyingResults(results);
        setQ3Drivers(nextQ3Drivers.map(d => activeRoster.find(rosterD => rosterD.id === d.id)!));
        setQualifyingStage('Q2');
        addLog(`Q2 results are in! Another 5 drivers are out.`);
    } else if (qualifyingStage === 'Q2') {
        addLog(`Q3, the final shootout, begins!`);
        const q3DriversWithForm = q3Drivers.map(d => rosterWithForm.find(r => r.id === d.id)!);
        const finalResults = runQ3(q3DriversWithForm, qualifyingResults, raceState.track, raceState.weather, raceHistory, practiceResults);
        setQualifyingResults(finalResults);
        setQualifyingStage('Q3');
        addLog(`Q3 is complete!`);
    } else if (qualifyingStage === 'Q3') {
        setQualifyingStage('FINISHED');
        addLog(`The final grid is set.`);
    }
  };
  
  const handleStartRace = () => {
    const personnelMap = new Map(personnel.map(p => [p.teamName, p]));
    const teamForecasts = generateTeamForecasts(raceState.masterWeatherForecast, personnel);
    const startOfRaceEvents: LapEvent[] = [];

    const driversWithStrategies = activeRoster.map(driver => {
        const teamPersonnel = personnelMap.get(driver.car.teamName);
        const qPos = qualifyingResults.find(r => r.driverId === driver.id)?.finalPosition || 15;

        const effectiveSkills = {
             ...driver.driverSkills,
            raceCraft: Math.max(1, Math.min(100, driver.driverSkills.raceCraft + driver.form)),
            consistency: Math.max(1, Math.min(100, driver.driverSkills.consistency + driver.form)),
            tyreManagement: Math.max(1, Math.min(100, driver.driverSkills.tyreManagement + (driver.form / 2))),
        };

        if (!teamPersonnel) {
            console.error(`Could not find personnel for ${driver.car.teamName}`);
            const strategy = generateLocalStrategy(raceState.track, driver, INITIAL_PERSONNEL[0], qPos);
            const teamKey = Object.keys(CARS).find(key => CARS[key as keyof typeof CARS].teamName === driver.car.teamName)!;
            const colors = TEAM_COLORS[teamKey as keyof typeof TEAM_COLORS];
            return { ...driver, driverSkills: effectiveSkills, ...colors, strategy };
        }
        
        const strategy = generateLocalStrategy(raceState.track, driver, teamPersonnel, qPos);
        const teamKey = Object.keys(CARS).find(key => CARS[key as keyof typeof CARS].teamName === driver.car.teamName)!;
        const colors = TEAM_COLORS[teamKey as keyof typeof TEAM_COLORS];
        return { ...driver, driverSkills: effectiveSkills, ...colors, strategy };
    });

    const driverMap = new Map(driversWithStrategies.map(d => [d.id, d]));
    const sortedDrivers = qualifyingResults
      .sort((a, b) => a.finalPosition - b.finalPosition)
      .map(q => driverMap.get(q.driverId))
      .filter((d): d is Exclude<typeof d, undefined> => d !== undefined);

    const isWetStart = raceState.weather === 'Light Rain' || raceState.weather === 'Heavy Rain' || raceState.weather === 'Extreme Rain';

    let initialDrivers: Driver[] = sortedDrivers.map((d, i) => {
        let startingTyre = d.strategy.startingTyre;
        let hasUsedWet = false;
        if (isWetStart) {
            startingTyre = raceState.weather === 'Heavy Rain' || raceState.weather === 'Extreme Rain' ? TyreCompound.Wet : TyreCompound.Intermediate;
            hasUsedWet = true;
        }

        return {
          ...d, position: i + 1, startingPosition: i + 1, currentTyres: { compound: startingTyre, wear: 0, age: 0, temperature: TIRE_BLANKET_TEMP, condition: 'Cold' },
          fuelLoad: 110, raceStatus: 'Racing', lapTime: 0, totalRaceTime: i * 0.2, gapToLeader: 0,
          pitStops: 0, battle: null, isDamaged: false,
          compoundsUsed: [startingTyre],
          hasUsedWetTyre: hasUsedWet,
          penalties: [], trackLimitWarnings: 0,
          pittedThisLap: false,
          ersCharge: 100,
          paceMode: 'Standard',
          gripAdvantage: null,
          form: d.form,
        };
    });
    
    const rankedCars = Object.values(carRatings).sort((a: Car, b: Car) => b.overallPace - a.overallPace);
    const carExpectedRank = new Map(rankedCars.map((car, index) => [car.teamName, index + 1]));

    initialDrivers.forEach(d => {
        const qPos = d.startingPosition;
        const carRank = carExpectedRank.get(d.car.teamName) || (rankedCars.length / 2);
        const expectedPosition = (carRank * 2) - 0.5;
        const performanceDelta = expectedPosition - qPos;

        if (performanceDelta > 4) {
            const bonus = Math.min(0.20, (performanceDelta - 4) * 0.025);
            const forLaps = Math.min(10, 3 + Math.floor(performanceDelta / 3));
            d.gripAdvantage = { forLaps, bonus };
            startOfRaceEvents.push({ type: 'QUALIFYING_HEROICS', driverName: d.name, data: { position: qPos }});
        }
    });

    setRaceLapEvents([]);
    setAiSummary(null);

    const { updatedDrivers, lapEvents: incidentEvents, flagTriggers } = simulateKeyMomentIncidents(initialDrivers, raceState.track, raceState.weather);
    const allStartEvents = [...startOfRaceEvents, ...incidentEvents];
    setRaceLapEvents(prev => [...prev, ...allStartEvents]);
    
    const newFlag = flagTriggers[0] || RaceFlag.Green;
    let newFlagLaps = 0;

    const flagEventMap: { [key in RaceFlag]?: { laps: number, event: LapEvent } } = {
        [RaceFlag.Red]: { laps: 5, event: { type: 'RED_FLAG', driverName: 'Race Control' } },
        [RaceFlag.SafetyCar]: { laps: 3, event: { type: 'SAFETY_CAR', driverName: 'Race Control' } },
        [RaceFlag.VirtualSafetyCar]: { laps: 2, event: { type: 'VSC', driverName: 'Race Control' } },
        [RaceFlag.Yellow]: { laps: 1, event: { type: 'YELLOW_FLAG', driverName: 'Race Control' } },
    };

    if (flagEventMap[newFlag]) {
        newFlagLaps = flagEventMap[newFlag]!.laps;
        allStartEvents.unshift(flagEventMap[newFlag]!.event);
    }
    
    const raceStartEvents = allStartEvents.map(event => formatEventMessage(event));
    const prefix = `[Lap 1/${raceState.track.laps}]`;
    const finalLogMessage = `Lights out and away we go for the ${raceState.track.name} Grand Prix!`;

    setLog(prev => [
      `${prefix} ${finalLogMessage}`,
      ...raceStartEvents.map(msg => `${prefix} ${msg}`).reverse(),
      ...prev.slice(0, 50 - raceStartEvents.length - 1)
    ]);
    
    setDrivers(updatedDrivers.sort((a, b) => a.position - b.position));
    setGamePhase(GamePhase.RACING);
    setRaceState(prev => ({ ...prev, lap: 1, flag: newFlag, flagLaps: newFlagLaps, teamWeatherForecasts: teamForecasts }));
  };

  const handleProceedToNextRace = () => {
    const nextRaceIndex = currentRaceIndex + 1;
    const nextTrack = seasonTracks[nextRaceIndex];
    if (!nextTrack) {
        handleProceedToOffSeason();
        return;
    }

    clearHeadquartersState();

    const driverForPreview =
        standings.find(s => s.position === 1) ? roster.find(r => r.id === standings.find(s => s.position === 1)!.driverId) :
        drivers.find(d => d.position === 1) ? roster.find(r => r.id === drivers.find(d => d.position === 1)!.id) :
        roster.find(r => r.id === standings[0].driverId);

    const shouldGeneratePreview = Math.random() < 0.33;

    if (driverForPreview && shouldGeneratePreview) {
        const driverStanding = standings.find(s => s.driverId === driverForPreview.id)!;
        const lastRacePos = drivers.find(d => d.id === driverForPreview.id)?.position;

        generateAiDriverPreview(driverForPreview, driverStanding, lastRacePos || null, nextTrack)
            .then(quote => setUpcomingRaceQuote(quote))
            .catch(err => {
                console.error("Failed to get driver preview", err);
                setUpcomingRaceQuote(null);
            });
    } else {
        setUpcomingRaceQuote(null);
    }

    setCurrentRaceIndex(prev => prev + 1);
    setGamePhase(GamePhase.SETUP);
    setDrivers([]);
    setPracticeResults([]);
    setQualifyingResults([]);
    setQualifyingStage('Q1');
    setQ2Drivers([]);
    setQ3Drivers([]);
    setFastestLap(null);
    setLog([`Welcome to the next race weekend!`]);
  };
  
  const handleProceedToOffSeason = () => {
    clearHeadquartersState();
    addLog(`The ${season} season has concluded. Generating season review...`);
    setIsGeneratingSeasonReview(true);

    setTimeout(() => {
        try {
            const review = generateAiSeasonReview(season, standings, constructorStandings, personnel);
            setAiSeasonReview(review);
            setGamePhase(GamePhase.POST_SEASON_REVIEW);
        } catch (error) {
            console.error("Failed to generate off-season data", error);
            handleStartOffSeasonDebrief();
        } finally {
            setIsGeneratingSeasonReview(false);
        }
    }, 250);
  };
  
  const handleStartOffSeasonDebrief = () => {
    addLog(`Proceeding to off-season debrief.`);
    
    const finalCarRatingsForArchive = Object.values(carRatings) as Car[];
    archiveSeason(season, standings, constructorStandings, finalCarRatingsForArchive, aiSeasonReview);

    const champion = standings.find(s => s.position === 1);
    if (champion) {
      addLog(`${champion.name} is the ${season} World Champion!`);
      setRoster(prevRoster => {
        const newRoster = [...prevRoster];
        const rosterDriver = newRoster.find(d => d.id === champion.driverId);
        if (rosterDriver) {
          rosterDriver.championships += 1;
        }
        return newRoster;
      });
    }

    const calculatedDriverDebriefs = calculateDriverStockValue(standings, activeRoster);
    const calculatedTeamDebriefs = calculateTeamPrestige(constructorStandings, seasonHistory);
    const calculatedMvi = calculateMarketVolatilityIndex(calculatedDriverDebriefs, constructorStandings, roster);
    setTeamDebriefs(calculatedTeamDebriefs);
    setDriverDebriefs(calculatedDriverDebriefs);
    setMvi(calculatedMvi);

    setRoster(prevRoster => {
        return prevRoster.map(driver => {
            const debrief = calculatedDriverDebriefs.find(d => d.driverId === driver.id);
            if (debrief) {
                return {
                    ...driver,
                    peakDsv: Math.max(driver.peakDsv || 0, debrief.dsv)
                };
            }
            return driver;
        });
    });

    setGamePhase(GamePhase.POST_SEASON);
    setOffSeasonPhase('DEBRIEF');
    if (raceIntervalRef.current) clearInterval(raceIntervalRef.current);
  };

  const handleSkipToOffSeason = () => {
    clearHeadquartersState();
    addLog(`The ${season} season has been manually concluded. Proceeding to review.`);
    setIsGeneratingSeasonReview(true);
    
    setTimeout(() => {
        try {
            const review = generateAiSeasonReview(season, standings, constructorStandings, personnel);
            setAiSeasonReview(review);
            setGamePhase(GamePhase.POST_SEASON_REVIEW);
        } catch (error) {
            console.error("Failed to generate off-season data", error);
            handleStartOffSeasonDebrief();
        } finally {
            setIsGeneratingSeasonReview(false);
        }
    }, 250);
  };
  
  const handleProceedToDriverProgression = () => {
    addLog('Calculating driver skill progression based on season performance.');
    const { newRoster, log } = runDriverProgression(roster, driverDebriefs, teamDebriefs);
    setRoster(newRoster);
    setDriverProgressionLog(log);
    setOffSeasonPhase('DRIVER_PROGRESSION');
  };

  const handleProceedToFinancials = () => {
    addLog(`Calculating end-of-season prize money distribution.`);
    const finances = calculateTeamFinances(constructorStandings, seasonHistory, roster, teamDebriefs);
    setTeamFinances(finances);

    // BUG FIX: Add Cadillac at the start of the off-season
    if (season === 2025 && !personnel.some(p => p.teamName === 'Cadillac Racing')) {
        addLog("A new challenger approaches! Cadillac Racing joins the grid for the 2026 season!");

        const cadillacCar: Car = CARS['Cadillac'];
        const cadillacPersonnel: TeamPersonnel = INITIAL_PERSONNEL.find(p => p.teamName === 'Cadillac Racing')!;
        
        const cadillacFinance: TeamFinances = {
            teamName: 'Cadillac Racing',
            teamHexColor: TEAM_COLORS['Cadillac'].teamHexColor,
            prizeMoney: { total: 0, lstBonus: 0, ccbBonus: 0, performancePayout: 0 },
            sponsorshipIncome: 85000000,
            driverSalaries: 0,
            finalBudget: 85000000, // Starting budget
            carDevelopmentBudget: 0,
            personnelInvestment: 0,
            driverAcquisitionFund: 0,
        };
        
        const cadillacDebrief: TeamDebrief = {
            teamName: 'Cadillac Racing',
            teamHexColor: TEAM_COLORS['Cadillac'].teamHexColor,
            points: 0,
            position: 11,
            tpr: 77, // Baseline TPR for a new, ambitious team
            breakdown: { posScore: 0, expectationScore: 0, historyScore: 0, legacyScore: 0 },
        };
        
        setCarRatings(prev => ({ ...prev, Cadillac: cadillacCar }));
        setPersonnel(prev => [...prev, cadillacPersonnel]);
        setTeamFinances(prev => [...prev, cadillacFinance]);
        setTeamDebriefs(prev => [...prev, cadillacDebrief]);
        
        // Add them to constructor standings for future seasons
        resetConstructorStandings([...activeRoster, {id: 999, car: cadillacCar} as InitialDriver]);
    }


    setOffSeasonPhase('FINANCIALS');
  };

  const handlePlayerResourceAllocation = (playerAllocations: { carDevelopmentBudget: number; driverAcquisitionFund: number; personnelInvestment: number; }) => {
    addLog("Your resource allocation has been finalized. AI teams are now setting their budgets.");
    const playerFinanceIndex = teamFinances.findIndex(tf => tf.teamName === playerTeam);
    let intermediateFinances = [...teamFinances];
    if (playerFinanceIndex !== -1) {
        intermediateFinances[playerFinanceIndex].carDevelopmentBudget = playerAllocations.carDevelopmentBudget;
        intermediateFinances[playerFinanceIndex].driverAcquisitionFund = playerAllocations.driverAcquisitionFund;
        intermediateFinances[playerFinanceIndex].personnelInvestment = playerAllocations.personnelInvestment;
    }

    const { updatedTeamFinances: aiFinances, log: aiLog } = runResourceAllocation(intermediateFinances, personnel, teamDebriefs, playerTeam!);
    setTeamFinances(aiFinances);
    setResourceAllocationLog(aiLog);

    addLog("Affiliate drivers are undergoing their winter training programs.");
    const { updatedPersonnel, log: affiliateProgressLog } = runAffiliateProgression(personnel, aiFinances);
    setPersonnel(updatedPersonnel);
    setAffiliateLog(affiliateProgressLog);
    
    setOffSeasonPhase('STAFFING');
  };

  const handlePlayerPersonnelChanges = (newPlayerPersonnel: TeamPersonnel) => {
    addLog("Your team's leadership for the new season is set. Other teams are making their moves.");
    const playerPersonnelIndex = personnel.findIndex(p => p.teamName === playerTeam);
    let intermediatePersonnel = [...personnel];
    if(playerPersonnelIndex !== -1) {
        intermediatePersonnel[playerPersonnelIndex] = newPlayerPersonnel;
    }
    
    if(newPlayerPersonnel.affiliateDriver) {
        setAffiliateCandidates(prev => prev.filter(c => c.name !== newPlayerPersonnel.affiliateDriver?.name));
    }

    const { newPersonnel: aiPersonnel, log: aiLog } = runStaffingMarket(intermediatePersonnel, teamDebriefs, teamFinances, playerTeam!);
    setStaffingLog(aiLog);
    
    const { finalPersonnel, log: affiliateSigningLog, usedCandidates } = runAIAffiliateSignings(aiPersonnel, affiliateCandidates, teamDebriefs, playerTeam!);
    setPersonnel(finalPersonnel);
    setAffiliateLog(prev => [...prev, ...affiliateSigningLog]);
    setAffiliateCandidates(prev => prev.filter(c => !usedCandidates.includes(c.name)));

    const playerTeamTpr = teamDebriefs.find(t => t.teamName === playerTeam)?.tpr || 75;
    const shortlist = generatePlayerShortlist(playerTeam!, playerTeamTpr, roster, driverDebriefs, mvi, teamDebriefs);
    setPlayerShortlist(shortlist);

    setOffSeasonPhase('DRIVER_MARKET');
  };

  const handlePlayerRosterChanges = (playerFinalRoster: InitialDriver[]) => {
      addLog("The grid is taking shape! Your driver lineup is confirmed. Simulating the rest of the market...");
      
      const originalPlayerRoster = roster.filter(d => d.car.teamName === playerTeam);
      const newDriverInFinalRoster = playerFinalRoster.find(d => !originalPlayerRoster.some(od => od.id === d.id));
      const poachedDriver = newDriverInFinalRoster && roster.find(r => r.id === newDriverInFinalRoster.id && r.status === 'Active');

      const playerTeamCar = CARS[Object.keys(CARS).find(k => CARS[k as keyof typeof CARS].teamName === playerTeam)! as keyof typeof CARS];
      const playerFinalRosterWithCar = playerFinalRoster.map(d => ({
          ...d,
          car: playerTeamCar,
          status: 'Active' as 'Active',
          negotiationStatus: 'Signed' as const,
          contractExpiresIn: Math.max(2, (d.contractExpiresIn ?? 1) + 1), // Protect against instant expiry after ageing
          happiness: Math.min(100, (d.happiness ?? 70) + 5),
          morale: Math.min(100, (d.morale ?? 70) + 5),
      }));
      
      const oldPlayerDriverIds = originalPlayerRoster.map(d => d.id);
      const newPlayerDriverIds = playerFinalRosterWithCar.map(d => d.id);
      
      const releasedDriverIds = oldPlayerDriverIds.filter(id => !newPlayerDriverIds.includes(id));
      
      let intermediateRoster = roster.map(d => {
          if (releasedDriverIds.includes(d.id)) {
              return { ...d, status: 'Free Agent' as 'Free Agent' };
          }
          const isNewPlayerDriver = playerFinalRosterWithCar.find(pd => pd.id === d.id);
          if (isNewPlayerDriver) {
              return isNewPlayerDriver;
          }
          return d;
      });

      const existingIds = new Set(intermediateRoster.map(d => d.id));
      const newPlayerAdditions = playerFinalRosterWithCar.filter(d => !existingIds.has(d.id));
      if (newPlayerAdditions.length > 0) {
          intermediateRoster = [...intermediateRoster, ...newPlayerAdditions];
      }

      if (poachedDriver) {
          addLog(`[Poach Confirmed!] You have successfully signed ${poachedDriver.name} from ${poachedDriver.car.teamName}!`);
      }

      const { newRoster: finalRoster, log, rookiesUsed } = runDriverMarket(intermediateRoster, driverDebriefs, teamDebriefs, mvi, teamFinances, personnel, rookiePool, playerTeam!, season);
      
      setRoster(finalRoster);
      setDriverMarketLog(log);
      setRookiePool(prev => prev.filter(r => !rookiesUsed.includes(r.name)));
      setOffSeasonPhase('DRIVER_MARKET_SUMMARY');
  };
  
  const handleProceedToRegulationChange = () => {
    if (Math.random() < 0.25) {
        addLog('MASSIVE REGULATION SHAKE-UP ANNOUNCED! Teams must build all-new cars.');
        const { newBaseCarRatings, regulationLog } = runRegulationChange(teamFinances, personnel);
        setCarRatings(newBaseCarRatings);
        setRegulationChangeLog(regulationLog);
        setOffSeasonPhase('REGULATION_CHANGE');
    } else {
        addLog('Regulations remain stable for the upcoming season. Teams will develop their existing car concepts.');
        setRegulationChangeLog([]);
        setOffSeasonPhase('CAR_DEVELOPMENT');
    }
  };

  const handlePlayerCarDevelopment = (playerCarDev: PlayerCarDev) => {
    addLog("Your new car design has been submitted. AI teams are completing their development.");
    const playerCarKey = Object.keys(carRatings).find(k => carRatings[k as keyof typeof carRatings].teamName === playerTeam);
    let intermediateCarRatings = {...carRatings};
    if (playerCarKey) {
        intermediateCarRatings[playerCarKey] = playerCarDev.finalCar;
    }

    const { newCarRatings: aiCarRatings, developmentLog: aiDevLog } = runCarDevelopment(teamFinances, personnel, intermediateCarRatings, playerTeam!);
    
    setCarRatings(aiCarRatings);
    setDevResults([playerCarDev.devResult, ...aiDevLog]);
    handleStartNewSeason();
  };


  const handleProceedToResourceAllocation = () => {
    addLog(`Teams are allocating their budgets for the upcoming season.`);
    setOffSeasonPhase('RESOURCE_ALLOCATION');
  };

  const handleProceedToPersonnel = () => {
    setOffSeasonPhase('STAFFING');
  };

  const handleProceedToDriverMarket = () => {
    setOffSeasonPhase('DRIVER_MARKET');
  };
  
  const handleProceedToCarDevelopment = () => {
     setOffSeasonPhase('CAR_DEVELOPMENT');
  };

  const handleStartNewSeason = useCallback(() => {
    // Ensure no stray timers from the previous season keep mutating state while we reset.
    if (raceIntervalRef.current) {
      clearInterval(raceIntervalRef.current);
      raceIntervalRef.current = null;
    }
    if (highlightTimeoutRef.current) {
      clearTimeout(highlightTimeoutRef.current);
      highlightTimeoutRef.current = null;
    }

    // Clear any leftover weekend or HQ effects so they don't leak into the fresh season.
    clearHeadquartersState();

    const updatedRosterWithHistory = updateRosterForNewSeason(roster, driverDebriefs, carRatings, season);

    const retiredThisSeasonCount = driverMarketLog.filter(e => e.type === 'RETIRED').length;
    const newRookies = createNewRookies(retiredThisSeasonCount, rookiePool, updatedRosterWithHistory);
    addLog(`${newRookies.length} new prospects have been added to the rookie pool.`);
    setRookiePool(prevPool => [...prevPool, ...newRookies]);

    const nextSeason = season + 1;
    const nextSeasonTracks = calculateNextSeasonTracks(seasonLength);
    const initialRaceState = buildInitialRaceState(nextSeasonTracks);

    setRoster(updatedRosterWithHistory);
    const activeRosterForNewSeason = updatedRosterWithHistory.filter(d => d.status === 'Active');

    setSeason(nextSeason);
    setGamePhase(GamePhase.SETUP);
    setCurrentRaceIndex(0);

    resetStandings(activeRosterForNewSeason);
    resetConstructorStandings(activeRosterForNewSeason);

    setSeasonTracks(nextSeasonTracks);
    setRaceState(initialRaceState);
    setDrivers([]);
    setPracticeResults([]);
    setQualifyingResults([]);
    setQualifyingStage('Q1');
    setQ2Drivers([]);
    setQ3Drivers([]);
    setRaceLapEvents([]);
    setFastestLap(null);
    setAiSummary(null);
    setIsGeneratingSummary(false);
    setUpcomingRaceQuote(null);
    setAiSeasonReview(null);
    setIsGeneratingSeasonReview(false);
    setTeamFinances([]);
    setTeamDebriefs([]);
    setDriverDebriefs([]);
    setPlayerShortlist([]);
    setDriverProgressionLog([]);
    setResourceAllocationLog([]);
    setMvi(0);
    setStaffingLog([]);
    setDriverMarketLog([]);
    setAffiliateLog([]);
    setRegulationChangeLog([]);
    setDevResults([]);
    setOffSeasonPhase('DEBRIEF');
    setLog([`Welcome to the ${nextSeason} season! Please select a track to begin.`]);
  }, [
    addLog,
    carRatings,
    clearHeadquartersState,
    driverDebriefs,
    driverMarketLog,
    resetConstructorStandings,
    resetStandings,
    rookiePool,
    roster,
    season,
    seasonLength,
  ]);
  
  const handleResetAllStandings = useCallback(() => {
    resetStandings(INITIAL_DRIVERS.filter(d => d.status === 'Active'));
    resetConstructorStandings(INITIAL_DRIVERS.filter(d => d.status === 'Active'));
    setRoster(INITIAL_DRIVERS);
    setPersonnel(INITIAL_PERSONNEL);
    setCarRatings(CARS);
    setRookiePool(ROOKIE_POOL);
    clearHeadquartersState();
    clearHistory();
    clearRaceHistory();
    setSeason(2025);
    setCurrentRaceIndex(0);
    setSeasonLength('full');
    setSeasonTracks(FULL_SEASON_TRACKS);
    setPlayerTeam(null);
    addLog('All championship, roster, personnel, and season history has been reset.');
  }, [
    resetStandings,
    resetConstructorStandings,
    clearHistory,
    addLog,
    clearHeadquartersState,
  ]);

  const handleCommentaryUpdate = useCallback((events: LapEvent[]) => {
    if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
    }

    const selectHighlight = (events: LapEvent[]): LapEvent | null => {
        const priorityOrder: LapEventType[] = [
            'MULTI_CRASH', 'RED_FLAG', 'CRASH', 'SAFETY_CAR', 'EMERGENCY_WEATHER', 'BRILLIANT_STRATEGY',
            'OVERTAKE', 'BATTLE', 'FASTEST_LAP'
        ];

        for (const type of priorityOrder) {
            const candidates = events.filter(e => e.type === type);
            if (candidates.length === 0) continue;

            if (type === 'OVERTAKE' || type === 'BATTLE') {
                const sortedByPosition = candidates.sort((a, b) => (a.data?.position || 99) - (b.data?.position || 99));
                if (sortedByPosition[0].data?.position <= 5) {
                    return sortedByPosition[0];
                }
            } else {
                return candidates[0];
            }
        }
        return null;
    };
    
    const highlightEvent = selectHighlight(events);

    if (highlightEvent) {
        const message = formatEventMessage(highlightEvent);
        setCommentaryHighlight(message);

        highlightTimeoutRef.current = window.setTimeout(() => {
            setCommentaryHighlight(null);
        }, 8000);
    }
  }, [formatEventMessage]);

  const runSimulationLap = useCallback(() => {
    try {
      const fallbackTrack = seasonTracks[currentRaceIndex] || FULL_SEASON_TRACKS[0];
      const safeTrack = raceStateRef.current.track?.laps ? sanitizeTrackState(raceStateRef.current.track) : fallbackTrack;
      const safeLap = clampNumber(raceStateRef.current.lap ?? 0, 0, 0, safeTrack.laps + 1);
      const safeTotalLaps = clampNumber(
        raceStateRef.current.totalLaps ?? safeTrack.laps,
        safeTrack.laps,
        1,
        300
      );

      const hydratedRaceState: RaceState = {
        ...raceStateRef.current,
        track: safeTrack,
        lap: safeLap,
        totalLaps: safeTotalLaps,
        weather: raceStateRef.current.weather || 'Sunny',
        flag: raceStateRef.current.flag || RaceFlag.Green,
      };

      raceStateRef.current = hydratedRaceState;

      if (hydratedRaceState.lap > hydratedRaceState.totalLaps) {
        setGamePhase(GamePhase.FINISHED);
        return;
      }

      const { nextDrivers, nextRaceState, lapEvents } = calculateNextStates(
        driversRef.current,
        hydratedRaceState,
        personnelRef.current,
        fastestLapRef.current,
        addLog,
        setFastestLap,
        formatEventMessage,
        raceHistory
      );
      setDrivers(nextDrivers);
      setRaceState(nextRaceState);
      setRaceLapEvents(prev => [...prev, ...lapEvents]);
      handleCommentaryUpdate(lapEvents);
    } catch (error) {
      console.error('Race simulation failed, attempting recovery', error);

      const fallbackTrack = seasonTracks[currentRaceIndex] || FULL_SEASON_TRACKS[0];
      const safeTrack = raceStateRef.current.track?.laps ? sanitizeTrackState(raceStateRef.current.track) : fallbackTrack;
      const safeLap = clampNumber((raceStateRef.current.lap ?? 0) + 1, 1, 1, safeTrack.laps + 1);
      const safeTotalLaps = clampNumber(
        raceStateRef.current.totalLaps ?? safeTrack.laps,
        safeTrack.laps,
        1,
        300
      );

      const recoveredDrivers = driversRef.current.map(driver =>
        sanitizeDriverState(driver, safeTrack.baseLapTime, safeTrack)
      );

      setDrivers(recoveredDrivers);
      setRaceState(prev => ({
        ...prev,
        track: safeTrack,
        lap: safeLap,
        totalLaps: safeTotalLaps,
        weather: prev.weather || 'Sunny',
        flag: prev.flag || RaceFlag.Green,
      }));
      addLog('Race Control resets timing systems after a glitch. Race will continue.');
    }
  }, [
    addLog,
    currentRaceIndex,
    formatEventMessage,
    handleCommentaryUpdate,
    raceHistory,
    seasonTracks,
    setFastestLap,
  ]);

  const calculateRaceRatings = (finalDrivers: Driver[]): Driver[] => {
      const teammateMap = new Map<string, number[]>();
      finalDrivers.forEach(d => {
          const team = teammateMap.get(d.car.teamName) || [];
          team.push(d.id);
          teammateMap.set(d.car.teamName, team);
      });

      const activeCars = finalDrivers.filter(d => d.raceStatus !== 'Crashed' && d.raceStatus !== 'DNF');
      const gridAveragePace = activeCars.reduce((sum, d) => sum + d.car.overallPace, 0) / (activeCars.length || 1);

      return finalDrivers.map((d, index) => {
          let rating = 60;
          const posChange = d.startingPosition - d.position;

          rating += posChange * 1.5;

          if (d.raceStatus !== 'Crashed' && d.raceStatus !== 'DNF') {
              rating += (11 - d.position) * 1.25;
          } else {
              if (d.retirementReason === 'Crash') {
                  rating -= 25;
              } else if (d.retirementReason === 'Mechanical') {
                  rating -= 5;
              } else {
                  rating -= 15;
              }
          }

          const incidentCount = d.penalties.length;
          rating -= incidentCount * 10;
          if (d.raceStatus === 'Crashed') rating -= 15;

          const teammates = teammateMap.get(d.car.teamName);
          if (teammates && teammates.length === 2) {
              const teammateId = teammates.find(id => id !== d.id);
              const teammate = finalDrivers.find(td => td.id === teammateId);
              if (teammate && d.position < teammate.position) {
                  rating += 5;
              } else if (teammate && d.position > teammate.position) {
                  rating -= 5;
              }
          }

          if (fastestLap?.driverName === d.name) {
              rating += 5;
          }
          
          const carPerformanceModifier = (gridAveragePace - d.car.overallPace) * 0.75;
          rating += carPerformanceModifier;
          
          if (d.raceStatus !== 'Crashed' && d.raceStatus !== 'DNF') {
              const nearbyDrivers = finalDrivers.slice(Math.max(0, index - 2), Math.min(finalDrivers.length, index + 3)).filter(od => od.id !== d.id);
              if (nearbyDrivers.length > 0) {
                  const avgNearbyOpponentSkill = nearbyDrivers.reduce((sum, od) => sum + od.driverSkills.overall, 0) / nearbyDrivers.length;
                  const relativeOpponentModifier = (avgNearbyOpponentSkill - d.driverSkills.overall) * 0.5;
                  rating += relativeOpponentModifier;
              }
          }

          let finalRating = Math.max(0, Math.min(100, rating));

          if (d.raceStatus !== 'Crashed' && d.raceStatus !== 'DNF') {
              if (d.position === 1) {
                  finalRating = Math.max(finalRating, 90);
              } else if (d.position === 2) {
                  finalRating = Math.max(finalRating, 86);
              } else if (d.position === 3) {
                  finalRating = Math.max(finalRating, 85);
              }
          }
          
          d.raceRating = finalRating;
          return d;
      });
  };

  const awardPodiumFinishes = useCallback((finalDrivers: Driver[]) => {
    const podiumFinishers = finalDrivers.slice(0, 3);
    setRoster(prevRoster => {
        const newRoster = JSON.parse(JSON.stringify(prevRoster)) as InitialDriver[];
        podiumFinishers.forEach(finisher => {
            const rosterDriver = newRoster.find((d: InitialDriver) => d.id === finisher.id);
            if (rosterDriver) {
                rosterDriver.careerPodiums = (rosterDriver.careerPodiums || 0) + 1;
            }
        });
        return newRoster;
    });
  }, []);

  const awardRaceWin = useCallback((winner: Driver) => {
    if (!winner) return;
    setRoster(prevRoster => {
        const newRoster = JSON.parse(JSON.stringify(prevRoster)) as InitialDriver[];
        const rosterDriver = newRoster.find((d: InitialDriver) => d.id === winner.id);
        if (rosterDriver) {
            rosterDriver.careerWins = (rosterDriver.careerWins || 0) + 1;
        }
        return newRoster;
    });
  }, []);
  
  const handleProceedToAiSummary = () => {
      addLog('Checkered flag! The race has finished. Generating AI commentary...');
      setIsGeneratingSummary(true);
      const isLastRace = currentRaceIndex >= seasonTracks.length - 1;

      generateAiRaceSummary(drivers, raceState, season, currentRaceIndex, constructorStandings, raceLapEvents)
        .then(summary => {
          setAiSummary(summary);
          setGamePhase(GamePhase.AI_SUMMARY);
        })
        .catch(error => {
          console.error("Failed to get AI summary", error);
          if (isLastRace) {
            handleProceedToOffSeason();
          } else {
            handleProceedToNextRace();
          }
        })
        .finally(() => {
          setIsGeneratingSummary(false);
        });
  };

  const handleSkipAiSummary = () => {
    const isLastRace = currentRaceIndex >= seasonTracks.length - 1;
    if (isLastRace) {
        handleProceedToOffSeason();
    } else {
        handleProceedToNextRace();
    }
  };

  const handleContractOffer = (driverId: number, offerType: 'Lower' | 'Same' | 'Higher'): boolean => {
    const driver = roster.find(d => d.id === driverId);
    if (!driver || !playerTeam) return false;

    // Calculate live performance metrics for mid-season negotiations
    const liveDriverDebriefs = calculateDriverStockValue(standings, activeRoster);
    const liveTeamDebriefs = calculateTeamPrestige(constructorStandings, seasonHistory);
    
    const driverDebrief = liveDriverDebriefs.find(d => d.driverId === driverId);
    const teamDebrief = liveTeamDebriefs.find(t => t.teamName === playerTeam);

    if (!driverDebrief || !teamDebrief) return false;

    const accepted = resolveContractOffer(driver, driverDebrief.dsv, teamDebrief.tpr, offerType);

    setRoster(prev => prev.map(d => {
        if (d.id === driverId) {
            if (accepted) {
                let newSalary = d.salary;
                if(offerType === 'Higher') newSalary *= 1.2;
                if(offerType === 'Lower') newSalary *= 0.8;
                
                return { 
                    ...d, 
                    negotiationStatus: 'Signed',
                    salary: Math.round(newSalary),
                    happiness: Math.min(100, d.happiness + (offerType === 'Higher' ? 20 : (offerType === 'Same' ? 5 : -5))),
                    morale: Math.min(100, d.morale + (offerType === 'Higher' ? 15 : (offerType === 'Same' ? 3 : -8))),
                    contractExpiresIn: 1 + Math.floor(Math.random() * 3) 
                };
            } else {
                 return { 
                    ...d, 
                    negotiationStatus: 'Declined',
                    happiness: Math.max(0, d.happiness - (offerType === 'Lower' ? 25 : 15)),
                    morale: Math.max(0, d.morale - (offerType === 'Lower' ? 20 : 10)),
                };
            }
        }
        return d;
    }));
    
    addLog(`${driver.name} has ${accepted ? 'ACCEPTED' : 'REJECTED'} your contract offer.`);
    return accepted;
  };

  useEffect(() => {
    if (raceIntervalRef.current) {
      clearInterval(raceIntervalRef.current);
      raceIntervalRef.current = null;
    }

    if (gamePhase !== GamePhase.RACING) return;

    const scheduleInterval = () => {
      const baseLapDuration = Math.max(500, 2000 - (driversRef.current.filter(d => d.battle).length * 200));
      const lapDuration = baseLapDuration / simSpeed;

      raceIntervalRef.current = window.setInterval(() => {
        if (raceStateRef.current.lap > raceStateRef.current.totalLaps) {
          if (raceIntervalRef.current) clearInterval(raceIntervalRef.current);
          setGamePhase(GamePhase.FINISHED);
          return;
        }
        runSimulationLap();
      }, lapDuration);
    };

    scheduleInterval();

    return () => {
      if (raceIntervalRef.current) clearInterval(raceIntervalRef.current);
      if (highlightTimeoutRef.current) clearTimeout(highlightTimeoutRef.current);
    };
  }, [gamePhase, runSimulationLap, simSpeed]);

  useEffect(() => {
    if (gamePhase === GamePhase.FINISHED && drivers.length > 0 && !drivers[0].raceRating) {
      addLog('Finalizing race results and awarding points...');

      let finalDrivers = [...drivers];
      let positionChanges = false;
      
      finalDrivers.forEach(d => {
        const unservedPenalties = d.penalties.filter(p => p.type === 'Time' && !p.served);
        if (unservedPenalties.length > 0) {
            const totalPenaltyTime = unservedPenalties.reduce((sum, p) => sum + p.duration, 0);
            d.totalRaceTime += totalPenaltyTime;

            const penaltyReasons = unservedPenalties.map(p => `${p.duration}s for ${p.reason}`).join(', ');
            addLog(`${d.name} has post-race penalties totaling ${totalPenaltyTime}s (${penaltyReasons}) added to their race time.`);
            
            unservedPenalties.forEach(p => p.served = true);
            positionChanges = true;
        }
      });

      finalDrivers.sort(sortDrivers);
      const finalLeaderTime = finalDrivers.find(d => d.raceStatus !== 'Crashed' && d.raceStatus !== 'DNF')?.totalRaceTime || 0;
      
      finalDrivers.forEach((d, i) => {
          const oldPosition = d.position;
          d.position = i + 1;
          if (d.raceStatus !== 'Crashed' && d.raceStatus !== 'DNF') {
              d.gapToLeader = d.totalRaceTime - finalLeaderTime;
          }
          if (positionChanges && d.position !== oldPosition) {
              addLog(`${d.name} moves to P${d.position} after penalties are applied.`);
          }
      });
      
      finalDrivers = calculateRaceRatings(finalDrivers);
      
      setDrivers(finalDrivers);
      awardPoints(finalDrivers);
      awardConstructorPoints(finalDrivers);
      awardPodiumFinishes(finalDrivers);
      const winner = finalDrivers.find(d => d.position === 1 && (d.raceStatus === 'Racing' || d.raceStatus === 'In Pits'));
      if (winner) {
          awardRaceWin(winner);
          recordWinner(raceState.track.name, winner.id, season);
      }

      setRoster(prevRoster => {
          const newRoster = JSON.parse(JSON.stringify(prevRoster)) as InitialDriver[];
          finalDrivers.forEach(d => {
              const rosterDriver = newRoster.find((rd: InitialDriver) => rd.id === d.id);
              if(rosterDriver) {
                  if (d.raceRating) {
                      if (d.raceRating > 85) rosterDriver.form = Math.min(5, rosterDriver.form + 1);
                      if (d.raceRating < 40) rosterDriver.form = Math.max(-5, rosterDriver.form - 1);
                  }
                  if (!rosterDriver.seasonRaceRatings) {
                      rosterDriver.seasonRaceRatings = [];
                  }
                  if (d.raceRating) {
                      rosterDriver.seasonRaceRatings.push(d.raceRating);
                  }
              }
          });
          return newRoster;
      });
    }
  }, [gamePhase, drivers, awardPoints, awardConstructorPoints, awardPodiumFinishes, awardRaceWin, addLog, raceState.track.name, recordWinner, season]);

  const teamsDataForSelection = useMemo(() => {
    const initialTeamNames = Object.values(CARS).map((c: Car) => c.teamName).filter(name => name !== 'Cadillac Racing' || season > 2025);

    return initialTeamNames.map(teamName => {
        const car = Object.values(carRatings).find((c: Car) => c.teamName === teamName);
        const teamPersonnelData = personnel.find(p => p.teamName === teamName);
        const teamDrivers = roster.filter(d => d.car.teamName === teamName && d.status === 'Active');

        return {
            car,
            personnel: teamPersonnelData,
            drivers: teamDrivers,
        };
    }).filter(team => team.car && team.personnel && team.drivers.length > 0) as {car: Car; personnel: TeamPersonnel; drivers: InitialDriver[]}[];
  }, [carRatings, personnel, roster, season]);


  if (showHistoryScreen) {
      return <HistoryScreen history={seasonHistory} roster={roster} rookiePool={rookiePool} onClose={() => setShowHistoryScreen(false)} />;
  }
  
  if (showGarageScreen) {
      return <GarageScreen cars={Object.values(carRatings) as Car[]} onClose={() => setShowGarageScreen(false)} />;
  }

  const renderContent = () => {
    if (isGeneratingSummary || isGeneratingSeasonReview) {
        const message = isGeneratingSummary ? "Generating AI Race Report..." : "Generating AI Season Review...";
        const subMessage = isGeneratingSummary ? "This may take a moment." : "The AI is analyzing the season...";
        return (
            <div className="w-full max-w-6xl text-center">
                <h2 className="text-3xl font-bold text-white animate-pulse">{message}</h2>
                <p className="text-gray-400 mt-2">{subMessage}</p>
            </div>
        );
    }
    switch (gamePhase) {
      case GamePhase.TEAM_SELECTION:
        return <TeamSelectionScreen teams={teamsDataForSelection} onSelectTeam={handleSetPlayerTeam} onShowHowToPlay={() => setShowHowToPlay(true)} />;
      case GamePhase.SETUP:
        return <SetupScreen season={season} onStartPracticeWeekend={handleStartPracticeWeekend} seasonTracks={seasonTracks} currentRaceIndex={currentRaceIndex} onSetSeasonLength={handleSetSeasonLength} seasonLength={seasonLength} standings={standings} constructorStandings={constructorStandings} onResetStandings={handleResetAllStandings} onSelectTeam={handleSelectTeam} onShowHistory={() => setShowHistoryScreen(true)} onShowGarage={() => setShowGarageScreen(true)} onShowHq={() => setShowHqScreen(true)} onSkipToOffSeason={handleSkipToOffSeason} upcomingRaceQuote={upcomingRaceQuote} raceHistory={raceHistory} roster={roster} playerTeam={playerTeam} onSetPlayerTeam={handleSetPlayerTeam} onShowHowToPlay={() => setShowHowToPlay(true)} hqEventAvailable={!!hqEvent} hqImpact={pendingHqImpact || activeHqModifiers} preRaceModifiers={playerTeam ? weekendModifiers.filter(mod => mod.teamName === playerTeam) : []} />;
      case GamePhase.PRACTICE:
        return <PracticeScreen results={practiceResults} roster={activeRoster} onProceed={handleProceedToQualifying} />;
      case GamePhase.QUALIFYING:
        return <QualifyingScreen results={qualifyingResults} drivers={activeRoster} onProceed={handleProceedQualifying} onQualifyingFinish={handleStartRace} stage={qualifyingStage} />;
      case GamePhase.AI_SUMMARY:
        const isLastRace = currentRaceIndex >= seasonTracks.length - 1;
        return <AiSummaryScreen summary={aiSummary} onProceed={isLastRace ? handleProceedToOffSeason : handleProceedToNextRace} isLastRace={isLastRace} />;
      case GamePhase.FINISHED:
        return <RaceFinishScreen drivers={drivers} onProceed={handleProceedToAiSummary} onSkip={handleSkipAiSummary} />;
      case GamePhase.POST_SEASON_REVIEW:
        return <AiSeasonReviewScreen review={aiSeasonReview} season={season} onProceed={handleStartOffSeasonDebrief} />;
      case GamePhase.POST_SEASON:
        switch(offSeasonPhase) {
          case 'DEBRIEF':
            return <DebriefScreen season={season} onProceed={handleProceedToDriverProgression} teamDebriefs={teamDebriefs} driverDebriefs={driverDebriefs} mvi={mvi} onSelectTeam={handleSelectTeam} />;
          case 'DRIVER_PROGRESSION':
            return <DriverProgressionScreen season={season} log={driverProgressionLog} onProceed={handleProceedToFinancials} onSelectTeam={handleSelectTeam} />;
          case 'FINANCIALS':
            return <FinancialsScreen season={season} teamFinances={teamFinances} onProceed={handleProceedToResourceAllocation} onSelectTeam={handleSelectTeam} />
          case 'RESOURCE_ALLOCATION':
            return <ResourceAllocationScreen season={season} onProceed={handlePlayerResourceAllocation} onSelectTeam={handleSelectTeam} teamFinances={teamFinances} playerTeam={playerTeam!} roster={roster} />;
          case 'STAFFING':
            return <PersonnelScreen season={season} personnel={personnel} log={staffingLog} onProceed={handlePlayerPersonnelChanges} onSelectTeam={handleSelectTeam} playerTeam={playerTeam!} teamFinances={teamFinances} affiliateLog={affiliateLog} affiliateCandidates={affiliateCandidates} />
          case 'DRIVER_MARKET':
             return <DriverMarketScreen season={season} roster={roster} onProceed={handlePlayerRosterChanges} playerTeam={playerTeam!} teamFinances={teamFinances} rookiePool={rookiePool} shortlist={playerShortlist} />
          case 'DRIVER_MARKET_SUMMARY':
            return <DriverMarketSummaryScreen season={season} log={driverMarketLog} roster={roster} carRatings={Object.values(carRatings)} onProceed={handleProceedToRegulationChange} />;
          case 'REGULATION_CHANGE':
            return <RegulationChangeScreen season={season} log={regulationChangeLog} onProceed={handleProceedToCarDevelopment} onSelectTeam={handleSelectTeam} />;
          case 'CAR_DEVELOPMENT':
            return <CarDevelopmentScreen season={season} onProceed={handlePlayerCarDevelopment} onSelectTeam={handleSelectTeam} playerTeam={playerTeam!} teamFinances={teamFinances} carRatings={carRatings} personnel={personnel} />
          default: return null;
        }
      case GamePhase.RACING:
        return (
          <main className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 flex flex-col gap-4">
              <Leaderboard drivers={drivers} onSelectTeam={handleSelectTeam} />
              <EventLog log={log} />
            </div>
            <div className="lg:col-span-1 flex flex-col gap-4">
              <RaceControlPanel raceState={raceState} simSpeed={simSpeed} onSpeedChange={setSimSpeed} raceHistory={raceHistory} roster={roster} season={season} />
              <TrackDisplay drivers={drivers} track={raceState.track} simSpeed={simSpeed} />
              <CommentaryBox message={commentaryHighlight} />
            </div>
          </main>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans p-4 flex flex-col items-center">
      {gamePhase !== GamePhase.TEAM_SELECTION && (
         <header className="w-full max-w-7xl relative text-center mb-4">
            <h1 className="text-4xl font-bold text-red-500 tracking-wider">F1 Strategy Simulator</h1>
            <p className="text-gray-400">{gamePhase !== GamePhase.POST_SEASON ? `${season} Season - Race ${currentRaceIndex + 1} of ${seasonTracks.length}` : ''}</p>
            {playerTeam && <p className="text-lg font-semibold text-teal-400 mt-1">Managing: {playerTeam}</p>}
            <button
              onClick={() => setShowHowToPlay(true)}
              className="absolute top-0 right-0 py-2 px-4 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition duration-300"
            >
              How to Play
            </button>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={handleGenerateSave}
                className="py-2 px-4 bg-blue-700 hover:bg-blue-600 text-white font-semibold rounded-lg transition duration-300"
              >
                Save Game (Generate Code)
              </button>
              <button
                onClick={() => { setShowLoadModal(true); setLoadStatusMessage(null); }}
                className="py-2 px-4 bg-green-700 hover:bg-green-600 text-white font-semibold rounded-lg transition duration-300"
              >
                Load Game (Paste Code)
              </button>
            </div>
        </header>
      )}
      {renderContent()}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl shadow-xl relative">
            <h2 className="text-2xl font-bold text-white mb-2">Manual Save Code</h2>
            <p className="text-gray-300 text-sm mb-3">Copy this code and keep it somewhere safe. You can paste it back later to continue your game.</p>
            <textarea
              className="w-full h-40 bg-gray-900 text-gray-100 p-3 rounded border border-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              value={saveCodeValue}
              readOnly
            />
            {saveStatusMessage && <p className="text-sm text-teal-300 mt-2">{saveStatusMessage}</p>}
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowSaveModal(false)}
                className="py-2 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded"
              >
                Close
              </button>
              <button
                onClick={handleCopySaveCode}
                className="py-2 px-4 bg-blue-700 hover:bg-blue-600 text-white rounded"
              >
                Copy to Clipboard
              </button>
            </div>
          </div>
        </div>
      )}
      {showLoadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl shadow-xl relative">
            <h2 className="text-2xl font-bold text-white mb-2">Load Game from Code</h2>
            <p className="text-gray-300 text-sm mb-3">Paste a previously saved code to restore your game state.</p>
            <textarea
              className="w-full h-40 bg-gray-900 text-gray-100 p-3 rounded border border-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              value={loadCodeValue}
              onChange={(e) => setLoadCodeValue(e.target.value)}
              placeholder="Paste your save code here"
            />
            {loadStatusMessage && <p className="text-sm mt-2 text-amber-300">{loadStatusMessage}</p>}
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => { setShowLoadModal(false); setLoadStatusMessage(null); }}
                className="py-2 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleLoadFromCode}
                className="py-2 px-4 bg-green-700 hover:bg-green-600 text-white rounded"
              >
                Load from Code
              </button>
            </div>
          </div>
        </div>
      )}
      <TeamDetailModal
        isOpen={!!selectedTeam}
        onClose={handleCloseModal}
        team={selectedTeamData}
      />
       <HowToPlayModal isOpen={showHowToPlay} onClose={() => setShowHowToPlay(false)} />
       {playerTeam && personnel.find(p => p.teamName === playerTeam) && (
        <HeadquartersScreen
          isOpen={showHqScreen}
          onClose={() => setShowHqScreen(false)}
          personnel={personnel.find(p => p.teamName === playerTeam) as TeamPersonnel}
          drivers={roster.filter(d => d.car.teamName === playerTeam && d.status === 'Active')}
          affiliate={personnel.find(p => p.teamName === playerTeam)!.affiliateDriver}
          onContractOffer={handleContractOffer}
          event={hqEvent}
          pendingImpact={pendingHqImpact}
          activeImpact={activeHqModifiers}
          onResolveEvent={handleResolveHeadquartersEvent}
        />
       )}
    </div>
  );
};

export default App;
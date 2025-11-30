import { RaceState, Driver, TeamPersonnel, LapEvent, Track, RaceFlag, RaceHistory, TyreCompound, Tyre } from '../types';
import { TYRE_LIFE, TYRE_PROPERTIES, TIRE_BLANKET_TEMP } from '../constants';
import { clampNumber, hydrateRaceState, sanitizeDriverState, sanitizeLapTiming, sanitizeTrackState } from './raceEngine';
import { computeSafeLapTime, safeClampNumber } from '../utils/lapUtils';
import { simulateLapIncidents } from './incidentService';
import { calculateCarLinkImpact } from './carLinkService';

export type RaceLapResult = {
  nextDrivers: Driver[];
  nextRaceState: RaceState;
  lapEvents: LapEvent[];
};

const WEATHER_MULTIPLIERS: Record<string, number> = {
  'Extreme Rain': 1.18,
  'Heavy Rain': 1.08,
  'Light Rain': 1.04,
};

const PIT_EVENT: Record<string, LapEvent['type']> = {
  entry: 'PIT_ENTRY',
  exit: 'PIT_EXIT',
};

const isWetWeather = (weather: string) => weather.includes('Rain');

const needsWeatherTyre = (compound: TyreCompound, weather: string, waterLevel: number) => {
  if (!isWetWeather(weather)) {
    return compound === TyreCompound.Intermediate || compound === TyreCompound.Wet;
  }
  if (weather === 'Extreme Rain' || weather === 'Heavy Rain') {
    return compound !== TyreCompound.Wet;
  }
  const isSlick = compound === TyreCompound.Soft || compound === TyreCompound.Medium || compound === TyreCompound.Hard;
  return weather === 'Light Rain' && isSlick;
};

const pickTyreForConditions = (
  driver: Driver,
  raceState: RaceState,
  weather: string,
  waterLevel: number,
): TyreCompound => {
  if (isWetWeather(weather)) {
    if (weather === 'Extreme Rain' || weather === 'Heavy Rain' || waterLevel > 50) return TyreCompound.Wet;
    return TyreCompound.Intermediate;
  }

  const remaining = Math.max(1, raceState.totalLaps - raceState.lap);
  if (remaining <= TYRE_LIFE.Soft) return TyreCompound.Soft;
  if (remaining <= TYRE_LIFE.Medium + 3) return TyreCompound.Medium;
  if (driver.compoundsUsed.includes(TyreCompound.Hard)) return TyreCompound.Medium;
  return TyreCompound.Hard;
};

const applyPitStop = (
  driver: Driver,
  raceState: RaceState,
  nextTyre: TyreCompound,
  lapEvents: LapEvent[],
) => {
  driver.pittedThisLap = true;
  driver.pitStops += 1;
  driver.currentTyres = {
    compound: nextTyre,
    wear: 0,
    age: 0,
    temperature: TIRE_BLANKET_TEMP,
    condition: 'Cold',
  } as Tyre;
  if (!driver.compoundsUsed.includes(nextTyre)) driver.compoundsUsed.push(nextTyre);
  if ([TyreCompound.Wet, TyreCompound.Intermediate].includes(nextTyre)) driver.hasUsedWetTyre = true;
  lapEvents.push({ type: PIT_EVENT.entry, driverName: driver.name, data: { tyre: nextTyre } });
  driver.lapTime += raceState.track.pitLaneTimeLoss;
};

const degradeTyres = (driver: Driver, track: Track, isWet: boolean) => {
  const props = TYRE_PROPERTIES[driver.currentTyres.compound];
  const baseDeg = (100 / (TYRE_LIFE[driver.currentTyres.compound] || 30)) * (0.7 + (track.tyreStress / 5) * 0.6);
  let multiplier = Math.max(0.6, 1.8 - (driver.driverSkills.tyreManagement / 90));
  if (driver.driverSkills.trait?.id === 'TYRE_WHISPERER') multiplier -= 0.25;
  if (driver.paceMode === 'Pushing') multiplier *= 1.1;
  if (driver.paceMode === 'Conserving') multiplier *= 0.85;
  if (!isWet && [TyreCompound.Intermediate, TyreCompound.Wet].includes(driver.currentTyres.compound)) multiplier *= 2.5;
  if (isWet) multiplier *= 0.7;

  driver.currentTyres.temperature += props.heatGenerationFactor * (track.tyreStress + (driver.paceMode === 'Pushing' ? 8 : driver.paceMode === 'Standard' ? 5 : 2));
  driver.currentTyres.temperature = clampNumber(driver.currentTyres.temperature, track.tyreStress > 4 ? 60 : 40, 30, 150);

  driver.currentTyres.wear = Math.min(100, driver.currentTyres.wear + baseDeg * multiplier);
  driver.currentTyres.age += 1;
};

const computeLapTime = (
  driver: Driver,
  raceState: RaceState,
  weather: string,
  track: Track,
): number => {
  const baseRef = track.baseLapTime;
  const waterLevel = raceState.trackCondition.waterLevel;
  const isWet = isWetWeather(weather);
  const carAnchor = clampNumber(driver.car.overallPace ?? 80, 80, 40, 120);
  const driverAnchor = clampNumber(driver.driverSkills.overall ?? 80, 80, 40, 120);
  const wearPenalty = clampNumber(driver.currentTyres.wear ?? 0, 0, 0, 100) * 0.04;
  const fuelPenalty = clampNumber(driver.fuelLoad ?? 90, 90, 0, 120) * 0.025;
  const formBoost = (Number.isFinite(driver.form) ? driver.form : 0) * -0.03;
  const craftPenalty = (100 - driver.driverSkills.raceCraft) * 0.02;
  const carDelta = (100 - carAnchor) * 0.05;
  const driverDelta = (100 - driverAnchor) * 0.06;
  const tyreBonus = driver.gripAdvantage ? -driver.gripAdvantage.bonus : 0;
  const hqLapDelta = driver.hqModifiers?.lapTimeModifier ? -driver.hqModifiers.lapTimeModifier : 0;
  const carLinkImpact = calculateCarLinkImpact(driver, { lapNumber: raceState.lap, session: 'race' });
  const randomSwing = (Math.random() - 0.5) * 1.6;

  let baseLap = baseRef + wearPenalty + fuelPenalty + craftPenalty + carDelta + driverDelta + tyreBonus + hqLapDelta + carLinkImpact.adaptationDrag - carLinkImpact.synergyBonus + randomSwing + formBoost;

  const weatherMultiplier = WEATHER_MULTIPLIERS[weather] || (isWet ? 1 + waterLevel / 4000 : 1);
  const flagMultiplier = raceState.flag === RaceFlag.SafetyCar ? 1.5 : raceState.flag === RaceFlag.VirtualSafetyCar ? 1.3 : 1;

  return computeSafeLapTime(baseLap, {
    weatherMultiplier,
    flagMultiplier,
    raceCraftPenalty: craftPenalty,
    lapPerformanceModifier: randomSwing,
    baseLapReference: baseRef,
  });
};

export const simulateRaceLap = (
  prevDrivers: Driver[],
  prevRaceState: RaceState,
  personnel: TeamPersonnel[],
  fastestLap: { driverName: string; time: number } | null,
  addLog: (message: string) => void,
  setFastestLap: React.Dispatch<React.SetStateAction<{ driverName: string; time: number } | null>>,
  formatEventMessage: (event: LapEvent) => string,
  raceHistory: RaceHistory,
  fallbackTrack: Track,
): RaceLapResult => {
  const hydrated = hydrateRaceState(prevRaceState, fallbackTrack);
  let nextRaceState: RaceState = {
    ...hydrated,
    track: sanitizeTrackState(hydrated.track),
    airTemp: clampNumber(hydrated.airTemp, 25, -10, 60),
    trackTemp: clampNumber(hydrated.trackTemp, 40, -10, 80),
  };

  let nextDrivers = prevDrivers.map((driver) => sanitizeLapTiming(sanitizeDriverState(driver, nextRaceState.track.baseLapTime, nextRaceState.track), nextRaceState.track.baseLapTime, nextRaceState.track));

  const lapEvents: LapEvent[] = [];
  const flagTriggers: RaceFlag[] = [];

  const weather = nextRaceState.masterWeatherForecast[nextRaceState.lap - 1] || nextRaceState.weather || 'Sunny';
  let waterLevel = clampNumber(nextRaceState.trackCondition.waterLevel ?? 0, 0, 0, 100);
  if (weather === 'Heavy Rain') waterLevel = Math.min(100, waterLevel + 10);
  else if (weather === 'Extreme Rain') waterLevel = Math.min(100, waterLevel + 20);
  else if (weather === 'Light Rain') waterLevel = Math.min(100, waterLevel + 4);
  else waterLevel = Math.max(0, waterLevel - 5);

  nextRaceState = {
    ...nextRaceState,
    weather,
    trackCondition: { waterLevel, gripLevel: 100 - waterLevel },
    flag: nextRaceState.flag || RaceFlag.Green,
    flagLaps: nextRaceState.flagLaps || 0,
  };

  if (nextRaceState.lap === 0) {
    nextRaceState.lap = 1;
  }

  const redFlagActive = nextRaceState.flag === RaceFlag.Red && nextRaceState.flagLaps > 0;

  if (redFlagActive) {
    nextRaceState.flagLaps = Math.max(0, nextRaceState.flagLaps - 1);
    lapEvents.unshift({ type: 'RED_FLAG', driverName: 'Race Control', data: { status: 'Cars queued' } });
    nextDrivers = nextDrivers.map((driver) => ({
      ...driver,
      lapTime: safeClampNumber(driver.lapTime, nextRaceState.track.baseLapTime, 40, 400),
      totalRaceTime: safeClampNumber(driver.totalRaceTime, driver.lapTime || nextRaceState.track.baseLapTime, 0, Number.MAX_SAFE_INTEGER),
      pittedThisLap: false,
    }));

    if (nextRaceState.flagLaps === 0) {
      nextRaceState.flag = RaceFlag.Green;
      nextDrivers.forEach((d) => (d.pittedUnderSCThisPeriod = false));
      addLog('Race Control: red flag cleared, racing will resume.');
    } else {
      addLog('Race Control: red flag in effect — cars lined up on the grid.');
    }

    return {
      nextDrivers,
      nextRaceState,
      lapEvents,
    };
  }

  const incidentData = simulateLapIncidents(nextDrivers, nextRaceState.track, weather, nextRaceState.trackCondition, nextRaceState.lap);
  nextDrivers = incidentData.updatedDrivers;
  lapEvents.push(...incidentData.lapEvents);
  flagTriggers.push(...incidentData.flagTriggers);

  const redFlagTriggered = flagTriggers.includes(RaceFlag.Red);
  if (redFlagTriggered) {
    nextRaceState.flag = RaceFlag.Red;
    nextRaceState.flagLaps = Math.max(nextRaceState.flagLaps || 0, 3);
    lapEvents.unshift({ type: 'RED_FLAG', driverName: 'Race Control', data: { status: 'Session stopped' } });
    nextDrivers = nextDrivers.map((driver) => ({
      ...driver,
      lapTime: safeClampNumber(driver.lapTime, nextRaceState.track.baseLapTime, 40, 400),
      totalRaceTime: safeClampNumber(driver.totalRaceTime, driver.lapTime || nextRaceState.track.baseLapTime, 0, Number.MAX_SAFE_INTEGER),
      pittedThisLap: false,
    }));
    addLog('Race Control: red flag — cars will line up and await the restart.');

    return {
      nextDrivers,
      nextRaceState,
      lapEvents,
    };
  }

  const isWet = isWetWeather(weather);

  nextDrivers.forEach((driver) => {
    if (driver.raceStatus === 'Crashed' || driver.raceStatus === 'DNF' || nextRaceState.flag === RaceFlag.Red) {
      driver.lapTime = safeClampNumber(driver.lapTime, nextRaceState.track.baseLapTime, 40, 400);
      return;
    }

    driver.pittedThisLap = false;
    driver.pittedUnderSCThisPeriod = driver.pittedUnderSCThisPeriod || false;

    const tyre = driver.currentTyres;
    const wrongWeatherTyre = needsWeatherTyre(tyre.compound, weather, waterLevel);
    const wearCritical = tyre.wear > 92 || tyre.condition === 'Blistering';
    const strategyStop = driver.strategy.pitStops[driver.pitStops]?.lap === nextRaceState.lap;
    const shouldPit = wrongWeatherTyre || wearCritical || strategyStop;

    if (shouldPit) {
      const nextTyre = pickTyreForConditions(driver, nextRaceState, weather, waterLevel);
      applyPitStop(driver, nextRaceState, nextTyre, lapEvents);
    }

    const trackWinners = raceHistory[nextRaceState.track.name] || [];
    const winnerBonus = trackWinners.some((w) => w.winnerId === driver.id) ? -0.15 : 0;

    const lapTime = computeLapTime(driver, nextRaceState, weather, nextRaceState.track) + winnerBonus;
    const lapTimeApplied = safeClampNumber(lapTime + (driver.pittedThisLap ? 0 : 0), nextRaceState.track.baseLapTime, 40, 400);

    const startingTotal = Number.isFinite(driver.totalRaceTime) ? driver.totalRaceTime : lapTimeApplied;
    driver.lapTime = lapTimeApplied;
    driver.totalRaceTime = safeClampNumber(startingTotal + lapTimeApplied, lapTimeApplied, 0, Number.MAX_SAFE_INTEGER);

    degradeTyres(driver, nextRaceState.track, isWet);
    driver.fuelLoad = Math.max(0, driver.fuelLoad - 1.6);

    if (driver.raceStatus === 'Racing' && nextRaceState.flag === RaceFlag.Green && (!fastestLap || driver.lapTime < fastestLap.time)) {
      setFastestLap({ driverName: driver.name, time: driver.lapTime });
      lapEvents.push({ type: 'FASTEST_LAP', driverName: driver.name, data: { time: driver.lapTime } });
    }
  });

  if (nextRaceState.flagLaps > 0) {
    nextRaceState.flagLaps -= 1;
  }

  if (nextRaceState.flagLaps === 0 && nextRaceState.flag !== RaceFlag.Green) {
    nextRaceState.flag = RaceFlag.Green;
    nextDrivers.forEach((d) => (d.pittedUnderSCThisPeriod = false));
    addLog('Race Control: track clear, green flag conditions restored.');
  }

  if (nextRaceState.flag === RaceFlag.Green) {
    if (flagTriggers.includes(RaceFlag.Red)) {
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

  nextDrivers = nextDrivers.map((driver) => sanitizeLapTiming(driver, nextRaceState.track.baseLapTime, nextRaceState.track));
  nextDrivers.sort((a, b) => {
    const aOut = a.raceStatus === 'Crashed' || a.raceStatus === 'DNF';
    const bOut = b.raceStatus === 'Crashed' || b.raceStatus === 'DNF';
    if (aOut && !bOut) return 1;
    if (!aOut && bOut) return -1;
    if (aOut && bOut) return (b.retirementLap || 0) - (a.retirementLap || 0);
    return a.totalRaceTime - b.totalRaceTime;
  });

  const leaderTime = nextDrivers.find((d) => d.raceStatus !== 'Crashed' && d.raceStatus !== 'DNF')?.totalRaceTime || 0;
  nextDrivers.forEach((driver, index) => {
    driver.position = index + 1;
    if (driver.raceStatus !== 'Crashed' && driver.raceStatus !== 'DNF') {
      driver.gapToLeader = driver.totalRaceTime - leaderTime;
    }
  });

  lapEvents.forEach((event, idx) => setTimeout(() => addLog(formatEventMessage(event)), idx * 350));

  return {
    nextDrivers,
    nextRaceState: { ...nextRaceState, lap: nextRaceState.lap + 1 },
    lapEvents,
  };
};


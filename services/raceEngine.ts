import { Car, Driver, RaceState, Strategy, Track, TyreCompound, WeekendModifier, RaceFlag } from '../types';
import { TIRE_BLANKET_TEMP } from '../constants';

export const clampNumber = (value: number, fallback: number, min?: number, max?: number): number => {
  if (!Number.isFinite(value)) return fallback;
  if (min !== undefined && value < min) return min;
  if (max !== undefined && value > max) return max;
  return value;
};

const sanitizeWeekendModifier = (modifier?: WeekendModifier | null): WeekendModifier | undefined => {
  if (!modifier) return undefined;

  const safeNumber = (val: number | undefined, fallback = 0, min = -9999, max = 9999) => clampNumber(val ?? fallback, fallback, min, max);
  return {
    ...modifier,
    lapTimeModifier: safeNumber(modifier.lapTimeModifier, 0, -5, 5),
    qualifyingSkillDelta: safeNumber(modifier.qualifyingSkillDelta, 0, -20, 20),
    paceDelta: safeNumber(modifier.paceDelta, 0, -25, 25),
    reliabilityDelta: safeNumber(modifier.reliabilityDelta, 0, -50, 50),
    tyreLifeMultiplier: safeNumber(modifier.tyreLifeMultiplier, 1, 0.5, 1.5),
    tyreWearDelta: safeNumber(modifier.tyreWearDelta, 0, -20, 20),
    tyreDegMultiplier: safeNumber(modifier.tyreDegMultiplier, 1, 0.4, 1.6),
    dnfRiskDelta: safeNumber(modifier.dnfRiskDelta, 0, -25, 25),
    pitStopTimeDelta: safeNumber(modifier.pitStopTimeDelta, 0, -5, 5),
    pitMistakeChanceDelta: safeNumber(modifier.pitMistakeChanceDelta, 0, -25, 25),
    moraleDelta: safeNumber(modifier.moraleDelta, 0, -50, 50),
    reputationDelta: safeNumber(modifier.reputationDelta, 0, -50, 50),
    budgetDelta: safeNumber(modifier.budgetDelta, 0, -1_000_000, 1_000_000),
    engineWearDelta: safeNumber(modifier.engineWearDelta, 0, -50, 50),
    confidenceDelta: safeNumber(modifier.confidenceDelta, 0, -50, 50),
  };
};

export const sanitizeStrategy = (strategy: Strategy | undefined, track: Track, fallbackTyre: TyreCompound): Strategy => {
  const safeStrategy = strategy || { startingTyre: fallbackTyre, pitStops: [] };

  const totalLaps = Math.max(10, track.laps || 50);
  const startingTyre = safeStrategy.startingTyre || (totalLaps <= 35 ? TyreCompound.Soft : TyreCompound.Medium);
  const pitStops = Array.isArray(safeStrategy.pitStops) ? safeStrategy.pitStops : [];

  const buildDefaultPlan = (): { lap: number; tyre: TyreCompound }[] => {
    if (totalLaps >= 45) {
      return [
        { lap: Math.floor(totalLaps / 3), tyre: TyreCompound.Medium },
        { lap: Math.floor((2 * totalLaps) / 3), tyre: TyreCompound.Hard },
      ];
    }
    if (totalLaps >= 30) {
      return [{ lap: Math.floor(totalLaps / 2), tyre: TyreCompound.Hard }];
    }
    return [
      {
        lap: Math.max(1, Math.floor(totalLaps * 0.55)),
        tyre: fallbackTyre === TyreCompound.Soft ? TyreCompound.Medium : fallbackTyre,
      },
    ];
  };

  const sanitizedStops = pitStops
    .map(stop => ({
      lap: clampNumber(stop?.lap, Math.floor(track.laps / 2), 1, Math.max(1, track.laps - 1)),
      tyre: stop?.tyre || fallbackTyre,
    }))
    .sort((a, b) => a.lap - b.lap);

  if (sanitizedStops.length === 0) {
    sanitizedStops.push(...buildDefaultPlan());
  }

  for (let i = 1; i < sanitizedStops.length; i++) {
    const minLap = sanitizedStops[i - 1].lap + 2;
    if (sanitizedStops[i].lap < minLap) {
      sanitizedStops[i].lap = minLap;
    }
  }

  return { startingTyre, pitStops: sanitizedStops };
};

export const sanitizeTrackState = (track: Track): Track => {
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

export const sanitizeDriverState = (driver: Driver, baseLapRef: number, track: Track): Driver => {
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
  const safeHqModifiers = sanitizeWeekendModifier(driver.hqModifiers);

  return {
    ...driver,
    driverSkills: safeDriverSkills,
    car: safeCar,
    carLink: safeCarLink,
    form: safeForm,
    hqModifiers: safeHqModifiers,
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

export const buildFallbackLapTime = (driver: Driver, baseLapRef: number, track: Track): number => {
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

export const sanitizeLapTiming = (driver: Driver, baseLapRef: number, track: Track): Driver => {
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

export const hydrateRaceState = (raceState: RaceState, fallbackTrack: Track): RaceState => {
  const safeTrack = raceState.track?.laps ? sanitizeTrackState(raceState.track) : sanitizeTrackState(fallbackTrack);
  const safeLap = clampNumber(raceState.lap ?? 0, 0, 0, safeTrack.laps + 1);
  const safeTotalLaps = clampNumber(raceState.totalLaps ?? safeTrack.laps, safeTrack.laps, 1, 300);

  return {
    ...raceState,
    track: safeTrack,
    lap: safeLap,
    totalLaps: safeTotalLaps,
    weather: raceState.weather || 'Sunny',
    flag: raceState.flag || RaceFlag.Green,
    trackCondition: {
      waterLevel: clampNumber(raceState.trackCondition?.waterLevel ?? 0, 0, 0, 100),
      gripLevel: clampNumber(raceState.trackCondition?.gripLevel ?? 100, 100, 0, 100),
    },
    masterWeatherForecast: raceState.masterWeatherForecast?.length
      ? raceState.masterWeatherForecast
      : Array.from({ length: safeTrack.laps }, () => raceState.weather || 'Sunny'),
    teamWeatherForecasts: raceState.teamWeatherForecasts || {},
  };
};


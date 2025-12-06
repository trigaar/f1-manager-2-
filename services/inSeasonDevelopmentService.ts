import { Car, DevFocusArea, DevRiskProfile, MidSeasonAdjustment, MidSeasonDevelopmentPrompt, TeamFinances, TeamPersonnel } from '../types';

const FOCUS_MAP: Record<DevFocusArea, Array<keyof Car>> = {
  aero: ['highSpeedCornering', 'mediumSpeedCornering'],
  chassis: ['lowSpeedCornering', 'tyreWearFactor', 'reliability'],
  powertrain: ['powerSensitivity'],
};

const clampStat = (value: number, min = 10, max = 100) => Math.max(min, Math.min(max, value));

const recalcOverallPace = (car: Car) => {
  car.overallPace = Math.round(
    (car.highSpeedCornering + car.mediumSpeedCornering + car.lowSpeedCornering + car.powerSensitivity) / 4
  );
};

const pickAiRisk = (personnel?: TeamPersonnel | null): DevRiskProfile => {
  const personality = personnel?.teamPrincipal?.personality;
  switch (personality) {
    case 'Visionary':
    case 'Ruthless Operator':
      return Math.random() < 0.7 ? 'Aggressive' : 'Balanced';
    case 'Pragmatist':
      return Math.random() < 0.2 ? 'Aggressive' : Math.random() < 0.5 ? 'Balanced' : 'Conservative';
    case 'Loyalist':
    default:
      return Math.random() < 0.2 ? 'Balanced' : 'Conservative';
  }
};

const pickFocusFromDeficit = (car: Car, gridAverage: Car): DevFocusArea => {
  const aeroGap = (gridAverage.highSpeedCornering + gridAverage.mediumSpeedCornering) / 2 -
    (car.highSpeedCornering + car.mediumSpeedCornering) / 2;
  const chassisGap = (gridAverage.lowSpeedCornering + gridAverage.tyreWearFactor + gridAverage.reliability) / 3 -
    (car.lowSpeedCornering + car.tyreWearFactor + car.reliability) / 3;
  const powerGap = gridAverage.powerSensitivity - car.powerSensitivity;

  const sorted = [
    { focus: 'aero' as DevFocusArea, gap: aeroGap },
    { focus: 'chassis' as DevFocusArea, gap: chassisGap },
    { focus: 'powertrain' as DevFocusArea, gap: powerGap },
  ].sort((a, b) => b.gap - a.gap);

  return sorted[0].focus;
};

const computeFacilityScore = (personnel?: TeamPersonnel | null) => {
  if (!personnel) return 0.5;
  const { facilities } = personnel;
  const total = facilities.aero + facilities.chassis + facilities.powertrain;
  return Math.max(0.2, Math.min(1.2, total / 180));
};

const computeStaffScore = (personnel?: TeamPersonnel | null) => {
  if (!personnel) return 0.5;
  const tp = personnel.teamPrincipal;
  const hot = personnel.headOfTechnical;
  const leadership = tp?.leadership ?? 10;
  const financialAcumen = tp?.financialAcumen ?? 10;
  const rdConversion = hot?.rdConversion ?? 15;
  const innovation = hot?.innovation ?? 15;
  return Math.max(0.2, Math.min(1.2, (leadership + financialAcumen + rdConversion + innovation) / 200));
};

const riskProfiles: Record<DevRiskProfile, { riskPenalty: number; magnitude: [number, number]; }> = {
  Conservative: { riskPenalty: 0.08, magnitude: [0.25, 1.25] },
  Balanced: { riskPenalty: 0.14, magnitude: [0.5, 1.65] },
  Aggressive: { riskPenalty: 0.22, magnitude: [0.75, 2.2] },
};

const applyDeltaToCar = (
  car: Car,
  focus: DevFocusArea,
  magnitude: number,
  success: boolean,
): Partial<Car> => {
  const attrs = FOCUS_MAP[focus];
  const deltas: Partial<Car> = {};
  attrs.forEach(attr => {
    const current = car[attr];
    const change = success ? magnitude : -magnitude * 0.7;
    const updated = clampStat(current + change);
    (car as any)[attr] = updated;
    (deltas as any)[attr] = parseFloat((updated - current).toFixed(2));
  });
  recalcOverallPace(car);
  deltas.overallPace = car.overallPace;
  return deltas;
};

const describeAdjustment = (
  teamName: string,
  focus: DevFocusArea,
  risk: DevRiskProfile,
  success: boolean,
  deltas: Partial<Car>,
  appliedAfterRace: number,
): MidSeasonAdjustment => {
  const focusLabel = {
    aero: 'Aero package',
    chassis: 'Chassis & reliability',
    powertrain: 'Power unit',
  }[focus];
  const magnitude = Math.max(...Object.values(deltas).map(v => Math.abs(Number(v))) || [0]);
  const direction = success ? 'gains' : 'setbacks';
  const description = `${teamName} ${direction} on ${focusLabel.toLowerCase()} after race ${appliedAfterRace} (${risk}) with Δ≈${magnitude.toFixed(1)}.`;
  return {
    teamName,
    focus,
    risk,
    delta: deltas,
    outcome: success ? 'Gain' : 'Loss',
    description,
    appliedAfterRace,
  };
};

export const evaluateInSeasonDevelopment = (
  carRatings: { [key: string]: Car },
  personnel: TeamPersonnel[],
  finances: TeamFinances[],
  completedRaces: number,
  season: number,
  playerTeam?: string | null,
): { newCarRatings: { [key: string]: Car }; adjustments: MidSeasonAdjustment[]; playerPrompt: MidSeasonDevelopmentPrompt | null } => {
  const isCheckpoint = completedRaces > 0 && completedRaces % 4 === 0;
  const newCarRatings = JSON.parse(JSON.stringify(carRatings)) as { [key: string]: Car };
  const adjustments: MidSeasonAdjustment[] = [];
  let playerPrompt: MidSeasonDevelopmentPrompt | null = null;
  if (!isCheckpoint) return { newCarRatings, adjustments, playerPrompt };

  const carList = Object.values(newCarRatings);
  const gridAverage = carList.reduce((acc, car) => {
    (Object.keys(car) as Array<keyof Car>).forEach(key => {
      const val = typeof car[key] === 'number' ? (car[key] as number) : 0;
      (acc as any)[key] = ((acc as any)[key] || 0) + val / carList.length;
    });
    return acc;
  }, { ...carList[0] });

  Object.keys(newCarRatings).forEach(carKey => {
    const car = newCarRatings[carKey];
    const teamPersonnel = personnel.find(p => p.teamName === car.teamName);
    const teamFinance = finances.find(f => f.teamName === car.teamName);
    const focus = pickFocusFromDeficit(car, gridAverage);

    if (playerTeam && car.teamName === playerTeam) {
      const focusOrder: DevFocusArea[] = ['aero', 'chassis', 'powertrain'];
      const deficitOrdered = focusOrder.sort((a, b) => {
        const aFocus = pickFocusFromDeficit(car, gridAverage) === a ? 1 : 0;
        const bFocus = pickFocusFromDeficit(car, gridAverage) === b ? 1 : 0;
        return bFocus - aFocus;
      });
      const facilityScore = computeFacilityScore(teamPersonnel);
      const staffScore = computeStaffScore(teamPersonnel);
      const investmentScore = (teamFinance?.personnelInvestment || 0) / 150_000_000;
      const baseSuccess = 0.55 + facilityScore * 0.2 + staffScore * 0.15 + investmentScore;
      const options: MidSeasonDevelopmentPrompt['options'] = [
        {
          id: 'conservative',
          label: 'Conservative Reliability Push',
          focus: deficitOrdered[1] || 'chassis',
          risk: 'Conservative',
          successRange: [baseSuccess - 0.05, baseSuccess + 0.05],
          failureRange: [0.1, 0.25],
          summary: 'Safer, smaller upgrades with low setback risk. Ideal for banking steady progress.',
        },
        {
          id: 'balanced',
          label: 'Balanced Package',
          focus: focus,
          risk: 'Balanced',
          successRange: [baseSuccess - 0.1, baseSuccess + 0.05],
          failureRange: [0.15, 0.35],
          summary: 'Blend of performance and caution guided by leadership and facilities.',
        },
        {
          id: 'aggressive',
          label: 'Aggressive Gamble',
          focus: deficitOrdered[0] || focus,
          risk: 'Aggressive',
          successRange: [baseSuccess - 0.15, baseSuccess + 0.1],
          failureRange: [0.2, 0.45],
          summary: 'Big swing upgrade with higher upside but a real chance of regression.',
        },
      ];
      playerPrompt = { season, raceIndex: completedRaces, options };
      return;
    }

    const risk = pickAiRisk(teamPersonnel);
    const facilityScore = computeFacilityScore(teamPersonnel);
    const staffScore = computeStaffScore(teamPersonnel);
    const investmentScore = (teamFinance?.personnelInvestment || 0) / 150_000_000;
    const { riskPenalty, magnitude } = riskProfiles[risk];

    const successChance = Math.max(
      0.3,
      Math.min(0.9, 0.6 + facilityScore * 0.18 + staffScore * 0.15 + investmentScore - riskPenalty)
    );
    const success = Math.random() < successChance;
    const magnitudeRoll = magnitude[0] + Math.random() * (magnitude[1] - magnitude[0]);
    const deltas = applyDeltaToCar(car, focus, magnitudeRoll, success);
    adjustments.push(describeAdjustment(car.teamName, focus, risk, success, deltas, completedRaces));
  });

  return { newCarRatings, adjustments, playerPrompt };
};

export const applyPlayerDevelopmentChoice = (
  carRatings: { [key: string]: Car },
  personnel: TeamPersonnel[],
  finances: TeamFinances[],
  playerTeam: string,
  choiceId: string,
  prompt: MidSeasonDevelopmentPrompt,
): { updatedCars: { [key: string]: Car }; adjustment: MidSeasonAdjustment | null } => {
  const playerCarKey = Object.keys(carRatings).find(key => carRatings[key].teamName === playerTeam);
  if (!playerCarKey) return { updatedCars: carRatings, adjustment: null };
  const car = JSON.parse(JSON.stringify(carRatings[playerCarKey])) as Car;
  const teamPersonnel = personnel.find(p => p.teamName === playerTeam);
  const teamFinance = finances.find(f => f.teamName === playerTeam);
  const option = prompt.options.find(o => o.id === choiceId) || prompt.options[0];
  const { riskPenalty, magnitude } = riskProfiles[option.risk];
  const facilityScore = computeFacilityScore(teamPersonnel);
  const staffScore = computeStaffScore(teamPersonnel);
  const investmentScore = (teamFinance?.personnelInvestment || 0) / 150_000_000;
  const base = 0.6 + facilityScore * 0.2 + staffScore * 0.15 + investmentScore - riskPenalty;
  const successChance = Math.max(0.3, Math.min(0.92, base));
  const success = Math.random() < successChance;
  const roll = magnitude[0] + Math.random() * (magnitude[1] - magnitude[0]);
  const deltas = applyDeltaToCar(car, option.focus, roll, success);
  const updatedCars = { ...carRatings, [playerCarKey]: car };
  return { updatedCars, adjustment: describeAdjustment(playerTeam, option.focus, option.risk, success, deltas, prompt.raceIndex) };
};

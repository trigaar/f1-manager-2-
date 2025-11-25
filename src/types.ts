
export enum TyreCompound {
  Soft = 'Soft',
  Medium = 'Medium',
  Hard = 'Hard',
  Intermediate = 'Intermediate',
  Wet = 'Wet',
}

export type TyreCondition = 'Optimal' | 'Graining' | 'Blistering' | 'Cold' | 'Hot';

export interface Tyre {
  compound: TyreCompound;
  wear: number; // 0-100%
  age: number; // in laps
  temperature: number; // Current temperature in Celsius
  condition: TyreCondition; // Visual/performance status
}

export enum DriverTraitRarity {
    Common = "Common",
    Rare = "Rare",
    Legendary = "Legendary",
}

export interface DriverTrait {
    id: string;
    name: string;
    description: string;
    rarity: DriverTraitRarity;
}

export interface DriverSkills {
  overall: number; // 1-100
  qualifyingPace: number; // 1-100
  raceCraft: number; // 1-100
  tyreManagement: number; // 1-100
  consistency: number; // 1-100
  wetWeatherSkill: number; // 1-100
  aggressionIndex: number; // 1-100
  incidentProneness: number; // 1-100
  loyalty: number; // 1-100
  potential: number; // 1-100
  reputation: number; // 1-100
  trait?: DriverTrait;
}

export interface Car {
  teamName: string;
  overallPace: number; // 1-100
  highSpeedCornering: number; // 1-100
  mediumSpeedCornering: number; // 1-100
  lowSpeedCornering: number; // 1-100
  powerSensitivity: number; // 1-100
  reliability: number; // 1-100
  tyreWearFactor: number; // 1-100, Higher is better
  isLST: boolean;
}

export interface PitStop {
  lap: number;
  tyre: TyreCompound;
}

export interface Strategy {
  startingTyre: TyreCompound;
  pitStops: PitStop[];
}

export type DriverStatus = 'Racing' | 'In Pits' | 'Crashed' | 'DNF' | 'Mechanical Issue' | 'Damaged' | 'Limping';

export interface Penalty {
  type: 'Time';
  duration: 5 | 10;
  served: boolean;
  reason: string;
}

export type PaceMode = 'Pushing' | 'Standard' | 'Conserving';

export interface Driver {
  id: number;
  name: string;
  shortName: string;
  number: number;
  teamColor: string;
  teamHexColor: string;
  driverSkills: DriverSkills;
  car: Car;
  rookie: boolean;
  age: number;
  contractExpiresIn: number;
  careerWins: number;
  careerPodiums: number;
  championships: number;
  status: 'Active' | 'Free Agent' | 'Retired';
  peakDsv: number;
  salary: number;
  position: number;
  startingPosition: number;
  currentTyres: Tyre;
  fuelLoad: number;
  raceStatus: DriverStatus;
  lapTime: number;
  totalRaceTime: number;
  gapToLeader: number;
  strategy: Strategy;
  pitStops: number;
  compoundsUsed: TyreCompound[];
  hasUsedWetTyre: boolean;
  battle: { withDriverName: string; forLaps: number } | null;
  pittedUnderSCThisPeriod?: boolean;
  isDamaged?: boolean;
  penalties: Penalty[];
  trackLimitWarnings: number;
  retirementLap?: number;
  retirementReason?: 'Mechanical' | 'Crash' | 'Damage';
  pittingForTyre?: TyreCompound;
  pittedThisLap?: boolean;
  raceRating?: number;
  ersCharge: number;
  paceMode: PaceMode;
  gripAdvantage: { forLaps: number; bonus: number; } | null;
  careerHistory: { [season: number]: string };
  form: number;
}

// FIX: Added missing event types
export type LapEventType = 
  | 'OVERTAKE' | 'PIT_ENTRY' | 'PIT_EXIT' | 'CRASH' | 'DNF' | 'SPIN' 
  | 'WEATHER_CHANGE' | 'RED_FLAG' | 'YELLOW_FLAG' | 'VSC' | 'DRIVER_MISTAKE' | 'BRILLIANT_LAP'
  | 'SLOW_PIT_STOP' | 'MECHANICAL_ISSUE' | 'FASTEST_LAP' | 'BATTLE' | 'SAFETY_CAR' | 'DAMAGE'
  | 'LAP_EVENT' | 'REPAIR_SUCCESS' | 'REPAIR_FAILURE' | 'MULTI_CRASH' | 'LOCK_UP' | 'WIDE_MOMENT' | 'TEAM_RADIO'
  | 'TIME_PENALTY' | 'TRACK_LIMIT_WARNING' | 'EMERGENCY_WEATHER' | 'BRILLIANT_STRATEGY' | 'QUALIFYING_HEROICS'
  | 'FAST_PIT_STOP' | 'DISASTROUS_PIT_STOP' | 'STRATEGY_ERROR';

export interface LapEvent {
    type: LapEventType;
    driverName: string;
    data?: any;
}

export type InitialDriver = Omit<Driver, 
  'position' | 'currentTyres' | 'fuelLoad' | 'raceStatus' | 'lapTime' | 
  'totalRaceTime' | 'gapToLeader' | 'strategy' | 'pitStops' | 'battle' | 
  'teamColor' | 'teamHexColor' | 'pittedUnderSCThisPeriod' | 'isDamaged' |
  'compoundsUsed' | 'hasUsedWetTyre' | 'penalties' | 'trackLimitWarnings' | 'retirementLap' |
  'pittingForTyre' | 'pittedThisLap' | 'startingPosition' | 'raceRating' | 'ersCharge' | 'paceMode' |
  'gripAdvantage' | 'retirementReason' | 'form'
> & {
    yearsAsFreeAgent?: number;
    form: number;
    seasonRaceRatings?: number[];
    happiness: number;
    morale: number;
    negotiationStatus?: 'Pending' | 'Signed' | 'Declined';
};

export interface ShortlistDriver extends InitialDriver {
    interestReason: string;
    signingChance: number; // 0-100
}


export interface DriverStanding {
  driverId: number;
  name: string;
  teamName: string;
  teamHexColor: string;
  points: number;
  position: number;
}

export interface ConstructorStanding {
  teamName: string;
  teamHexColor: string;
  points: number;
  position: number;
}

export interface QualifyingResult {
  driverId: number;
  driverName: string;
  q1Time: number;
  q2Time: number | null;
  q3Time: number | null;
  finalPosition: number;
  eliminatedIn: 'Q1' | 'Q2' | null;
}

export interface SeasonHistoryEntry {
    year: number;
    driverStandings: DriverStanding[];
    constructorStandings: ConstructorStanding[];
    carRatings: Car[];
    aiSeasonReview?: AiSeasonReview;
}

export interface RaceHistoryEntry {
  winnerId: number;
  year: number;
}

export type RaceHistory = {
  [trackName: string]: RaceHistoryEntry[];
};

export interface TeamFinances {
  teamName: string;
  teamHexColor: string;
  prizeMoney: {
    total: number;
    lstBonus: number;
    ccbBonus: number;
    performancePayout: number;
  };
  sponsorshipIncome: number;
  driverSalaries: number;
  finalBudget: number;
  carDevelopmentBudget: number;
  personnelInvestment: number;
  driverAcquisitionFund: number;
}

export type TeamPrincipalPersonality = 'Visionary' | 'Pragmatist' | 'Loyalist' | 'Ruthless Operator';

export interface TeamPrincipal {
    name: string;
    negotiation: number;
    financialAcumen: number;
    leadership: number;
    personality: TeamPrincipalPersonality;
    trait: string;
}

export interface HeadOfTechnical {
    name: string;
    rdConversion: number;
    innovation: number;
    trait: string;
}

export interface AffiliateDriver {
    name: string;
    skill: number;
    potential: number;
    age: number;
}

export interface TeamPersonnel {
    teamName: string;
    hqLocation: string;
    teamPrincipal: TeamPrincipal | null;
    headOfTechnical: HeadOfTechnical | null;
    affiliateDriver: AffiliateDriver | null;
    facilities: {
        aero: number;
        chassis: number;
        powertrain: number;
    }
}

export type PersonnelChangeEvent = {
    type: 'POACH' | 'HIRE' | 'RETAINED' | 'TRAINING' | 'FIRE';
    team: string;
    role: 'Team Principal' | 'Head of Technical';
    oldPerson?: string;
    newPerson: string;
    poachedFrom?: string;
    skill?: keyof TeamPrincipal | keyof HeadOfTechnical;
    change?: number;
};

export type AffiliateChangeEvent = {
    type: 'SIGN' | 'DROP' | 'PROGRESS';
    teamName: string;
    driverName: string;
    skillChange?: number;
    newSkill?: number;
};

export type RookiePotential = 'A' | 'B' | 'C' | 'D';
export type SponsorshipLevel = 'None' | 'Small' | 'Medium';

export interface RookieDriver {
    name: string;
    rawPace: number;
    consistency: number;
    potential: RookiePotential;
    affiliation: string | 'None';
    sponsorship: SponsorshipLevel;
}

export type DriverMarketEvent = {
    type: 'TRANSFER' | 'ROOKIE' | 'RETAINED' | 'DROPPED' | 'RETIRED' | 'SIGNED' | 'LAST_MINUTE_DEAL' | 'POACH';
    driverName: string;
    fromTeam?: string;
    toTeam?: string;
};

export type CarAttribute = 'highSpeedCornering' | 'mediumSpeedCornering' | 'lowSpeedCornering' | 'powerSensitivity' | 'reliability' | 'tyreWearFactor' | 'overallPace';

export interface CarDevelopmentResult {
    teamName: string;
    teamHexColor: string;
    devFund: number;
    devPoints: number;
    events: string[];
    upgrades: {
        attribute: CarAttribute;
        oldValue: number;
        newValue: number;
    }[];
    newOverallPace: number;
}

export interface PlayerCarDev {
    finalCar: Car;
    devResult: CarDevelopmentResult;
}

export interface RegulationEvent {
    teamName: string;
    teamHexColor: string;
    adaptationScore: number;
    summary: string;
    newBaseCar: Car;
}

export interface DriverSkillChange {
    skill: keyof DriverSkills;
    oldValue: number;
    newValue: number;
}

export interface DriverProgressionEvent {
    driverId: number;
    driverName: string;
    teamName: string;
    age: number;
    averageRating: number;
    changes: DriverSkillChange[];
    newOverall: number;
}

export interface ResourceAllocationEvent {
    teamName: string;
    teamHexColor: string;
    totalBudget: number;
    allocations: {
        carDevelopment: number;
        driverFund: number;
        personnel: number;
    }
}

export type PracticeGrade = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

export interface PracticeResult {
  driverId: number;
  driverName: string;
  grade: PracticeGrade;
  summary: string;
  qualifyingTimeModifier: number;
}

export interface AiCommentary {
  persona: string;
  team: string;
  handle: string;
  text: string;
}

export interface AiRaceSummary {
  headline: string;
  driverOfTheDay: {
    name: string;
    reason: string;
  };
  moveOfTheDay: {
    driver: string;
    description: string;
  };
  raceSummary: string;
  commentary: AiCommentary[];
}

export interface PrincipalQuote {
    principalName: string;
    teamName: string;
    quote: string;
}

export interface AiSeasonReview {
    headline: string;
    summary: string;
    principalQuotes: PrincipalQuote[];
}

export interface UpcomingRaceQuote {
  driverName: string;
  quote: string;
}

export interface DriverDebrief extends DriverStanding {
    dsv: number;
    breakdown: {
        posScore: number;
        teammateScore: number;
        potentialScore: number;
    };
}

export interface TeamDebrief extends ConstructorStanding {
    tpr: number;
    breakdown: {
        posScore: number;
        expectationScore: number;
        historyScore: number;
        legacyScore: number;
    };
    drivers?: DriverDebrief[];
}

export type TrackCharacteristic = 
  | 'High-Speed Aero'
  | 'Max Downforce / Low-Speed'
  | 'Max Downforce / Med-Speed'
  | 'Power Sensitive'
  | 'Power & Traction'
  | 'High-Speed Flow';

export type SecondaryTrackCharacteristic =
  | 'Braking Stability'
  | 'Front-Limited'
  | 'Rear-Limited'
  | 'High-Speed Flow'
  | 'Low-Speed Technical'
  | 'Mechanical Grip'
  | 'Kerb Riding'
  | 'Traction'
  | 'High-Speed Aero'
  | 'Power & Traction'
  | null;

export type TechnicalDirective = 'WingFlexV1' | 'WingFlexV2';

export interface Track {
  name: string;
  description: string;
  laps: number;
  baseLapTime: number;
  downforceLevel: number;
  tyreStress: number;
  brakeWear: number;
  powerSensitivity: number;
  overtakingDifficulty: number;
  drsEffectiveness: number;
  safetyCarProbability: number;
  virtualSafetyCarProbability: number;
  pitLaneTimeLoss: number;
  primaryCharacteristic: TrackCharacteristic;
  secondaryCharacteristic: SecondaryTrackCharacteristic;
  riskTier: 1 | 2 | 3;
  wetSessionProbability: number;
  technicalDirective?: TechnicalDirective;
  pastWinners: string[];
}

export enum GamePhase {
  TEAM_SELECTION = 'TEAM_SELECTION',
  SETUP = 'SETUP',
  PRACTICE = 'PRACTICE',
  QUALIFYING = 'QUALIFYING',
  RACING = 'RACING',
  AI_SUMMARY = 'AI_SUMMARY',
  FINISHED = 'FINISHED',
  POST_SEASON_REVIEW = 'POST_SEASON_REVIEW',
  POST_SEASON = 'POST_SEASON',
}

export type OffSeasonPhase = 'DEBRIEF' | 'DRIVER_PROGRESSION' | 'FINANCIALS' | 'RESOURCE_ALLOCATION' | 'STAFFING' | 'DRIVER_MARKET' | 'DRIVER_MARKET_SUMMARY' | 'REGULATION_CHANGE' | 'CAR_DEVELOPMENT';

export enum RaceFlag {
  Green = 'Green',
  Yellow = 'Yellow',
  SafetyCar = 'SafetyCar',
  VirtualSafetyCar = 'VirtualSafetyCar',
  Red = 'Red',
}

export interface RaceState {
  lap: number;
  totalLaps: number;
  track: Track;
  weather: 'Sunny' | 'Cloudy' | 'Light Rain' | 'Heavy Rain' | 'Extreme Rain';
  flag: RaceFlag;
  flagLaps: number;
  isRestarting?: boolean;
  trackCondition: {
    waterLevel: number;
    gripLevel: number;
  };
  masterWeatherForecast: RaceState['weather'][];
  teamWeatherForecasts: { [teamName: string]: RaceState['weather'][] };
  airTemp: number;
  trackTemp: number;
}

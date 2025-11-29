import {
  AffiliateChangeEvent,
  AffiliateDriver,
  AiRaceSummary,
  AiSeasonReview,
  Car,
  CarDevelopmentResult,
  ConstructorStanding,
  Driver,
  DriverDebrief,
  DriverMarketEvent,
  DriverProgressionEvent,
  DriverStanding,
  GamePhase,
  HeadquartersEvent,
  HeadquartersEventResolution,
  InitialDriver,
  LapEvent,
  OffSeasonPhase,
  PersonnelChangeEvent,
  PracticeResult,
  QualifyingResult,
  RaceHistory,
  RaceState,
  RegulationEvent,
  ResourceAllocationEvent,
  RookieDriver,
  SeasonHistoryEntry,
  ShortlistDriver,
  TeamDebrief,
  TeamFinances,
  TeamPersonnel,
  Track,
  WeekendModifier,
} from '../types';

export interface GameSaveState {
  version: number;
  gamePhase: GamePhase;
  offSeasonPhase: OffSeasonPhase;
  season: number;
  currentRaceIndex: number;
  playerTeam: string | null;
  seasonLength: 'full' | 'short';
  seasonTracks: Track[];
  raceState: RaceState;
  drivers: Driver[];
  roster: InitialDriver[];
  personnel: TeamPersonnel[];
  carRatings: { [key: string]: Car };
  rookiePool: RookieDriver[];
  affiliateCandidates: AffiliateDriver[];
  practiceResults: PracticeResult[];
  qualifyingResults: QualifyingResult[];
  qualifyingStage: 'Q1' | 'Q2' | 'Q3' | 'FINISHED';
  q2Drivers: InitialDriver[];
  q3Drivers: InitialDriver[];
  log: string[];
  fastestLap: { driverName: string; time: number } | null;
  simSpeed: number;
  commentaryHighlight: string | null;
  raceLapEvents: LapEvent[];
  aiSummary: AiRaceSummary | null;
  isGeneratingSummary: boolean;
  aiSeasonReview: AiSeasonReview | null;
  isGeneratingSeasonReview: boolean;
  upcomingRaceQuote: { teamName: string; quote: string } | null;
  teamFinances: TeamFinances[];
  teamDebriefs: TeamDebrief[];
  driverDebriefs: DriverDebrief[];
  playerShortlist: ShortlistDriver[];
  driverProgressionLog: DriverProgressionEvent[];
  resourceAllocationLog: ResourceAllocationEvent[];
  mvi: number;
  staffingLog: PersonnelChangeEvent[];
  affiliateLog: AffiliateChangeEvent[];
  driverMarketLog: DriverMarketEvent[];
  regulationChangeLog: RegulationEvent[];
  devResults: CarDevelopmentResult[];
  selectedTeam: string | null;
  showHistoryScreen: boolean;
  showGarageScreen: boolean;
  showHqScreen: boolean;
  showHowToPlay: boolean;
  hqEvent: HeadquartersEvent | null;
  hqEventRaceKey: string | null;
  pendingHqImpact: HeadquartersEventResolution | null;
  activeHqModifiers: HeadquartersEventResolution | null;
  weekendModifiers: WeekendModifier[];
  standings: DriverStanding[];
  constructorStandings: ConstructorStanding[];
  raceHistory: RaceHistory;
  seasonHistory: SeasonHistoryEntry[];
}

export interface SaveStateSetters {
  setGamePhase: (phase: GamePhase) => void;
  setOffSeasonPhase: (phase: OffSeasonPhase) => void;
  setSeason: (value: number) => void;
  setCurrentRaceIndex: (value: number) => void;
  setPlayerTeam: (team: string | null) => void;
  setSeasonLength: (value: 'full' | 'short') => void;
  setSeasonTracks: (tracks: Track[]) => void;
  setRaceState: (state: RaceState) => void;
  setDrivers: (drivers: Driver[]) => void;
  setRoster: (roster: InitialDriver[]) => void;
  setPersonnel: (personnel: TeamPersonnel[]) => void;
  setCarRatings: (cars: { [key: string]: Car }) => void;
  setRookiePool: (rookies: RookieDriver[]) => void;
  setAffiliateCandidates: (affiliates: AffiliateDriver[]) => void;
  setPracticeResults: (results: PracticeResult[]) => void;
  setQualifyingResults: (results: QualifyingResult[]) => void;
  setQualifyingStage: (stage: 'Q1' | 'Q2' | 'Q3' | 'FINISHED') => void;
  setQ2Drivers: (drivers: InitialDriver[]) => void;
  setQ3Drivers: (drivers: InitialDriver[]) => void;
  setLog: (log: string[]) => void;
  setFastestLap: (lap: { driverName: string; time: number } | null) => void;
  setSimSpeed: (speed: number) => void;
  setCommentaryHighlight: (highlight: string | null) => void;
  setRaceLapEvents: (events: LapEvent[]) => void;
  setAiSummary: (summary: AiRaceSummary | null) => void;
  setIsGeneratingSummary: (value: boolean) => void;
  setAiSeasonReview: (review: AiSeasonReview | null) => void;
  setIsGeneratingSeasonReview: (value: boolean) => void;
  setUpcomingRaceQuote: (quote: { teamName: string; quote: string } | null) => void;
  setTeamFinances: (finances: TeamFinances[]) => void;
  setTeamDebriefs: (debriefs: TeamDebrief[]) => void;
  setDriverDebriefs: (debriefs: DriverDebrief[]) => void;
  setPlayerShortlist: (shortlist: ShortlistDriver[]) => void;
  setDriverProgressionLog: (log: DriverProgressionEvent[]) => void;
  setResourceAllocationLog: (log: ResourceAllocationEvent[]) => void;
  setMvi: (value: number) => void;
  setStaffingLog: (log: PersonnelChangeEvent[]) => void;
  setAffiliateLog: (log: AffiliateChangeEvent[]) => void;
  setDriverMarketLog: (log: DriverMarketEvent[]) => void;
  setRegulationChangeLog: (log: RegulationEvent[]) => void;
  setDevResults: (results: CarDevelopmentResult[]) => void;
  setSelectedTeam: (team: string | null) => void;
  setShowHistoryScreen: (value: boolean) => void;
  setShowGarageScreen: (value: boolean) => void;
  setShowHqScreen: (value: boolean) => void;
  setShowHowToPlay: (value: boolean) => void;
  setHqEvent: (event: HeadquartersEvent | null) => void;
  setHqEventRaceKey: (key: string | null) => void;
  setPendingHqImpact: (impact: HeadquartersEventResolution | null) => void;
  setActiveHqModifiers: (impact: HeadquartersEventResolution | null) => void;
  setWeekendModifiers: (mods: WeekendModifier[]) => void;
  hydrateStandings: (standings: DriverStanding[]) => void;
  hydrateConstructorStandings: (standings: ConstructorStanding[]) => void;
  hydrateRaceHistory: (history: RaceHistory) => void;
  hydrateSeasonHistory: (history: SeasonHistoryEntry[]) => void;
}

/**
 * Returns a serializable snapshot of the game state needed to resume play.
 */
export const getCurrentGameState = (state: GameSaveState): GameSaveState => ({
  ...state,
  version: state.version ?? 1,
});

const decodeBase64 = (value: string) => {
  try {
    return decodeURIComponent(escape(window.atob(value)));
  } catch (error) {
    return window.atob(value);
  }
};

const encodeBase64 = (value: string) => {
  try {
    return window.btoa(unescape(encodeURIComponent(value)));
  } catch (error) {
    return window.btoa(value);
  }
};

const isValidGameState = (state: any): state is GameSaveState => {
  if (!state || typeof state !== 'object') return false;
  const requiredKeys: Array<keyof GameSaveState> = [
    'season',
    'currentRaceIndex',
    'gamePhase',
    'offSeasonPhase',
    'raceState',
    'drivers',
    'roster',
    'personnel',
    'carRatings',
    'seasonTracks',
    'seasonLength',
  ];

  return requiredKeys.every(key => key in state);
};

/**
 * Applies a loaded game state into all relevant React state setters with minimal validation.
 */
export const applyLoadedGameState = (state: GameSaveState, setters: SaveStateSetters): { success: boolean; message: string } => {
  if (!isValidGameState(state)) {
    return { success: false, message: 'Invalid save format. Required fields are missing.' };
  }

  try {
    setters.setGamePhase(state.gamePhase);
    setters.setOffSeasonPhase(state.offSeasonPhase);
    setters.setSeason(state.season);
    setters.setCurrentRaceIndex(state.currentRaceIndex);
    setters.setPlayerTeam(state.playerTeam ?? null);
    setters.setSeasonLength(state.seasonLength);
    setters.setSeasonTracks(state.seasonTracks);
    setters.setRaceState(state.raceState);
    setters.setDrivers(state.drivers);
    setters.setRoster(state.roster);
    setters.setPersonnel(state.personnel);
    setters.setCarRatings(state.carRatings);
    setters.setRookiePool(state.rookiePool);
    setters.setAffiliateCandidates(state.affiliateCandidates);
    setters.setPracticeResults(state.practiceResults);
    setters.setQualifyingResults(state.qualifyingResults);
    setters.setQualifyingStage(state.qualifyingStage);
    setters.setQ2Drivers(state.q2Drivers);
    setters.setQ3Drivers(state.q3Drivers);
    setters.setLog(state.log);
    setters.setFastestLap(state.fastestLap);
    setters.setSimSpeed(state.simSpeed);
    setters.setCommentaryHighlight(state.commentaryHighlight);
    setters.setRaceLapEvents(state.raceLapEvents);
    setters.setAiSummary(state.aiSummary);
    setters.setIsGeneratingSummary(state.isGeneratingSummary);
    setters.setAiSeasonReview(state.aiSeasonReview);
    setters.setIsGeneratingSeasonReview(state.isGeneratingSeasonReview);
    setters.setUpcomingRaceQuote(state.upcomingRaceQuote);
    setters.setTeamFinances(state.teamFinances);
    setters.setTeamDebriefs(state.teamDebriefs);
    setters.setDriverDebriefs(state.driverDebriefs);
    setters.setPlayerShortlist(state.playerShortlist);
    setters.setDriverProgressionLog(state.driverProgressionLog);
    setters.setResourceAllocationLog(state.resourceAllocationLog);
    setters.setMvi(state.mvi);
    setters.setStaffingLog(state.staffingLog);
    setters.setAffiliateLog(state.affiliateLog);
    setters.setDriverMarketLog(state.driverMarketLog);
    setters.setRegulationChangeLog(state.regulationChangeLog);
    setters.setDevResults(state.devResults);
    setters.setSelectedTeam(state.selectedTeam);
    setters.setShowHistoryScreen(state.showHistoryScreen);
    setters.setShowGarageScreen(state.showGarageScreen);
    setters.setShowHqScreen(state.showHqScreen);
    setters.setShowHowToPlay(state.showHowToPlay);
    setters.setHqEvent(state.hqEvent);
    setters.setHqEventRaceKey(state.hqEventRaceKey);
    setters.setPendingHqImpact(state.pendingHqImpact);
    setters.setActiveHqModifiers(state.activeHqModifiers);
    setters.setWeekendModifiers(state.weekendModifiers);

    setters.hydrateStandings(state.standings);
    setters.hydrateConstructorStandings(state.constructorStandings);
    setters.hydrateRaceHistory(state.raceHistory);
    setters.hydrateSeasonHistory(state.seasonHistory);

    return { success: true, message: 'Save loaded successfully.' };
  } catch (error) {
    console.error('Failed to apply loaded game state', error);
    return { success: false, message: 'Failed to apply save data.' };
  }
};

/**
 * Generates a Base64-encoded save string representing the current game state.
 */
export const generateSaveCode = (state: GameSaveState): string => {
  const snapshot = getCurrentGameState(state);
  const json = JSON.stringify(snapshot);
  return encodeBase64(json);
};

/**
 * Loads game state from a Base64-encoded string and applies it via provided setters.
 */
export const loadFromSaveCode = (code: string, setters: SaveStateSetters): { success: boolean; message: string } => {
  if (!code || !code.trim()) {
    return { success: false, message: 'Please paste a valid save code.' };
  }

  try {
    const decoded = decodeBase64(code.trim());
    const parsed = JSON.parse(decoded) as GameSaveState;
    if (!isValidGameState(parsed)) {
      return { success: false, message: 'Save code missing required fields.' };
    }

    return applyLoadedGameState(parsed, setters);
  } catch (error) {
    console.error('Failed to load save code', error);
    return { success: false, message: 'Unable to read save code. It may be corrupted or from an older version.' };
  }
};

// Example usage elsewhere in the app:
// const saveCode = generateSaveCode(getCurrentGameState(stateSnapshot));
// const result = loadFromSaveCode(pastedCode, saveSystemSetters);

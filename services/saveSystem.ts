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

interface CookieSavePayload {
  code: string;
  version: number;
  savedAt: string;
}

const DEFAULT_SAVE_COOKIE_NAME = 'f1ManagerSave';
const DEFAULT_SAVE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

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

// Lightweight LZ-based compression adapted from the MIT-licensed lz-string project
// Source: https://github.com/pieroxy/lz-string
const keyStrUriSafe = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-$';

const getBaseValue = (alphabet: string, character: string) => {
  const index = alphabet.indexOf(character);
  if (index === -1) throw new Error('Invalid character in compressed string');
  return index;
};

const compressToEncodedURIComponent = (input: string): string => {
  if (input == null) return '';
  return _compress(input, 6, (a: number) => keyStrUriSafe.charAt(a));
};

const decompressFromEncodedURIComponent = (input: string): string | null => {
  if (input == null) return '';
  try {
    input = input.replace(/ /g, '+');
    return _decompress(input.length, 32, index => getBaseValue(keyStrUriSafe, input.charAt(index)));
  } catch (error) {
    console.error('Failed to decompress save code', error);
    return null;
  }
};

const setCookie = (name: string, value: string, maxAgeSeconds = DEFAULT_SAVE_COOKIE_MAX_AGE_SECONDS) => {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=${encodeURIComponent(value)}; max-age=${maxAgeSeconds}; path=/; SameSite=Lax`;
};

const readCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;
  const cookieString = document.cookie;
  if (!cookieString) return null;
  const cookies = cookieString.split(';').map(c => c.trim());
  for (const cookie of cookies) {
    if (cookie.startsWith(`${name}=`)) {
      return decodeURIComponent(cookie.substring(name.length + 1));
    }
  }
  return null;
};

export const getCookieSaveMetadata = (
  cookieName: string = DEFAULT_SAVE_COOKIE_NAME,
): { hasSave: boolean; savedAt?: string; message: string } => {
  try {
    const cookieValue = readCookie(cookieName);
    if (!cookieValue) {
      return { hasSave: false, message: 'No auto-save cookie found.' };
    }

    const parsed = JSON.parse(cookieValue) as Partial<CookieSavePayload>;
    if (!parsed.code) {
      return { hasSave: false, message: 'Auto-save cookie is missing save data.' };
    }

    return {
      hasSave: true,
      savedAt: parsed.savedAt,
      message: parsed.savedAt
        ? `Auto-save available from ${new Date(parsed.savedAt).toLocaleString()}.`
        : 'Auto-save available.',
    };
  } catch (error) {
    console.error('Failed to read auto-save metadata', error);
    return { hasSave: false, message: 'Auto-save cookie could not be read.' };
  }
};

const _compress = (uncompressed: string, bitsPerChar: number, getCharFromInt: (value: number) => string): string => {
  if (uncompressed == null) return '';

  let i: number;
  let value: number;
  const contextDictionary: Record<string, number> = {};
  const contextDictionaryToCreate: Record<string, boolean> = {};
  let contextC = '';
  let contextW = '';
  const contextData: number[] = [];
  let contextEnlargeIn = 2;
  let contextDictSize = 3;
  let contextNumBits = 2;
  let contextDataVal = 0;
  let contextDataPosition = 0;

  for (let ii = 0; ii < uncompressed.length; ii += 1) {
    contextC = uncompressed.charAt(ii);

    if (!Object.prototype.hasOwnProperty.call(contextDictionary, contextC)) {
      contextDictionary[contextC] = contextDictSize++;
      contextDictionaryToCreate[contextC] = true;
    }

    const contextWC = contextW + contextC;
    if (Object.prototype.hasOwnProperty.call(contextDictionary, contextWC)) {
      contextW = contextWC;
    } else {
      if (Object.prototype.hasOwnProperty.call(contextDictionaryToCreate, contextW)) {
        if (contextW.charCodeAt(0) < 256) {
          for (i = 0; i < contextNumBits; i++) {
            contextDataVal = (contextDataVal << 1);
            if (contextDataPosition == bitsPerChar - 1) {
              contextDataPosition = 0;
              contextData.push(getCharFromInt(contextDataVal));
              contextDataVal = 0;
            } else {
              contextDataPosition++;
            }
          }
          value = contextW.charCodeAt(0);
          for (i = 0; i < 8; i++) {
            contextDataVal = (contextDataVal << 1) | (value & 1);
            if (contextDataPosition == bitsPerChar - 1) {
              contextDataPosition = 0;
              contextData.push(getCharFromInt(contextDataVal));
              contextDataVal = 0;
            } else {
              contextDataPosition++;
            }
            value >>= 1;
          }
        } else {
          value = 1;
          for (i = 0; i < contextNumBits; i++) {
            contextDataVal = (contextDataVal << 1) | value;
            if (contextDataPosition == bitsPerChar - 1) {
              contextDataPosition = 0;
              contextData.push(getCharFromInt(contextDataVal));
              contextDataVal = 0;
            } else {
              contextDataPosition++;
            }
            value = 0;
          }
          value = contextW.charCodeAt(0);
          for (i = 0; i < 16; i++) {
            contextDataVal = (contextDataVal << 1) | (value & 1);
            if (contextDataPosition == bitsPerChar - 1) {
              contextDataPosition = 0;
              contextData.push(getCharFromInt(contextDataVal));
              contextDataVal = 0;
            } else {
              contextDataPosition++;
            }
            value >>= 1;
          }
        }
        contextEnlargeIn--;
        if (contextEnlargeIn == 0) {
          contextEnlargeIn = 1 << contextNumBits;
          contextNumBits++;
        }
        delete contextDictionaryToCreate[contextW];
      } else {
        value = contextDictionary[contextW];
        for (i = 0; i < contextNumBits; i++) {
          contextDataVal = (contextDataVal << 1) | (value & 1);
          if (contextDataPosition == bitsPerChar - 1) {
            contextDataPosition = 0;
            contextData.push(getCharFromInt(contextDataVal));
            contextDataVal = 0;
          } else {
            contextDataPosition++;
          }
          value >>= 1;
        }

      }
      contextEnlargeIn--;
      if (contextEnlargeIn == 0) {
        contextEnlargeIn = 1 << contextNumBits;
        contextNumBits++;
      }
      contextDictionary[contextWC] = contextDictSize++;
      contextW = String(contextC);
    }
  }

  if (contextW !== '') {
    if (Object.prototype.hasOwnProperty.call(contextDictionaryToCreate, contextW)) {
      if (contextW.charCodeAt(0) < 256) {
        for (i = 0; i < contextNumBits; i++) {
          contextDataVal = (contextDataVal << 1);
          if (contextDataPosition == bitsPerChar - 1) {
            contextDataPosition = 0;
            contextData.push(getCharFromInt(contextDataVal));
            contextDataVal = 0;
          } else {
            contextDataPosition++;
          }
        }
        value = contextW.charCodeAt(0);
        for (i = 0; i < 8; i++) {
          contextDataVal = (contextDataVal << 1) | (value & 1);
          if (contextDataPosition == bitsPerChar - 1) {
            contextDataPosition = 0;
            contextData.push(getCharFromInt(contextDataVal));
            contextDataVal = 0;
          } else {
            contextDataPosition++;
          }
          value >>= 1;
        }
      } else {
        value = 1;
        for (i = 0; i < contextNumBits; i++) {
          contextDataVal = (contextDataVal << 1) | value;
          if (contextDataPosition == bitsPerChar - 1) {
            contextDataPosition = 0;
            contextData.push(getCharFromInt(contextDataVal));
            contextDataVal = 0;
          } else {
            contextDataPosition++;
          }
          value = 0;
        }
        value = contextW.charCodeAt(0);
        for (i = 0; i < 16; i++) {
          contextDataVal = (contextDataVal << 1) | (value & 1);
          if (contextDataPosition == bitsPerChar - 1) {
            contextDataPosition = 0;
            contextData.push(getCharFromInt(contextDataVal));
            contextDataVal = 0;
          } else {
            contextDataPosition++;
          }
          value >>= 1;
        }
      }
      contextEnlargeIn--;
      if (contextEnlargeIn == 0) {
        contextEnlargeIn = 1 << contextNumBits;
        contextNumBits++;
      }
      delete contextDictionaryToCreate[contextW];
    } else {
      value = contextDictionary[contextW];
      for (i = 0; i < contextNumBits; i++) {
        contextDataVal = (contextDataVal << 1) | (value & 1);
        if (contextDataPosition == bitsPerChar - 1) {
          contextDataPosition = 0;
          contextData.push(getCharFromInt(contextDataVal));
          contextDataVal = 0;
        } else {
          contextDataPosition++;
        }
        value >>= 1;
      }
    }
    contextEnlargeIn--;
    if (contextEnlargeIn == 0) {
      contextEnlargeIn = 1 << contextNumBits;
      contextNumBits++;
    }
  }

  value = 2;
  for (i = 0; i < contextNumBits; i++) {
    contextDataVal = (contextDataVal << 1) | (value & 1);
    if (contextDataPosition == bitsPerChar - 1) {
      contextDataPosition = 0;
      contextData.push(getCharFromInt(contextDataVal));
      contextDataVal = 0;
    } else {
      contextDataPosition++;
    }
    value >>= 1;
  }

  while (true) {
    contextDataVal = (contextDataVal << 1);
    if (contextDataPosition == bitsPerChar - 1) {
      contextData.push(getCharFromInt(contextDataVal));
      break;
    }
    contextDataPosition++;
  }

  return contextData.join('');
};

const _decompress = (length: number, resetValue: number, getNextValue: (index: number) => number): string | null => {
  const dictionary: string[] = [];
  let next;
  let enlargeIn = 4;
  let dictSize = 4;
  let numBits = 3;
  let entry = '';
  const result: string[] = [];
  let i: number;
  let w: string;
  let bits: number;
  let resb: number;
  let maxpower: number;
  let power: number;

  const data = { val: getNextValue(0), position: resetValue, index: 1 };

  for (i = 0; i < 3; i += 1) {
    dictionary[i] = i.toString();
  }

  bits = 0;
  maxpower = 2 ** 2;
  power = 1;
  while (power !== maxpower) {
    resb = data.val & data.position;
    data.position >>= 1;
    if (data.position === 0) {
      data.position = resetValue;
      data.val = getNextValue(data.index++);
    }
    bits |= (resb > 0 ? 1 : 0) * power;
    power <<= 1;
  }

  switch (next = bits) {
    case 0:
      bits = 0;
      maxpower = 2 ** 8;
      power = 1;
      while (power !== maxpower) {
        resb = data.val & data.position;
        data.position >>= 1;
        if (data.position === 0) {
          data.position = resetValue;
          data.val = getNextValue(data.index++);
        }
        bits |= (resb > 0 ? 1 : 0) * power;
        power <<= 1;
      }
      dictionary[3] = String.fromCharCode(bits);
      next = 3;
      break;
    case 1:
      bits = 0;
      maxpower = 2 ** 16;
      power = 1;
      while (power !== maxpower) {
        resb = data.val & data.position;
        data.position >>= 1;
        if (data.position === 0) {
          data.position = resetValue;
          data.val = getNextValue(data.index++);
        }
        bits |= (resb > 0 ? 1 : 0) * power;
        power <<= 1;
      }
      dictionary[3] = String.fromCharCode(bits);
      next = 3;
      break;
    case 2:
      return '';
  }

  w = dictionary[next];
  result.push(w);

  while (true) {
    if (data.index > length) {
      return '';
    }

    bits = 0;
    maxpower = 2 ** numBits;
    power = 1;
    while (power !== maxpower) {
      resb = data.val & data.position;
      data.position >>= 1;
      if (data.position === 0) {
        data.position = resetValue;
        data.val = getNextValue(data.index++);
      }
      bits |= (resb > 0 ? 1 : 0) * power;
      power <<= 1;
    }

    switch (next = bits) {
      case 0:
        bits = 0;
        maxpower = 2 ** 8;
        power = 1;
        while (power !== maxpower) {
          resb = data.val & data.position;
          data.position >>= 1;
          if (data.position === 0) {
            data.position = resetValue;
            data.val = getNextValue(data.index++);
          }
          bits |= (resb > 0 ? 1 : 0) * power;
          power <<= 1;
        }

        dictionary[dictSize++] = String.fromCharCode(bits);
        next = dictSize - 1;
        enlargeIn--;
        break;
      case 1:
        bits = 0;
        maxpower = 2 ** 16;
        power = 1;
        while (power !== maxpower) {
          resb = data.val & data.position;
          data.position >>= 1;
          if (data.position === 0) {
            data.position = resetValue;
            data.val = getNextValue(data.index++);
          }
          bits |= (resb > 0 ? 1 : 0) * power;
          power <<= 1;
        }
        dictionary[dictSize++] = String.fromCharCode(bits);
        next = dictSize - 1;
        enlargeIn--;
        break;
      case 2:
        return result.join('');
    }

    if (enlargeIn === 0) {
      enlargeIn = 2 ** numBits;
      numBits++;
    }

    if (dictionary[next]) {
      entry = dictionary[next];
    } else {
      if (next === dictSize) {
        entry = w + w.charAt(0);
      } else {
        return null;
      }
    }
    result.push(entry);

    dictionary[dictSize++] = w + entry.charAt(0);
    enlargeIn--;
    w = entry;

    if (enlargeIn === 0) {
      enlargeIn = 2 ** numBits;
      numBits++;
    }
  }
};

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
  const compressed = compressToEncodedURIComponent(json);
  return compressed.length < json.length ? compressed : encodeBase64(json);
};

/**
 * Loads game state from a Base64-encoded string and applies it via provided setters.
 */
export const loadFromSaveCode = (code: string, setters: SaveStateSetters): { success: boolean; message: string } => {
  if (!code || !code.trim()) {
    return { success: false, message: 'Please paste a valid save code.' };
  }

  try {
    const trimmedCode = code.trim();
    const decompressed = decompressFromEncodedURIComponent(trimmedCode);
    const decoded = decompressed && decompressed.length > 0
      ? decompressed
      : decodeBase64(trimmedCode);
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

/**
 * Writes the provided game state into a browser cookie so players get automatic saves without copying codes.
 */
export const persistSaveToCookie = (
  state: GameSaveState,
  cookieName: string = DEFAULT_SAVE_COOKIE_NAME,
): { success: boolean; message: string } => {
  try {
    const code = generateSaveCode(state);
    const payload: CookieSavePayload = {
      code,
      version: state.version ?? 1,
      savedAt: new Date().toISOString(),
    };
    setCookie(cookieName, JSON.stringify(payload));
    return { success: true, message: 'Game auto-saved to browser cookie.' };
  } catch (error) {
    console.error('Failed to persist save to cookie', error);
    return { success: false, message: 'Unable to auto-save to cookie.' };
  }
};

/**
 * Loads a game state from a browser cookie and hydrates app state.
 */
export const loadSaveFromCookie = (
  setters: SaveStateSetters,
  cookieName: string = DEFAULT_SAVE_COOKIE_NAME,
): { success: boolean; message: string } => {
  try {
    const cookieValue = readCookie(cookieName);
    if (!cookieValue) {
      return { success: false, message: 'No auto-save cookie found.' };
    }

    const payload = JSON.parse(cookieValue) as CookieSavePayload;
    if (!payload.code) {
      return { success: false, message: 'Auto-save cookie is missing a save code.' };
    }

    const result = loadFromSaveCode(payload.code, setters);
    if (result.success) {
      return { success: true, message: `Auto-save from ${payload.savedAt ? new Date(payload.savedAt).toLocaleString() : 'cookie'} loaded.` };
    }

    return result;
  } catch (error) {
    console.error('Failed to load save from cookie', error);
    return { success: false, message: 'Unable to read auto-save cookie.' };
  }
};

// Example usage elsewhere in the app:
// const saveCode = generateSaveCode(getCurrentGameState(stateSnapshot));
// const result = loadFromSaveCode(pastedCode, saveSystemSetters);

import { Car, DriverDebrief, InitialDriver, RaceState, RookieDriver, Track, RaceFlag } from '../types';
import { FULL_SEASON_TRACKS, SHORT_SEASON_TRACKS } from '../constants';
import { generateNewRookies } from './rookieService';

export const calculateNextSeasonTracks = (seasonLength: 'full' | 'short'): Track[] => {
  const calendar = seasonLength === 'short' ? SHORT_SEASON_TRACKS : FULL_SEASON_TRACKS;
  // Return a shallow copy so downstream consumers can safely shuffle/annotate the list
  // without mutating the base constants, and fall back to the full calendar if an
  // unexpected empty list is provided (defensive against bad config or clearing state).
  const safeCalendar = calendar.length > 0 ? calendar : FULL_SEASON_TRACKS;
  return [...safeCalendar];
};

export const buildInitialRaceState = (tracks: Track[]): RaceState => {
  const firstTrack = tracks[0] ?? FULL_SEASON_TRACKS[0];
  return {
    lap: 0,
    totalLaps: firstTrack.laps,
    track: firstTrack,
    weather: 'Sunny',
    flag: RaceFlag.Green,
    flagLaps: 0,
    isRestarting: false,
    trackCondition: { waterLevel: 0, gripLevel: 100 },
    masterWeatherForecast: [],
    teamWeatherForecasts: {},
    airTemp: 25,
    trackTemp: 40,
  };
};

export const updateRosterForNewSeason = (
  roster: InitialDriver[],
  driverDebriefs: DriverDebrief[],
  carRatings: { [key: string]: Car },
  season: number
): InitialDriver[] => {
  return roster.map(driver => {
    const newHistory = { ...driver.careerHistory };
    newHistory[season + 1] = driver.status === 'Active' ? driver.car.teamName : 'Free Agent';

    const driverDebrief = driverDebriefs.find(d => d.driverId === driver.id);
    const newSalary =
      driver.contractExpiresIn <= 0 && driverDebrief
        ? Math.round(500000 + driver.driverSkills.reputation * 50000 + driverDebrief.dsv * 100000)
        : driver.salary;

    const updatedDriver = { ...driver, careerHistory: newHistory, seasonRaceRatings: [], salary: newSalary };

    const teamKey = Object.keys(carRatings).find(
      key => carRatings[key as keyof typeof carRatings].teamName === updatedDriver.car.teamName
    );

    return teamKey ? { ...updatedDriver, car: carRatings[teamKey] } : updatedDriver;
  });
};

export const createNewRookies = (
  retiredThisSeasonCount: number,
  rookiePool: RookieDriver[],
  roster: InitialDriver[]
): RookieDriver[] => {
  const numToGenerate = Math.max(2, retiredThisSeasonCount + Math.floor(Math.random() * 2));
  return generateNewRookies(numToGenerate, rookiePool, roster);
};

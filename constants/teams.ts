import { Car, TyreCompound } from '../types';

export const TYRE_LIFE = {
  [TyreCompound.Soft]: 18,
  [TyreCompound.Medium]: 35,
  [TyreCompound.Hard]: 50,
  [TyreCompound.Intermediate]: 30,
  [TyreCompound.Wet]: 40,
};

// --- NEW: Detailed Tyre Properties for Temperature Simulation ---
export interface TyreCompoundProperties {
    idealTempRange: [number, number]; // [min, max] in Celsius
    heatGenerationFactor: number; // Multiplier for how quickly it heats up
    heatDissipationFactor: number; // Multiplier for how quickly it cools down
}

export const TYRE_PROPERTIES: Record<TyreCompound, TyreCompoundProperties> = {
    [TyreCompound.Soft]: {
        idealTempRange: [90, 115],
        heatGenerationFactor: 1.2,
        heatDissipationFactor: 1.1,
    },
    [TyreCompound.Medium]: {
        idealTempRange: [100, 125],
        heatGenerationFactor: 1.0,
        heatDissipationFactor: 1.0,
    },
    [TyreCompound.Hard]: {
        idealTempRange: [110, 135],
        heatGenerationFactor: 0.8,
        heatDissipationFactor: 0.9,
    },
    [TyreCompound.Intermediate]: {
        idealTempRange: [40, 100],
        heatGenerationFactor: 0.9,
        heatDissipationFactor: 1.5,
    },
    [TyreCompound.Wet]: {
        idealTempRange: [50, 110],
        heatGenerationFactor: 1.0,
        heatDissipationFactor: 1.8,
    }
};

export const TIRE_BLANKET_TEMP = 80;


// Data sourced from "Master Constructor Performance Attributes" in the Qualifying Simulation Model report,
// merged with reliability/tyre wear data from the Mid-Season Analysis report.
// Team names updated to reflect the official 2025 grid.
export const CARS: { [key: string]: Car } = {
  McLaren: { teamName: 'McLaren Formula 1 Team', overallPace: 99, highSpeedCornering: 95, mediumSpeedCornering: 100, lowSpeedCornering: 94, powerSensitivity: 97, reliability: 98, tyreWearFactor: 99, isLST: false },
  RedBull: { teamName: 'Oracle Red Bull Racing', overallPace: 93, highSpeedCornering: 97, mediumSpeedCornering: 88, lowSpeedCornering: 85, powerSensitivity: 98, reliability: 92, tyreWearFactor: 82, isLST: false },
  Ferrari: { teamName: 'Scuderia Ferrari', overallPace: 91, highSpeedCornering: 90, mediumSpeedCornering: 89, lowSpeedCornering: 93, powerSensitivity: 96, reliability: 95, tyreWearFactor: 90, isLST: true },
  Mercedes: { teamName: 'Mercedes-AMG Petronas Formula One Team', overallPace: 90, highSpeedCornering: 92, mediumSpeedCornering: 88, lowSpeedCornering: 87, powerSensitivity: 97, reliability: 94, tyreWearFactor: 88, isLST: false },
  Williams: { teamName: 'Williams Racing', overallPace: 84, highSpeedCornering: 85, mediumSpeedCornering: 86, lowSpeedCornering: 85, powerSensitivity: 90, reliability: 85, tyreWearFactor: 86, isLST: false },
  AstonMartin: { teamName: 'Aston Martin Aramco Formula One Team', overallPace: 81, highSpeedCornering: 82, mediumSpeedCornering: 82, lowSpeedCornering: 84, powerSensitivity: 88, reliability: 88, tyreWearFactor: 84, isLST: false },
  Sauber: { teamName: 'Stake F1 Team Kick Sauber', overallPace: 82, highSpeedCornering: 81, mediumSpeedCornering: 81, lowSpeedCornering: 85, powerSensitivity: 88, reliability: 86, tyreWearFactor: 85, isLST: false },
  RB: { teamName: 'Visa Cash App RB Formula One Team', overallPace: 80, highSpeedCornering: 80, mediumSpeedCornering: 80, lowSpeedCornering: 83, powerSensitivity: 90, reliability: 87, tyreWearFactor: 83, isLST: false },
  Haas: { teamName: 'MoneyGram Haas F1 Team', overallPace: 79, highSpeedCornering: 78, mediumSpeedCornering: 78, lowSpeedCornering: 87, powerSensitivity: 86, reliability: 90, tyreWearFactor: 87, isLST: false },
  Alpine: { teamName: 'BWT Alpine F1 Team', overallPace: 76, highSpeedCornering: 75, mediumSpeedCornering: 75, lowSpeedCornering: 80, powerSensitivity: 85, reliability: 89, tyreWearFactor: 80, isLST: false },
  Cadillac: { teamName: 'Cadillac Racing', overallPace: 77, highSpeedCornering: 76, mediumSpeedCornering: 77, lowSpeedCornering: 81, powerSensitivity: 86, reliability: 91, tyreWearFactor: 81, isLST: false },
};

export const BASE_SPONSORSHIP_INCOME: Record<string, number> = {
  'Mercedes-AMG Petronas Formula One Team': 200_000_000,
  'Scuderia Ferrari': 185_000_000,
  'Oracle Red Bull Racing': 175_000_000,
  'McLaren Formula 1 Team': 135_000_000,
  'Aston Martin Aramco Formula One Team': 105_000_000,
  'BWT Alpine F1 Team': 90_000_000,
  'Stake F1 Team Kick Sauber': 70_000_000,
  'Williams Racing': 60_000_000,
  'Visa Cash App RB Formula One Team': 50_000_000,
  'MoneyGram Haas F1 Team': 42_000_000,
  'Cadillac Racing': 85_000_000,
};

export const TEAM_COLORS: { [key:string]: {teamColor: string, teamHexColor: string} } = {
  McLaren: { teamColor: 'bg-orange-500', teamHexColor: '#f97316' },
  RedBull: { teamColor: 'bg-indigo-900', teamHexColor: '#312e81' },
  Ferrari: { teamColor: 'bg-red-600', teamHexColor: '#dc2626' },
  Mercedes: { teamColor: 'bg-teal-400', teamHexColor: '#2dd4bf' },
  AstonMartin: { teamColor: 'bg-emerald-700', teamHexColor: '#047857' },
  Williams: { teamColor: 'bg-sky-500', teamHexColor: '#0ea5e9' },
  Sauber: { teamColor: 'bg-lime-500', teamHexColor: '#84cc16' },
  RB: { teamColor: 'bg-sky-800', teamHexColor: '#075985' },
  Haas: { teamColor: 'bg-gray-300 text-black', teamHexColor: '#d1d5db' },
  Alpine: { teamColor: 'bg-pink-500', teamHexColor: '#ec4899' },
  Cadillac: { teamColor: 'bg-blue-900', teamHexColor: '#1e3a8a' },
};

export const getTeamColors = (teamName: string) => {
    const teamKey = Object.keys(CARS).find(key => CARS[key].teamName === teamName);
    if (teamKey && TEAM_COLORS[teamKey]) {
        return TEAM_COLORS[teamKey];
    }
    return { teamColor: 'bg-gray-400', teamHexColor: '#9ca3af' };
};

// This index file is the new central export point for all constants.
export * from './drivers';
export * from './teams';
export * from './tracks';
export * from './personnel';
export * from './rookies';
export * from './traits';
export * from './trackSVGs';

export const POINTS_SYSTEM = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];

export const TEAM_EXPECTATIONS: Record<string, number> = {
  'McLaren Formula 1 Team': 1,
  'Oracle Red Bull Racing': 2,
  'Scuderia Ferrari': 3,
  'Mercedes-AMG Petronas Formula One Team': 4,
  'Williams Racing': 5,
  'Aston Martin Aramco Formula One Team': 6,
  'Stake F1 Team Kick Sauber': 7,
  'Visa Cash App RB Formula One Team': 8,
  'MoneyGram Haas F1 Team': 9,
  'BWT Alpine F1 Team': 10,
  'Cadillac Racing': 11,
};

export const LEGACY_TEAMS: Record<string, number> = {
    'Scuderia Ferrari': 10,
    'McLaren Formula 1 Team': 5,
    'Williams Racing': 5,
    'Mercedes-AMG Petronas Formula One Team': 3,
};

// Financial Model Constants from Section II
export const FINANCIAL_CONSTANTS = {
    PRIZE_POOL_BASELINE: 1_300_000_000,
    PRIZE_POOL_VARIATION: 0.05, // +/- 5%
    LST_BONUS_PERCENTAGE: 0.02, // Reduced from 0.05
    LST_BONUS_ESCALATION_THRESHOLD: 1_600_000_000,
    LST_BONUS_ESCALATION_PERCENTAGE: 0.04, // Reduced from 0.10
    CCB_POOL_PERCENTAGE: 0.20,
    TIER_3_PAYOUT_PERCENTAGES: {
        1: 0.140,
        2: 0.131,
        3: 0.122,
        4: 0.113,
        5: 0.104,
        6: 0.095,
        7: 0.086,
        8: 0.077,
        9: 0.068,
        10: 0.064,
    }
};

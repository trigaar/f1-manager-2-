
import { DriverTrait, DriverTraitRarity } from '../types';

export const DRIVER_TRAITS: { [id: string]: DriverTrait } = {
    RAIN_MASTER: {
        id: 'RAIN_MASTER',
        name: 'Rain Master',
        description: 'Excels in wet conditions, finding grip where others can\'t.',
        rarity: DriverTraitRarity.Rare,
    },
    TYRE_WHISPERER: {
        id: 'TYRE_WHISPERER',
        name: 'Tyre Whisperer',
        description: 'Has an innate feel for the tyres, extending their life beyond expectations.',
        rarity: DriverTraitRarity.Legendary,
    },
    MR_SATURDAY: {
        id: 'MR_SATURDAY',
        name: 'Mr. Saturday',
        description: 'A qualifying specialist who can extract the absolute maximum over a single lap.',
        rarity: DriverTraitRarity.Rare,
    },
    THE_OVERTAKER: {
        id: 'THE_OVERTAKER',
        name: 'The Overtaker',
        description: 'A master of late-braking and audacious moves, exceptionally strong in attack.',
        rarity: DriverTraitRarity.Legendary,
    },
    THE_WALL: {
        id: 'THE_WALL',
        name: 'The Wall',
        description: 'Incredibly difficult to pass, with flawless defensive positioning.',
        rarity: DriverTraitRarity.Rare,
    },
    CLUTCH_PERFORMER: {
        id: 'CLUTCH_PERFORMER',
        name: 'Clutch Performer',
        description: 'Thrives under pressure, often finding extra pace in the closing stages of a race.',
        rarity: DriverTraitRarity.Common,
    },
    MR_CONSISTENT: {
        id: 'MR_CONSISTENT',
        name: 'Mr. Consistent',
        description: 'An exceptionally reliable driver who rarely makes unforced errors.',
        rarity: DriverTraitRarity.Common,
    },
    ERROR_PRONE: {
        id: 'ERROR_PRONE',
        name: 'Error Prone',
        description: 'Prone to locking up or running wide, especially when under pressure.',
        rarity: DriverTraitRarity.Common,
    },
    ROCKET_START: {
        id: 'ROCKET_START',
        name: 'Rocket Start',
        description: 'Has an uncanny ability to gain positions on the opening lap.',
        rarity: DriverTraitRarity.Rare,
    },
    DRS_ASSASSIN: {
        id: 'DRS_ASSASSIN',
        name: 'DRS Assassin',
        description: 'Times DRS runs perfectly, maximizing straight-line attacks without cooking the tyres.',
        rarity: DriverTraitRarity.Rare,
    },
    NIGHT_OPS: {
        id: 'NIGHT_OPS',
        name: 'Night Ops',
        description: 'Composed under lights and changeable conditions, rarely rattled by chaos.',
        rarity: DriverTraitRarity.Rare,
    },
    STRATEGY_SAVANT: {
        id: 'STRATEGY_SAVANT',
        name: 'Strategy Savant',
        description: 'Reads tyre and fuel windows instinctively, stretching stints without losing pace.',
        rarity: DriverTraitRarity.Rare,
    }
};

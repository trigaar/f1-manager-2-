
import { InitialDriver, RookieDriver, RookiePotential, SponsorshipLevel } from '../types';
import { CARS } from '../constants';

const NEW_NAMES = [
    "Julian Bauer", "Leo Dubois", "Finn Janssen", "Marco Costa", "Alex Moreau", "Nico Weber",
    "Ricardo Silva", "Kenji Tanaka", "Elias Lindholm", "Stefan Novak", "Louis Chevalier", "Oscar Knight",
    "Javier Navarro", "Hugo Schmidt", "Enzo Rossi", "Tom Evans", "Felix Visser", "Theo Martins",
    "Caleb Foster", "Matteo Ricci"
];

const OLD_NAMES = [
    "Paris Blackburn", "Yasmin Jacobson", "Declan Crane", "Jakob Douglas", "Cory Schultz", "Claire Bartlett",
    "Kaitlyn Andersen", "Kristian Travis", "Noe Pennington", "Marquis Velazquez", "Janiyah Stuart", "Adriana Reed",
    "Luciana Villarreal", "Haylee Webb", "Antoine Liu", "Ariana Cardenas", "Hugh Donovan", "Haylee Skinner",
    "Lauryn Oneill", "Aubrey Wilkerson", "Vanessa Ellis", "Trinity Hendricks", "Julian Blevins", "Anabelle Cabrera",
    "Mireya Dennis", "Jadyn Mcconnell", "Fatima Bradley", "Carolyn Underwood", "Junior Bates", "Matteo Benton",
    "Brayan Jacobson", "Francis Davidson", "Arnav Collier", "Garrett Green", "Beau Watson", "Parker Barber"
];

const FULL_NAMES = [...new Set([...NEW_NAMES, ...OLD_NAMES])];


const AFFILIATIONS = [...Object.values(CARS).map(c => c.teamName), 'None', 'None', 'None'];
const SPONSORSHIPS: SponsorshipLevel[] = ['None', 'None', 'Small', 'Small', 'Medium'];

const POTENTIAL_DISTRIBUTION: RookiePotential[] = ['A', 'B', 'B', 'C', 'C', 'C', 'C', 'D', 'D', 'D'];

const generateRandomName = (existingNames: Set<string>): string => {
    const availableNames = FULL_NAMES.filter(name => !existingNames.has(name));
    if (availableNames.length === 0) {
        return `G. Player ${Math.floor(Math.random() * 1000)}`;
    }
    return availableNames[Math.floor(Math.random() * availableNames.length)];
};

const getStatsForPotential = (potential: RookiePotential): { paceRange: [number, number], consRange: [number, number] } => {
    switch (potential) {
        case 'A': return { paceRange: [82, 88], consRange: [75, 85] };
        case 'B': return { paceRange: [77, 84], consRange: [78, 86] };
        case 'C': return { paceRange: [72, 79], consRange: [74, 82] };
        case 'D': return { paceRange: [68, 75], consRange: [68, 80] };
    }
};

const generateRandomStat = (min: number, max: number): number => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const generateNewRookies = (count: number, existingRookies: RookieDriver[], allDrivers: InitialDriver[]): RookieDriver[] => {
    const newRookies: RookieDriver[] = [];
    const existingNames = new Set([...existingRookies.map(r => r.name), ...allDrivers.map(d => d.name)]);

    for (let i = 0; i < count; i++) {
        const name = generateRandomName(existingNames);
        if (existingNames.has(name)) continue;
        
        existingNames.add(name);

        const potential = POTENTIAL_DISTRIBUTION[Math.floor(Math.random() * POTENTIAL_DISTRIBUTION.length)];
        const { paceRange, consRange } = getStatsForPotential(potential);

        const rookie: RookieDriver = {
            name,
            rawPace: generateRandomStat(paceRange[0], paceRange[1]),
            consistency: generateRandomStat(consRange[0], consRange[1]),
            potential,
            affiliation: AFFILIATIONS[Math.floor(Math.random() * AFFILIATIONS.length)],
            sponsorship: SPONSORSHIPS[Math.floor(Math.random() * SPONSORSHIPS.length)],
        };
        newRookies.push(rookie);
    }

    return newRookies;
};

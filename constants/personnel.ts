
import { TeamPersonnel, TeamPrincipal, HeadOfTechnical, AffiliateDriver } from '../types';

export const INITIAL_PERSONNEL: TeamPersonnel[] = [
    {
        teamName: 'McLaren Formula 1 Team',
        hqLocation: 'Woking, UK',
        teamPrincipal: { name: 'Andrea Stella', negotiation: 16, financialAcumen: 17, leadership: 18, personality: 'Visionary', trait: 'Technical Mastermind' },
        headOfTechnical: { name: 'Rob Marshall', rdConversion: 19, innovation: 17, trait: 'Red Bull Defector' },
        affiliateDriver: null,
        facilities: { aero: 9, chassis: 9, powertrain: 7 }
    },
    {
        teamName: 'Oracle Red Bull Racing',
        hqLocation: 'Milton Keynes, UK',
        teamPrincipal: { name: 'Christian Horner', negotiation: 19, financialAcumen: 15, leadership: 17, personality: 'Ruthless Operator', trait: 'Political Powerhouse' },
        headOfTechnical: { name: 'Pierre Waché', rdConversion: 20, innovation: 16, trait: 'Simulation Expert' },
        affiliateDriver: null,
        facilities: { aero: 10, chassis: 8, powertrain: 10 }
    },
    {
        teamName: 'Scuderia Ferrari',
        hqLocation: 'Maranello, IT',
        teamPrincipal: { name: 'Frédéric Vasseur', negotiation: 17, financialAcumen: 16, leadership: 16, personality: 'Pragmatist', trait: 'Driver-Focused Leader' },
        headOfTechnical: { name: 'Enrico Cardile', rdConversion: 18, innovation: 18, trait: 'Chassis Specialist' },
        affiliateDriver: null,
        facilities: { aero: 8, chassis: 9, powertrain: 9 }
    },
    {
        teamName: 'Mercedes-AMG Petronas Formula One Team',
        hqLocation: 'Brackley, UK',
        teamPrincipal: { name: 'Toto Wolff', negotiation: 20, financialAcumen: 19, leadership: 19, personality: 'Ruthless Operator', trait: 'Serial Winner' },
        headOfTechnical: { name: 'James Allison', rdConversion: 18, innovation: 20, trait: 'Comeback King' },
        affiliateDriver: null,
        facilities: { aero: 9, chassis: 10, powertrain: 8 }
    },
    {
        teamName: 'Aston Martin Aramco Formula One Team',
        hqLocation: 'Silverstone, UK',
        teamPrincipal: { name: 'Mike Krack', negotiation: 14, financialAcumen: 13, leadership: 15, personality: 'Pragmatist', trait: 'Calm Operator' },
        headOfTechnical: { name: 'Dan Fallows', rdConversion: 17, innovation: 18, trait: 'Concept Visionary' },
        affiliateDriver: null,
        facilities: { aero: 8, chassis: 7, powertrain: 8 }
    },
    {
        teamName: 'Williams Racing',
        hqLocation: 'Grove, UK',
        teamPrincipal: { name: 'James Vowles', negotiation: 15, financialAcumen: 18, leadership: 17, personality: 'Visionary', trait: 'Long-Term Planner' },
        headOfTechnical: { name: 'Pat Fry', rdConversion: 16, innovation: 14, trait: 'Seasoned Veteran' },
        affiliateDriver: null,
        facilities: { aero: 6, chassis: 7, powertrain: 8 }
    },
    {
        teamName: 'Stake F1 Team Kick Sauber',
        hqLocation: 'Hinwil, CH',
        teamPrincipal: { name: 'Alessandro Alunni Bravi', negotiation: 13, financialAcumen: 12, leadership: 13, personality: 'Pragmatist', trait: 'Corporate Navigator' },
        headOfTechnical: { name: 'James Key', rdConversion: 15, innovation: 15, trait: 'Journeyman Genius' },
        affiliateDriver: null,
        facilities: { aero: 7, chassis: 6, powertrain: 7 }
    },
    {
        teamName: 'Visa Cash App RB Formula One Team',
        hqLocation: 'Faenza, IT',
        teamPrincipal: { name: 'Laurent Mekies', negotiation: 16, financialAcumen: 14, leadership: 15, personality: 'Visionary', trait: 'Rising Star' },
        headOfTechnical: { name: 'Jody Egginton', rdConversion: 14, innovation: 13, trait: 'Midfield Specialist' },
        affiliateDriver: null,
        facilities: { aero: 7, chassis: 7, powertrain: 6 }
    },
    {
        teamName: 'MoneyGram Haas F1 Team',
        hqLocation: 'Kannapolis, US',
        teamPrincipal: { name: 'Ayao Komatsu', negotiation: 12, financialAcumen: 14, leadership: 14, personality: 'Pragmatist', trait: 'Engineering Lead' },
        headOfTechnical: { name: 'Andrea De Zordo', rdConversion: 13, innovation: 12, trait: 'Pragmatic Designer' },
        affiliateDriver: null,
        facilities: { aero: 5, chassis: 6, powertrain: 7 }
    },
    {
        teamName: 'BWT Alpine F1 Team',
        hqLocation: 'Enstone, UK',
        teamPrincipal: { name: 'Bruno Famin', negotiation: 11, financialAcumen: 11, leadership: 12, personality: 'Pragmatist', trait: 'Corporate Firefighter' },
        headOfTechnical: { name: 'David Sanchez', rdConversion: 14, innovation: 16, trait: 'Aero Philosopher' },
        affiliateDriver: null,
        facilities: { aero: 6, chassis: 5, powertrain: 5 }
    },
    {
        teamName: 'Cadillac Racing',
        hqLocation: 'TBC',
        teamPrincipal: { name: 'Graeme Lowdon', negotiation: 16, financialAcumen: 17, leadership: 16, personality: 'Visionary', trait: 'New Team Specialist' },
        headOfTechnical: { name: 'Eric Marent', rdConversion: 15, innovation: 16, trait: 'Le Mans Veteran' },
        affiliateDriver: null,
        facilities: { aero: 6, chassis: 6, powertrain: 6 }
    }
];

export const AVAILABLE_STAFF_POOL: {
    teamPrincipals: TeamPrincipal[];
    headsOfTechnical: HeadOfTechnical[];
} = {
    teamPrincipals: [
        { name: 'Marcus Schmidt', negotiation: 15, financialAcumen: 20, leadership: 15, personality: 'Pragmatist', trait: 'Cost Cap Guru' },
        { name: 'Isabelle Dubois', negotiation: 19, financialAcumen: 16, leadership: 16, personality: 'Pragmatist', trait: 'Sponsor Magnet' },
        { name: 'Kenji Tanaka', negotiation: 16, financialAcumen: 17, leadership: 18, personality: 'Visionary', trait: 'Engine Whisperer' },
        { name: 'Eleanor Vance', negotiation: 18, financialAcumen: 15, leadership: 19, personality: 'Loyalist', trait: 'Legacy Builder' },
        { name: 'Javier Mendoza', negotiation: 17, financialAcumen: 14, leadership: 17, personality: 'Visionary', trait: 'Young Gun' },
        { name: 'Mattia Binotto', negotiation: 14, financialAcumen: 15, leadership: 16, personality: 'Pragmatist', trait: 'Strategy Savant' },
        { name: 'Otmar Szafnauer', negotiation: 16, financialAcumen: 17, leadership: 14, personality: 'Pragmatist', trait: 'Midfield Maestro' },
        { name: 'Guenther Steiner', negotiation: 18, financialAcumen: 14, leadership: 15, personality: 'Loyalist', trait: 'Fan Favourite' },
        { name: 'Jost Capito', negotiation: 15, financialAcumen: 16, leadership: 17, personality: 'Visionary', trait: 'Turnaround Artist' },
    ],
    headsOfTechnical: [
        { name: 'Adrian Newey', rdConversion: 19, innovation: 20, trait: 'The Aerodynamicist' },
        { name: 'Hannah Schmitz', rdConversion: 15, innovation: 16, trait: 'Under Pressure Strategist' },
        { name: 'Peter Bonnington', rdConversion: 16, innovation: 15, trait: 'Driver Whisperer' },
        { name: 'Eric Blandin', rdConversion: 17, innovation: 15, trait: 'CFD Specialist' },
        { name: 'Simone Resta', rdConversion: 15, innovation: 14, trait: 'Reliability Expert' },
        { name: ' Aldo Costa', rdConversion: 18, innovation: 18, trait: 'Championship Pedigree' },
        { name: 'Mike Elliott', rdConversion: 17, innovation: 19, trait: 'Radical Thinker' },
    ]
};

export const AFFILIATE_CANDIDATES: AffiliateDriver[] = [
    { name: 'Theo Pourchaire', skill: 78, potential: 92, age: 21 },
    { name: 'Frederik Vesti', skill: 77, potential: 90, age: 22 },
    { name: 'Ayumu Iwasa', skill: 76, potential: 91, age: 23 },
    { name: 'Victor Martins', skill: 75, potential: 93, age: 23 },
    { name: 'Zane Maloney', skill: 74, potential: 89, age: 21 },
    { name: 'Dennis Hauger', skill: 73, potential: 88, age: 22 },
];

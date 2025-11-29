





import { CarLink, InitialDriver, DriverMarketEvent, RookieDriver, TeamFinances, TeamPersonnel, TeamPrincipalPersonality, RookiePotential, DriverTrait, DriverTraitRarity, ShortlistDriver, TeamDebrief, DriverDebrief } from '../types';
import { CARS, DRIVER_TRAITS, TEAM_EXPECTATIONS, TEAM_COLORS } from '../constants';
import { generateNewRookies } from './rookieService';

const ROOKIE_FIRST_NAMES = ['Luca', 'Maya', 'Felix', 'Isabela', 'Noah', 'Arjun', 'Liam', 'Sophia', 'Mateo', 'Hana', 'Theo', 'Nia'];
const ROOKIE_LAST_NAMES = ['Alvarez', 'Tanaka', 'Moretti', 'Okafor', 'Kuznetsov', 'Dubois', 'Hernandez', 'Ivanov', 'Petrov', 'Martinez', 'Singh', 'Bennett'];

const generateUniqueRookieName = (existingNames: Set<string>): string => {
    for (let i = 0; i < ROOKIE_FIRST_NAMES.length * ROOKIE_LAST_NAMES.length; i++) {
        const first = ROOKIE_FIRST_NAMES[Math.floor(Math.random() * ROOKIE_FIRST_NAMES.length)];
        const last = ROOKIE_LAST_NAMES[Math.floor(Math.random() * ROOKIE_LAST_NAMES.length)];
        const candidate = `${first} ${last}`;
        if (!existingNames.has(candidate)) return candidate;
    }
    return `Rookie ${Math.floor(100 + Math.random() * 900)}`;
};

type DriverCareerArc = 'Young Lion' | 'Proven Star' | 'Seasoned Veteran';
type TeamTier = 'Contender' | 'Upper Midfield' | 'Lower Midfield' | 'Backmarker';

export const getTeamTier = (tpr: number): TeamTier => {
    if (tpr >= 92) return 'Contender';
    if (tpr >= 82) return 'Upper Midfield';
    if (tpr >= 70) return 'Lower Midfield';
    return 'Backmarker';
};

export const resolveContractOffer = (
    driver: InitialDriver,
    driverDsv: number,
    teamTpr: number,
    offerType: 'Lower' | 'Same' | 'Higher'
): boolean => {
    let baseChance = 0.60; // Base for a 'Same' offer

    // Loyalty modifier: can swing chance by +/- 20%
    baseChance += (driver.driverSkills.loyalty - 80) / 100 * 0.4;

    // Team Performance modifier
    const teamTier = getTeamTier(teamTpr);
    const teamTierBonus = { 'Contender': 0.15, 'Upper Midfield': 0.05, 'Lower Midfield': -0.10, 'Backmarker': -0.25 };
    baseChance += teamTierBonus[teamTier];

    // Market Value modifier
    if (driverDsv > 90) baseChance -= 0.15; // Star driver knows their worth
    if (driverDsv < 70) baseChance += 0.10; // Driver may be happy to have a seat

    // Happiness/Morale modifier: can swing chance by +/- 10%
    baseChance += ((driver.happiness + driver.morale) / 2 - 75) / 100 * 0.2;

    // Offer Type modifier
    if (offerType === 'Higher') baseChance += 0.30;
    if (offerType === 'Lower') baseChance -= 0.40;

    return Math.random() < baseChance;
}

export const generateRookieDriver = (rookie: RookieDriver, teamName: string, id: number): InitialDriver => {
    const car = CARS[Object.keys(CARS).find(k => CARS[k as keyof typeof CARS].teamName === teamName)! as keyof typeof CARS];
    const qPace = rookie.rawPace;
    const rCraft = Math.round(rookie.rawPace * 0.8);
    const tMng = Math.round(rookie.consistency * 0.9);
    const cons = rookie.consistency;

    const rookiePotentialToNumber = (potential: RookiePotential): number => {
        switch (potential) {
            case 'A': return 90 + Math.floor(Math.random() * 9); // 90-98
            case 'B': return 82 + Math.floor(Math.random() * 8); // 82-89
            case 'C': return 74 + Math.floor(Math.random() * 8); // 74-81
            case 'D': return 65 + Math.floor(Math.random() * 9); // 65-73
        }
    };

    const traitPoolByRarity = {
        common: (Object.values(DRIVER_TRAITS) as DriverTrait[]).filter(t => t.rarity === DriverTraitRarity.Common),
        rare: (Object.values(DRIVER_TRAITS) as DriverTrait[]).filter(t => t.rarity === DriverTraitRarity.Rare),
    };

    const deriveSpecialtiesFromTrait = (trait: DriverTrait | undefined, seedSpecialties?: string[]): string[] => {
        const specialties = seedSpecialties ? [...seedSpecialties] : [];
        if (!trait) return specialties.length ? specialties.slice(0, 2) : ['Track Learner'];

        switch (trait.id) {
            case DRIVER_TRAITS.TYRE_WHISPERER.id:
                specialties.push('Tyre Life', 'Heat Control');
                break;
            case DRIVER_TRAITS.MR_SATURDAY.id:
                specialties.push('One Lap Pace');
                break;
            case DRIVER_TRAITS.THE_OVERTAKER.id:
                specialties.push('Racecraft Bully', 'Brake Confidence');
                break;
            case DRIVER_TRAITS.THE_WALL.id:
                specialties.push('Defensive Lines');
                break;
            case DRIVER_TRAITS.RAIN_MASTER.id:
                specialties.push('Wet Weather');
                break;
            case DRIVER_TRAITS.ROCKET_START.id:
                specialties.push('Launch Specialist');
                break;
            case DRIVER_TRAITS.DRS_ASSASSIN.id:
                specialties.push('DRS Timing');
                break;
            case DRIVER_TRAITS.NIGHT_OPS.id:
                specialties.push('Night Rhythm');
                break;
            case DRIVER_TRAITS.STRATEGY_SAVANT.id:
                specialties.push('Stint Stretching');
                break;
            default:
                specialties.push('Clutch Moments');
                break;
        }

        const unique = Array.from(new Set(specialties));
        const max = trait.rarity === DriverTraitRarity.Legendary ? 3 : 2;
        return unique.slice(0, max || 2);
    };

    const pickTraitForRookie = (potential: RookiePotential): DriverTrait => {
        const rareBias = potential === 'A' ? 0.45 : potential === 'B' ? 0.25 : 0.1;
        const pool = Math.random() < rareBias && traitPoolByRarity.rare.length > 0
            ? traitPoolByRarity.rare
            : traitPoolByRarity.common;
        return pool[Math.floor(Math.random() * pool.length)] || traitPoolByRarity.common[0];
    };

    const randomTrait = pickTraitForRookie(rookie.potential);
    const derivedSpecialties = deriveSpecialtiesFromTrait(randomTrait, rookie.specialties);

    const carLink: CarLink = {
        compatibility: 60 + Math.floor(Math.random() * 25) + (randomTrait.id === DRIVER_TRAITS.RAIN_MASTER.id ? 5 : 0),
        adaptation: 55 + Math.floor(Math.random() * 30) + (rookie.potential === 'A' ? 10 : 0),
        notes: 'Rookie adapting to senior car concepts',
    };

    return {
        id, name: rookie.name, shortName: rookie.name.substring(0, 3).toUpperCase(), number: 50 + id,
        driverSkills: {
            overall: Math.round((qPace + rCraft + tMng + cons) / 4), qualifyingPace: qPace, raceCraft: rCraft,
            tyreManagement: tMng, consistency: cons, wetWeatherSkill: 75 + Math.floor(Math.random() * 10),
            aggressionIndex: 65 + Math.floor(Math.random() * 15), incidentProneness: 65 + Math.floor(Math.random() * 15),
            loyalty: 70 + Math.floor(Math.random() * 15), // Rookies start fairly loyal
            potential: rookiePotentialToNumber(rookie.potential),
            reputation: 60 + Math.floor(Math.random() * 10),
            specialties: derivedSpecialties,
            trait: randomTrait,
        },
        carLink,
        car, rookie: true, age: 18 + Math.floor(Math.random() * 7),
        contractExpiresIn: 1 + Math.floor(Math.random() * 2),
        careerWins: 0, careerPodiums: 0, championships: 0, status: 'Active', peakDsv: 0, salary: 750000 + Math.floor(Math.random() * 250000),
        yearsAsFreeAgent: 0,
        form: 0,
        careerHistory: {}, // Initialized empty, will be populated by App state
        happiness: 85,
        morale: 85,
    };
};

const getDriverCareerArc = (driver: InitialDriver, dsv: number): DriverCareerArc => {
    if (driver.age >= 36 || (driver.age > 32 && dsv < 80)) {
        return 'Seasoned Veteran';
    }
    if ((driver.championships > 0 && driver.age < 36) || dsv > 90) {
        return 'Proven Star';
    }
    return 'Young Lion';
};

const calculateCandidateScore = (
    candidate: InitialDriver | RookieDriver,
    dsv: number, // Only for FAs
    team: TeamDebrief,
    personnel: TeamPersonnel
): number => {
    let score = 0;
    const personality = personnel.teamPrincipal?.personality || 'Pragmatist';
    
    // Base scores
    if ('rawPace' in candidate) { // Rookie
        score = (candidate.rawPace * 0.5) + (candidate.consistency * 0.3);
        if (candidate.potential === 'A') score += 15;
        if (candidate.potential === 'B') score += 5;
        if (candidate.sponsorship !== 'None') score += 5;
    } else { // Free Agent
        score = dsv;
    }

    // Personality modifiers
    switch (personality) {
        case 'Visionary':
            if ('rawPace' in candidate) score *= 1.3;
            else if (candidate.age < 26) score *= 1.2;
            break;
        
        case 'Pragmatist':
            if ('rawPace' in candidate) {
                if(candidate.sponsorship === 'Medium') score += 15;
                if(candidate.sponsorship === 'Small') score += 8;
            } else {
                if (candidate.salary < 5000000) score += 10;
                if (dsv > 75 && dsv < 88) score += 10;
            }
            break;

        case 'Ruthless Operator':
            if ('rawPace' in candidate) {
                score *= 0.5;
                if (candidate.potential === 'A') score *= 1.5;
            } else {
                score = dsv; 
                if (candidate.age > 33) score -= 15;
            }
            break;
        
        case 'Loyalist':
            score *= 0.9;
            break;
    }

    // --- NEW: Team Affiliation Modifiers ---
    if ('rawPace' in candidate) { // It's a rookie
        const rookie = candidate as RookieDriver;
        if (team.teamName === 'Visa Cash App RB Formula One Team' && rookie.affiliation === 'Red Bull') {
            score += 30; // Strong preference for Red Bull juniors
        }
        if (team.teamName === 'MoneyGram Haas F1 Team' && rookie.affiliation === 'Ferrari') {
            score += 25; // Strong preference for Ferrari juniors
        }
        if (team.teamName === 'Williams Racing' && rookie.affiliation === 'Mercedes') {
            score += 20; // Preference for Mercedes juniors
        }
    } else { // It's a free agent
        const fa = candidate as InitialDriver;
        // Check if a Red Bull seat is open and the candidate is from the junior team
        if (team.teamName === 'Oracle Red Bull Racing' && fa.car.teamName === 'Visa Cash App RB Formula One Team') {
            score += 25; // Red Bull strongly prefers to promote from their junior team
        }
    }
    
    return score;
};

const signRookieToTeam = (
    rookie: RookieDriver,
    team: TeamDebrief,
    roster: InitialDriver[],
    log: DriverMarketEvent[],
    rookiesUsed: string[]
): InitialDriver => {
    const newId = Math.max(100, ...roster.map(d => d.id)) + 1;
    const newDriver = generateRookieDriver(rookie, team.teamName, newId);
    
    roster.push(newDriver);
    log.push({ type: 'ROOKIE', driverName: newDriver.name, toTeam: team.teamName });
    
    if (!rookie.name.startsWith('G. Player')) {
        rookiesUsed.push(rookie.name);
    }

    return newDriver;
};

export const generatePlayerShortlist = (
    playerTeamName: string,
    playerTeamTpr: number,
    roster: InitialDriver[],
    driverDebriefs: DriverDebrief[],
    mvi: number,
    teamDebriefs: TeamDebrief[]
): ShortlistDriver[] => {
    const shortlist: ShortlistDriver[] = [];
    const allDrivers = roster.filter(d => d.status !== 'Retired' && d.car.teamName !== playerTeamName);
    const teamDebriefsMap = new Map(teamDebriefs.map(t => [t.teamName, t]));

    allDrivers.forEach(driver => {
        const dsv = driverDebriefs.find(d => d.driverId === driver.id)?.dsv || 70;
        let interestScore = 0;
        let reason = '';

        if (driver.status === 'Free Agent') {
            interestScore += 50; // Base interest for being available
            interestScore += dsv / 5; // Higher value FAs are more sought after
            reason = 'Top free agent on the market.';
        } else {
            // It's a driver on another team
            const driverTeamTpr = teamDebriefsMap.get(driver.car.teamName)?.tpr || 70;
            const tprDiff = playerTeamTpr - driverTeamTpr;

            if (tprDiff > 10) {
                interestScore += tprDiff * 1.5; // Strong interest in moving up the grid
                reason = `Seeking a move to a more competitive team.`;
            }

            if (driver.contractExpiresIn <= 1) {
                interestScore += 30;
                reason = `Contract is expiring, exploring options.`;
            }
        }
        
        interestScore -= (driver.driverSkills.loyalty - 80) * 0.5; // Loyal drivers are less likely to move
        interestScore += (mvi / 100) * 20; // High MVI makes more moves possible

        if (interestScore > 50) {
            shortlist.push({
                ...driver,
                interestReason: reason,
                signingChance: Math.min(95, Math.round(interestScore)),
            });
        }
    });

    return shortlist.sort((a,b) => b.signingChance - a.signingChance).slice(0, 10);
}

// Main Refactored Service
export const runDriverMarket = (
    currentRoster: InitialDriver[],
    driverDebriefs: DriverDebrief[],
    teamDebriefs: TeamDebrief[],
    mvi: number,
    teamFinances: TeamFinances[],
    personnel: TeamPersonnel[],
    rookiePool: RookieDriver[],
    playerTeamName: string,
    season: number
): { newRoster: InitialDriver[], log: DriverMarketEvent[], rookiesUsed: string[] } => {
    
    let newRoster = JSON.parse(JSON.stringify(currentRoster)) as InitialDriver[];
    const log: DriverMarketEvent[] = [];
    let availableRookies = [...rookiePool];
    const rookiesUsed: string[] = [];
    const ensureCadillacRepresentation = () => {
        const hasCadillacDebrief = teamDebriefs.some(t => t.teamName === 'Cadillac Racing');
        if (!hasCadillacDebrief) {
            teamDebriefs.push({ teamName: 'Cadillac Racing', tpr: 80 });
        }

        const hasCadillacFinance = teamFinances.some(f => f.teamName === 'Cadillac Racing');
        if (!hasCadillacFinance) {
            teamFinances.push({
                teamName: 'Cadillac Racing',
                teamHexColor: TEAM_COLORS['Cadillac'].teamHexColor,
                prizeMoney: { total: 0, lstBonus: 0, ccbBonus: 0, performancePayout: 0 },
                sponsorshipIncome: 70_000_000,
                driverSalaries: 0,
                finalBudget: 70_000_000,
                carDevelopmentBudget: 25_000_000,
                personnelInvestment: 15_000_000,
                driverAcquisitionFund: 30_000_000,
            });
        }
    };

    ensureCadillacRepresentation();

    const teamsSortedByTpr = [...teamDebriefs].sort((a, b) => b.tpr - a.tpr);
    const aiTeams = teamsSortedByTpr.filter(t => t.teamName !== playerTeamName);

    // --- Phase 1: Ageing and Contract Expiry ---
    newRoster.forEach(driver => {
        driver.age += 1;
        if (driver.status === 'Active') {
             driver.contractExpiresIn -= 1;
        } else if (driver.status === 'Free Agent') {
            driver.yearsAsFreeAgent = (driver.yearsAsFreeAgent || 0) + 1;
        }
    });

    // --- Phase 2: AI Contract Renewals ---
    aiTeams.forEach(team => {
        const driversOnTeam = newRoster.filter(d => d.car.teamName === team.teamName && d.status === 'Active');
        driversOnTeam.forEach(driver => {
            if (driver.contractExpiresIn > 0) return; // Not up for renewal

            const driverDebrief = driverDebriefs.find(d => d.driverId === driver.id)!;
            const dsv = driverDebrief.dsv;
            const teamPersonnel = personnel.find(p => p.teamName === team.teamName)!;
            const personality = teamPersonnel.teamPrincipal?.personality;

            let offerType: 'Lower' | 'Same' | 'Higher' = 'Same';
            if (dsv > 92 && personality !== 'Ruthless Operator') offerType = 'Higher';
            else if (dsv < 75 && personality !== 'Loyalist') offerType = 'Lower';

            const accepted = resolveContractOffer(driver, dsv, team.tpr, offerType);

            if (accepted) {
                driver.contractExpiresIn = Math.floor(1 + Math.random() * 3);
                log.push({ type: 'RETAINED', driverName: driver.name, toTeam: team.teamName });
            } else {
                driver.status = 'Free Agent';
                log.push({ type: 'DROPPED', driverName: driver.name, fromTeam: team.teamName });
            }
        });
    });

    // Handle Player's expiring contracts that were not renewed in-season
    const playerDrivers = newRoster.filter(d => d.car.teamName === playerTeamName);
    playerDrivers.forEach(driver => {
        if (driver.contractExpiresIn <= 0 && driver.negotiationStatus !== 'Signed') {
            driver.status = 'Free Agent';
            // Note: A log for this is created in the UI-facing logic to avoid duplicates
        }
        // Reset negotiation status for next season
        driver.negotiationStatus = undefined;
    });


    const ensureCadillacSecuresDebutDrivers = () => {
        if (season !== 2025) return;
        const cadillacTeam = aiTeams.find(t => t.teamName === 'Cadillac Racing');
        if (!cadillacTeam) return;

        const cadillacFinance = teamFinances.find(f => f.teamName === 'Cadillac Racing');
        const cadillacCar = CARS['Cadillac'];

        if (!cadillacFinance || !cadillacCar) return;

        const targetDrivers = newRoster
            .filter(d => d.status === 'Free Agent' && d.car.teamName !== playerTeamName)
            .sort((a, b) => b.driverSkills.overall - a.driverSkills.overall);

        let cadillacDrivers = newRoster.filter(d => d.car.teamName === 'Cadillac Racing' && d.status === 'Active');
        while (cadillacDrivers.length < 2 && targetDrivers.length > 0) {
            const signing = targetDrivers.shift();
            if (!signing) break;

            signing.status = 'Active';
            signing.car = cadillacCar;
            signing.contractExpiresIn = 2;
            cadillacFinance.driverAcquisitionFund = Math.max(0, cadillacFinance.driverAcquisitionFund - signing.salary);
            log.push({ type: 'SIGNED', driverName: signing.name, toTeam: 'Cadillac Racing' });
            cadillacDrivers = newRoster.filter(d => d.car.teamName === 'Cadillac Racing' && d.status === 'Active');
        }
    };

    ensureCadillacSecuresDebutDrivers();

    // --- Phase 3: Free Agent & Rookie Signings for AI Teams ---
    for (let round = 0; round < 2; round++) {
        aiTeams.forEach(team => {
            const currentDrivers = newRoster.filter(d => d.car.teamName === team.teamName && d.status === 'Active');
            if (currentDrivers.length >= 2) return;

            const teamPersonnel = personnel.find(p => p.teamName === team.teamName)!;
            const teamFinance = teamFinances.find(f => f.teamName === team.teamName)!;

            const availableCandidates: (InitialDriver | RookieDriver)[] = [
                ...newRoster.filter(d => d.status === 'Free Agent' && d.car.teamName !== playerTeamName), // AI CANNOT poach from player
                ...availableRookies
            ];

            const shortlist = availableCandidates
                .filter(c => {
                    const salary = 'salary' in c ? c.salary : 1000000;
                    return teamFinance.driverAcquisitionFund >= salary;
                })
                .map(candidate => {
                    const dsv = 'id' in candidate ? driverDebriefs.find(dd => dd.driverId === candidate.id)?.dsv || 50 : 0;
                    return { candidate, score: calculateCandidateScore(candidate, dsv, team, teamPersonnel) };
                })
                .sort((a, b) => b.score - a.score);

            if (shortlist.length > 0) {
                const topPick = shortlist[0].candidate;
                if ('id' in topPick) { // Sign Free Agent
                    const driverToSign = newRoster.find(d => d.id === topPick.id)!;
                    driverToSign.status = 'Active';
                    driverToSign.car = CARS[Object.keys(CARS).find(k => CARS[k as keyof typeof CARS].teamName === team.teamName)! as keyof typeof CARS];
                    driverToSign.contractExpiresIn = 1 + Math.floor(Math.random() * 2);
                    teamFinance.driverAcquisitionFund -= driverToSign.salary;
                    log.push({ type: 'SIGNED', driverName: driverToSign.name, toTeam: team.teamName });
                } else { // Sign Rookie
                    const newDriver = signRookieToTeam(topPick, team, newRoster, log, rookiesUsed);
                    availableRookies = availableRookies.filter(r => r.name !== newDriver.name);
                    teamFinance.driverAcquisitionFund -= newDriver.salary;
                }
            }
        });
    }
    
    // --- Phase 4: Final Roster Fill (Mandatory for AI) ---
    aiTeams.forEach(team => {
        let driversOnTeam = newRoster.filter(d => d.car.teamName === team.teamName && d.status === 'Active');
        while (driversOnTeam.length < 2) {
            const teamFinance = teamFinances.find(f => f.teamName === team.teamName)!;
            const teamPersonnel = personnel.find(p => p.teamName === team.teamName)!;

            const candidates = [
                ...newRoster.filter(d => d.status === 'Free Agent' && d.car.teamName !== playerTeamName),
                ...availableRookies
            ].map(candidate => {
                const dsv = 'id' in candidate ? driverDebriefs.find(dd => dd.driverId === candidate.id)?.dsv || 50 : 0;
                return { candidate, score: calculateCandidateScore(candidate, dsv, team, teamPersonnel) };
            }).sort((a, b) => b.score - a.score);
            
            const bestAffordable = candidates.find(c => ('salary' in c.candidate ? c.candidate.salary : 1000000) <= teamFinance.driverAcquisitionFund);

            if (bestAffordable) {
                const topPick = bestAffordable.candidate;
                 if ('id' in topPick) { // Sign Free Agent
                    const driverToSign = newRoster.find(d => d.id === topPick.id)!;
                    driverToSign.status = 'Active';
                    driverToSign.car = CARS[Object.keys(CARS).find(k => CARS[k as keyof typeof CARS].teamName === team.teamName)! as keyof typeof CARS];
                    driverToSign.contractExpiresIn = 1; // 1 year deal for last-minute signing
                    teamFinance.driverAcquisitionFund -= driverToSign.salary;
                    log.push({ type: 'SIGNED', driverName: driverToSign.name, toTeam: team.teamName });
                } else { // Sign Rookie
                    const newDriver = signRookieToTeam(topPick, team, newRoster, log, rookiesUsed);
                    availableRookies = availableRookies.filter(r => r.name !== newDriver.name);
                    teamFinance.driverAcquisitionFund -= newDriver.salary;
                }
            } else {
                 const existingNames = new Set<string>([
                    ...newRoster.map(d => d.name),
                    ...availableRookies.map(r => r.name),
                    ...rookiesUsed
                 ]);
                 const generatedName = generateUniqueRookieName(existingNames);
                 const newRookieData: RookieDriver = {
                    name: generatedName,
                    rawPace: 68,
                    consistency: 72,
                    potential: 'D',
                    affiliation: 'None',
                    sponsorship: 'Small'
                };
                const newDriver = signRookieToTeam(newRookieData, team, newRoster, log, rookiesUsed);
                availableRookies = availableRookies.filter(r => r.name !== newDriver.name);
            }
            driversOnTeam = newRoster.filter(d => d.car.teamName === team.teamName && d.status === 'Active');
        }
    });

    // --- Phase 5: Final Retirements ---
     newRoster.forEach(driver => {
        if (driver.status === 'Free Agent' && driver.age > 37) {
            driver.status = 'Retired';
            log.push({ type: 'RETIRED', driverName: driver.name });
        }
    });

    return { newRoster, log, rookiesUsed };
};